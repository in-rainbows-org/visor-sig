import uuid
import pytest
import shapely.geometry
from fastapi.testclient import TestClient

from app.core.database import get_session
from app.core.security.auth import AuthUser, Role, get_current_user
from app.main import app
from app.modules.layers.domain.entities.data_version import DataVersion
from app.modules.layers.domain.enums import DataVersionStatus, LayerKind
from app.modules.layers.infrastructure.persistence.models.codigo_fijo_model import CodigoFijoModel
from app.modules.layers.infrastructure.persistence.models.manzana_model import ManzanaModel
from app.modules.layers.infrastructure.persistence.models.via_model import ViaModel
from app.modules.layers.infrastructure.persistence.repositories.sqlmodel_codigo_fijo_repository import (
    SqlModelCodigoFijoRepository,
)
from app.modules.layers.infrastructure.persistence.repositories.sqlmodel_data_version_repository import (
    SqlModelDataVersionRepository,
)
from app.modules.layers.infrastructure.persistence.repositories.sqlmodel_manzana_repository import (
    SqlModelManzanaRepository,
)
from app.modules.layers.infrastructure.persistence.repositories.sqlmodel_via_repository import (
    SqlModelViaRepository,
)
from app.modules.layers.infrastructure.persistence.repositories.sqlmodel_layer_repository import (
    SqlModelLayerRepository,
)


