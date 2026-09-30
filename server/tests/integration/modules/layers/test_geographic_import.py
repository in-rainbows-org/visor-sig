import io
import os
import uuid
import zipfile
import pytest
import shapely.geometry
import shapely.wkb
from sqlalchemy import text

from app.core.dependencies import get_event_bus
from app.modules.layers.application.use_cases.import_geographic_data import (
    ImportGeographicDataCommand,
    ImportGeographicDataUseCase,
)
from app.modules.layers.domain.entities.data_version import DataVersion
from app.modules.layers.domain.enums import DataVersionStatus, GeometryType, LayerColor, LayerKind
from app.modules.layers.domain.exceptions import IncompatibleGeometryTypeException
from app.modules.layers.infrastructure.persistence.models.lote_model import LoteModel
from app.modules.layers.infrastructure.persistence.repositories.sqlmodel_data_version_repository import (
    SqlModelDataVersionRepository,
)
from app.modules.layers.infrastructure.persistence.repositories.sqlmodel_lote_repository import (
    SqlModelLoteRepository,
)
from app.modules.layers.infrastructure.persistence.repositories.sqlmodel_codigo_fijo_repository import (
    SqlModelCodigoFijoRepository,
)
from app.modules.layers.infrastructure.processing.pyogrio_shapefile_processor import (
    PyogrioShapefileProcessor,
)
from app.modules.layers.domain.entities.layer import Layer
from app.modules.layers.infrastructure.persistence.repositories.sqlmodel_layer_repository import (
    SqlModelLayerRepository,
)
from app.shared.infrastructure.unit_of_work import SqlModelUnitOfWork
from tests.fixtures_shapefiles import build_lotes_zip

FIXTURE_DIR = "venv/lib/python3.14/site-packages/pyogrio/tests/fixtures/naturalearth_lowres"


def _build_zip() -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        for fname in os.listdir(FIXTURE_DIR):
            file_path = os.path.join(FIXTURE_DIR, fname)
            zf.write(file_path, arcname=fname)
    return buf.getvalue()


def test_postgis_srid_and_typed_persistence(db_session):
    layer_repo = SqlModelLayerRepository(db_session)
    version_repo = SqlModelDataVersionRepository(db_session)
    lote_repo = SqlModelLoteRepository(db_session)

    layer = layer_repo.find_by_kind(LayerKind.LOTES)
    assert layer is not None

    version = DataVersion(
        id=uuid.uuid4(),
        layer_id=layer.id,
        version_number=version_repo.get_next_version_number(layer.id),
        source_filename="test.zip",
        status=DataVersionStatus.READY,
        feature_count=1,
    )
    version_repo.save(version)

    # Crear una geometría poligonal en WGS84
    poly = shapely.geometry.Polygon([(0, 0), (1, 0), (1, 1), (0, 1), (0, 0)])
    mpoly = shapely.geometry.MultiPolygon([poly])
    wkt_str = mpoly.wkt

    lote = LoteModel(
        id=uuid.uuid4(),
        data_version_id=version.id,
        source_feature_id="LOT-001",
        source_id=101,
        lot_number="12A",
        geometry=wkt_str,
    )
    lote_repo.bulk_insert([lote])

    # Verificar SRID y tipo espacial en PostGIS mediante consulta SQL
    result = db_session.execute(
        text(
            "SELECT ST_SRID(geometry) AS srid, ST_GeometryType(geometry) AS gtype, "
            "lot_number, source_id "
            "FROM lotes WHERE id = :fid"
        ),
        {"fid": lote.id},
    ).fetchone()

    assert result is not None
    assert result.srid == 4326
    assert result.gtype == "ST_MultiPolygon"
    assert result.lot_number == "12A"
    assert result.source_id == 101


def test_spatial_index_gist_query(db_session):
    layer_repo = SqlModelLayerRepository(db_session)
    version_repo = SqlModelDataVersionRepository(db_session)
    lote_repo = SqlModelLoteRepository(db_session)

    layer = layer_repo.find_by_kind(LayerKind.LOTES)
    assert layer is not None

    version = DataVersion(
        id=uuid.uuid4(),
        layer_id=layer.id,
        version_number=version_repo.get_next_version_number(layer.id),
        source_filename="test.zip",
        status=DataVersionStatus.READY,
        feature_count=1,
    )
    version_repo.save(version)

    poly = shapely.geometry.Polygon([(10, 10), (12, 10), (12, 12), (10, 12), (10, 10)])
    mpoly = shapely.geometry.MultiPolygon([poly])
    lote = LoteModel(
        id=uuid.uuid4(),
        data_version_id=version.id,
        source_feature_id="LOT-002",
        lot_number="5",
        geometry=mpoly.wkt,
    )
    lote_repo.bulk_insert([lote])

    # Consulta espacial con operador GiST '&&'
    query_hit = db_session.execute(
        text(
            "SELECT count(*) FROM lotes "
            "WHERE data_version_id = :vid AND geometry && ST_MakeEnvelope(9, 9, 11, 11, 4326)"
        ),
        {"vid": version.id},
    ).scalar()
    assert query_hit == 1

    query_miss = db_session.execute(
        text(
            "SELECT count(*) FROM lotes "
            "WHERE data_version_id = :vid AND geometry && ST_MakeEnvelope(50, 50, 60, 60, 4326)"
        ),
        {"vid": version.id},
    ).scalar()
    assert query_miss == 0


