import uuid
import pytest

from app.core.dependencies import get_event_bus
from app.modules.layers.application.use_cases.activate_data_version import (
    ActivateDataVersionCommand,
    ActivateDataVersionUseCase,
)
from app.modules.layers.application.use_cases.import_geographic_data import (
    ImportGeographicDataCommand,
    ImportGeographicDataUseCase,
)
from app.modules.layers.domain.exceptions import DataVersionNotFoundException
from app.modules.layers.infrastructure.persistence.repositories.sqlmodel_data_version_repository import (
    SqlModelDataVersionRepository,
)
from app.modules.layers.infrastructure.persistence.repositories.sqlmodel_lote_repository import (
    SqlModelLoteRepository,
)
from app.modules.layers.infrastructure.processing.pyogrio_shapefile_processor import (
    PyogrioShapefileProcessor,
)
from app.modules.layers.domain.enums import LayerKind
from app.modules.layers.infrastructure.persistence.repositories.sqlmodel_layer_repository import (
    SqlModelLayerRepository,
)
from app.shared.infrastructure.unit_of_work import SqlModelUnitOfWork
from tests.fixtures_shapefiles import build_lotes_zip


def test_atomic_pointer_replacement_retains_features(db_session):
    layer_repo = SqlModelLayerRepository(db_session)
    version_repo = SqlModelDataVersionRepository(db_session)
    lote_repo = SqlModelLoteRepository(db_session)
    processor = PyogrioShapefileProcessor()
    uow = SqlModelUnitOfWork(db_session, get_event_bus())

    layer = layer_repo.find_by_kind(LayerKind.LOTES)
    assert layer is not None

    import_uc = ImportGeographicDataUseCase(
        layer_repository=layer_repo,
        version_repository=version_repo,
        processor=processor,
        uow=uow,
    )
    activate_uc = ActivateDataVersionUseCase(
        layer_repository=layer_repo,
        version_repository=version_repo,
        uow=uow,
    )

    zip_bytes = build_lotes_zip(count=10)

    # 2. Cargar v1
    v1 = import_uc.execute(
        ImportGeographicDataCommand(
            layer_id=layer.id,
            file_bytes=zip_bytes,
            filename="v1.zip",
        )
    )
    assert lote_repo.count_by_version(v1.id) == 10

    # 3. Cargar v2
    v2 = import_uc.execute(
        ImportGeographicDataCommand(
            layer_id=layer.id,
            file_bytes=zip_bytes,
            filename="v2.zip",
        )
    )
    assert lote_repo.count_by_version(v2.id) == 10

    # Capa apunta a v2
    current_layer = layer_repo.find_by_id(layer.id)
    assert current_layer.active_data_version_id == v2.id

    # 4. Rollback: Activar v1
    act_result = activate_uc.execute(
        ActivateDataVersionCommand(layer_id=layer.id, version_id=v1.id)
    )
    assert act_result.id == v1.id

    # Verificar que el puntero activo cambió a v1
    refreshed_layer = layer_repo.find_by_id(layer.id)
    assert refreshed_layer.active_data_version_id == v1.id

    # Verificar que ninguna entidad geográfica fue eliminada o duplicada
    assert lote_repo.count_by_version(v1.id) == 10
    assert lote_repo.count_by_version(v2.id) == 10


def test_activation_rejection_leaves_pointer_unchanged(db_session):
    layer_repo = SqlModelLayerRepository(db_session)
    version_repo = SqlModelDataVersionRepository(db_session)
    processor = PyogrioShapefileProcessor()
    uow = SqlModelUnitOfWork(db_session, get_event_bus())

    layer = layer_repo.find_by_kind(LayerKind.LOTES)
    assert layer is not None

    import_uc = ImportGeographicDataUseCase(
        layer_repository=layer_repo,
        version_repository=version_repo,
        processor=processor,
        uow=uow,
    )
    activate_uc = ActivateDataVersionUseCase(
        layer_repository=layer_repo,
        version_repository=version_repo,
        uow=uow,
    )

    # Cargar v1
    v1 = import_uc.execute(
        ImportGeographicDataCommand(
            layer_id=layer.id,
            file_bytes=build_lotes_zip(count=5),
            filename="v1.zip",
        )
    )
    assert layer_repo.find_by_id(layer.id).active_data_version_id == v1.id

    # Intentar activar versión inexistente
    with pytest.raises(DataVersionNotFoundException):
        activate_uc.execute(
            ActivateDataVersionCommand(layer_id=layer.id, version_id=uuid.uuid4())
        )
    assert layer_repo.find_by_id(layer.id).active_data_version_id == v1.id