def test_get_active_map_features_query_and_router(db_session):
    client = TestClient(app)

    # 1. Mock de autenticación para CurrentUser (Consultor)
    fake_consultant = AuthUser(
        user_id="consultant-user-1",
        email="consultor@gis.test",
        role=Role.CONSULTANT,
    )
    app.dependency_overrides[get_current_user] = lambda: fake_consultant
    app.dependency_overrides[get_session] = lambda: db_session

    layer_repo = SqlModelLayerRepository(db_session)
    version_repo = SqlModelDataVersionRepository(db_session)
    vias_repo = SqlModelViaRepository(db_session)
    codigos_repo = SqlModelCodigoFijoRepository(db_session)

    # Buscar capas
    vias_layer = layer_repo.find_by_kind(LayerKind.VIAS)
    codigos_layer = layer_repo.find_by_kind(LayerKind.CODIGOS_FIJOS)
    assert vias_layer is not None
    assert codigos_layer is not None

    # Crear versión activa para Vías con una línea dentro de Santa Cruz
    vias_version = DataVersion(
        id=uuid.uuid4(),
        layer_id=vias_layer.id,
        version_number=version_repo.get_next_version_number(vias_layer.id),
        status=DataVersionStatus.READY,
        feature_count=1,
        source_filename="vias.zip",
        imported_by_user_id="admin-test",
    )
    version_repo.save(vias_version)
    version_repo.set_active_version(vias_layer.id, vias_version.id)
    db_session.commit()

    line = shapely.geometry.LineString([(-63.18, -17.78), (-63.17, -17.77)])
    mline = shapely.geometry.MultiLineString([line])
    vias_repo.bulk_insert(
        [
            ViaModel(
                id=uuid.uuid4(),
                data_version_id=vias_version.id,
                name="Av. Principal",
                road_type="avenue",
                geometry=mline.wkt,
            )
        ]
    )

    # Crear versión activa para Códigos Fijos con un punto dentro de Santa Cruz
    codigos_version = DataVersion(
        id=uuid.uuid4(),
        layer_id=codigos_layer.id,
        version_number=version_repo.get_next_version_number(codigos_layer.id),
        status=DataVersionStatus.READY,
        feature_count=2,
        source_filename="codigos.zip",
        imported_by_user_id="admin-test",
    )
    version_repo.save(codigos_version)
    version_repo.set_active_version(codigos_layer.id, codigos_version.id)
    db_session.commit()

    p1 = shapely.geometry.Point(-63.181, -17.781)
    mp1 = shapely.geometry.MultiPoint([p1])
    p2 = shapely.geometry.Point(-63.182, -17.782)
    mp2 = shapely.geometry.MultiPoint([p2])

    codigos_repo.bulk_insert(
        [
            CodigoFijoModel(
                id=uuid.uuid4(),
                data_version_id=codigos_version.id,
                fixed_code=1001,
                label="CF-1001",
                longitude=-63.181,
                latitude=-17.781,
                status=1,  # Normal
                geometry=mp1.wkt,
            ),
            CodigoFijoModel(
                id=uuid.uuid4(),
                data_version_id=codigos_version.id,
                fixed_code=1002,
                label="CF-1002",
                longitude=-63.182,
                latitude=-17.782,
                status=3,  # Cortado
                geometry=mp2.wkt,
            ),
        ]
    )

    # 2. Test GET /api/layers con Consultor (ambos roles autorizados)
    res_layers = client.get("/api/layers")
    assert res_layers.status_code == 200
    assert len(res_layers.json()["items"]) == 4

    # 3. Test GET /api/map/features con zoom suficiente y filtrado de estado
    bbox_str = "-63.25,-17.85,-63.10,-17.70"
    res_map = client.get(
        f"/api/map/features?layer_kinds=VIAS&layer_kinds=CODIGOS_FIJOS&bbox={bbox_str}&zoom=14&fixed_code_statuses=1"
    )
    assert res_map.status_code == 200
    data = res_map.json()
    assert "viewport" in data
    assert len(data["layers"]) == 2

    # Verificar capa Vías
    vias_res = next(l for l in data["layers"] if l["kind"] == "VIAS")
    assert vias_res["load_status"] == "READY"
    assert vias_res["feature_count"] == 1
    assert vias_res["features"]["features"][0]["properties"]["name"] == "Av. Principal"

    # Verificar capa Códigos Fijos con filtro status=1 (solo debe retornar 1 punto de los 2)
    codigos_res = next(l for l in data["layers"] if l["kind"] == "CODIGOS_FIJOS")
    assert codigos_res["load_status"] == "READY"
    assert codigos_res["feature_count"] == 1
    assert codigos_res["features"]["features"][0]["properties"]["fixed_code"] == 1001

    # 4. Test zoom insuficiente para Códigos Fijos (zoom < 13)
    res_low_zoom = client.get(
        f"/api/map/features?layer_kinds=CODIGOS_FIJOS&bbox={bbox_str}&zoom=12"
    )
    assert res_low_zoom.status_code == 200
    low_zoom_data = res_low_zoom.json()
    codigos_low = low_zoom_data["layers"][0]
    assert codigos_low["load_status"] == "ZOOM_REQUIRED"
    assert codigos_low["feature_count"] == 0

    # 5. Test validaciones de bbox
    res_invalid_bbox = client.get(
        "/api/map/features?layer_kinds=VIAS&bbox=-63.10,-17.70,-63.25,-17.85&zoom=14"
    )
    assert res_invalid_bbox.status_code == 422

    # 6. Test GET /api/map/macro-layers (Manzanas y Vías completas sin BBOX)
    res_macro = client.get("/api/map/macro-layers")
    assert res_macro.status_code == 200
    macro_data = res_macro.json()
    assert "layers" in macro_data
    assert len(macro_data["layers"]) == 2
    vias_macro = next(l for l in macro_data["layers"] if l["kind"] == "VIAS")
    assert vias_macro["load_status"] == "READY"
    assert vias_macro["feature_count"] == 1
    assert vias_macro["features"]["features"][0]["properties"]["name"] == "Av. Principal"
    manzanas_macro = next(l for l in macro_data["layers"] if l["kind"] == "MANZANAS")
    assert manzanas_macro["load_status"] in ("READY", "NO_ACTIVE_VERSION")
    assert "features" in manzanas_macro

    # Limpiar overrides
    app.dependency_overrides.clear()