def test_feature_bulk_insert_count_and_delete(db_session):
    layer_repo = SqlModelLayerRepository(db_session)
    version_repo = SqlModelDataVersionRepository(db_session)
    lote_repo = SqlModelLoteRepository(db_session)

    layer = layer_repo.find_by_kind(LayerKind.LOTES)
    assert layer is not None

    version = DataVersion(
        id=uuid.uuid4(),
        layer_id=layer.id,
        version_number=version_repo.get_next_version_number(layer.id),
        source_filename="batch.zip",
        status=DataVersionStatus.READY,
    )
    version_repo.save(version)

    features = []
    for i in range(10):
        poly = shapely.geometry.Polygon([(i, i), (i + 1, i), (i + 1, i + 1), (i, i + 1), (i, i)])
        mpoly = shapely.geometry.MultiPolygon([poly])
        features.append(
            LoteModel(
                id=uuid.uuid4(),
                data_version_id=version.id,
                lot_number=str(i),
                geometry=mpoly.wkt,
            )
        )

    lote_repo.bulk_insert(features, batch_size=5)
    assert lote_repo.count_by_version(version.id) == 10

    lote_repo.delete_by_version(version.id)
    assert lote_repo.count_by_version(version.id) == 0


def test_import_use_case_full_workflow_and_rollback_on_failure(db_session):
    layer_repo = SqlModelLayerRepository(db_session)
    version_repo = SqlModelDataVersionRepository(db_session)
    lote_repo = SqlModelLoteRepository(db_session)
    codigo_fijo_repo = SqlModelCodigoFijoRepository(db_session)
    processor = PyogrioShapefileProcessor()
    uow = SqlModelUnitOfWork(db_session, get_event_bus())

    # 1. Capa LOTES (POLYGON)
    layer = layer_repo.find_by_kind(LayerKind.LOTES)
    assert layer is not None

    use_case = ImportGeographicDataUseCase(
        layer_repository=layer_repo,
        version_repository=version_repo,
        processor=processor,
        uow=uow,
    )

    # 2. Primera importación exitosa (v1)
    zip_bytes = build_lotes_zip(count=15)
    v1 = use_case.execute(
        ImportGeographicDataCommand(
            layer_id=layer.id,
            file_bytes=zip_bytes,
            filename="lotes.zip",
            user_id="admin-test",
        )
    )

    assert v1.status == DataVersionStatus.READY
    assert v1.feature_count == 15

    # Verificar puntero de capa
    refreshed_layer = layer_repo.find_by_id(layer.id)
    assert refreshed_layer.active_data_version_id == v1.id

    # 3. Segunda importación fallida: capa POINT (CODIGOS_FIJOS) con ZIP de polígonos
    point_layer = layer_repo.find_by_kind(LayerKind.CODIGOS_FIJOS)
    assert point_layer is not None
    initial_point_active_version = point_layer.active_data_version_id

    with pytest.raises(IncompatibleGeometryTypeException):
        use_case.execute(
            ImportGeographicDataCommand(
                layer_id=point_layer.id,
                file_bytes=zip_bytes,
                filename="lotes.zip",
                user_id="admin-test",
            )
        )

    # Verificar que point_layer conserva su active_data_version_id previo sin mutar
    refreshed_point_layer = layer_repo.find_by_id(point_layer.id)
    assert refreshed_point_layer.active_data_version_id == initial_point_active_version

    # Verificar que se registró la versión con estado FAILED
    versions = version_repo.list_by_layer(point_layer.id)
    failed_versions = [v for v in versions if v.status == DataVersionStatus.FAILED]
    assert len(failed_versions) >= 1
    failed_version = failed_versions[0]
    assert failed_version.error_message is not None
    assert "no coincide" in failed_version.error_message

    # Verificar que no quedaron filas en codigos_fijos para la versión fallida
    assert codigo_fijo_repo.count_by_version(failed_version.id) == 0

    # Y la capa original (v1) sigue completamente intacta con sus 15 filas en lotes
    assert lote_repo.count_by_version(v1.id) == 15
    assert refreshed_layer.active_data_version_id == v1.id
