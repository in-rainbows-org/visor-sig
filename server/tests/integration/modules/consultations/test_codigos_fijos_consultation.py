import uuid
import pytest
from fastapi.testclient import TestClient

from app.core.database import get_session
from app.core.security.auth import AuthUser, Role, get_current_user
from app.main import app
from app.modules.layers.domain.entities.data_version import DataVersion
from app.modules.layers.domain.enums import DataVersionStatus, LayerKind
from app.modules.layers.infrastructure.persistence.models.codigo_fijo_model import CodigoFijoModel
from app.modules.layers.infrastructure.persistence.models.lote_model import LoteModel
from app.modules.layers.infrastructure.persistence.repositories.sqlmodel_data_version_repository import (
    SqlModelDataVersionRepository,
)
from app.modules.layers.infrastructure.persistence.repositories.sqlmodel_layer_repository import (
    SqlModelLayerRepository,
)


@pytest.fixture
def auth_client(db_session):
    fake_user = AuthUser(
        user_id="consultant-1",
        email="consultant@test.com",
        role=Role.CONSULTANT,
    )
    app.dependency_overrides[get_current_user] = lambda: fake_user
    app.dependency_overrides[get_session] = lambda: db_session
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


def test_codigos_fijos_consultation_flow(db_session, auth_client):
    layer_repo = SqlModelLayerRepository(db_session)
    version_repo = SqlModelDataVersionRepository(db_session)

    cf_layer = layer_repo.find_by_kind(LayerKind.CODIGOS_FIJOS)
    lotes_layer = layer_repo.find_by_kind(LayerKind.LOTES)
    assert cf_layer is not None
    assert lotes_layer is not None

    # 1. Crear versión activa para Lotes y Código Fijo
    lotes_version = DataVersion(
        id=uuid.uuid4(),
        layer_id=lotes_layer.id,
        version_number=version_repo.get_next_version_number(lotes_layer.id),
        status=DataVersionStatus.READY,
        feature_count=1,
        source_filename="lotes.zip",
        imported_by_user_id="admin-test",
    )
    version_repo.save(lotes_version)
    version_repo.set_active_version(lotes_layer.id, lotes_version.id)

    lote_id = uuid.uuid4()
    lote = LoteModel(
        id=lote_id,
        data_version_id=lotes_version.id,
        lot_number="12",
        geometry="SRID=4326;MULTIPOLYGON((( -63.18 -17.78, -63.17 -17.78, -63.17 -17.77, -63.18 -17.78 )))",
        properties={},
    )
    db_session.add(lote)

    cf_version = DataVersion(
        id=uuid.uuid4(),
        layer_id=cf_layer.id,
        version_number=version_repo.get_next_version_number(cf_layer.id),
        status=DataVersionStatus.READY,
        feature_count=2,
        source_filename="cf.zip",
        imported_by_user_id="admin-test",
    )
    version_repo.save(cf_version)
    version_repo.set_active_version(cf_layer.id, cf_version.id)

    cf1 = CodigoFijoModel(
        id=uuid.uuid4(),
        data_version_id=cf_version.id,
        lote_id=lote_id,
        label="CF-001",
        fixed_code=102030,
        name="Carlos Castro",
        status=1,
        latitude=-17.78,
        longitude=-63.18,
        geometry="SRID=4326;MULTIPOINT((-63.18 -17.78))",
        properties={},
    )
    cf2 = CodigoFijoModel(
        id=uuid.uuid4(),
        data_version_id=cf_version.id,
        lote_id=None,
        label="CF-002",
        fixed_code=204050,
        name="Maria Perez",
        status=2,
        latitude=-17.79,
        longitude=-63.19,
        geometry="SRID=4326;MULTIPOINT((-63.19 -17.79))",
        properties={},
    )
    db_session.add(cf1)
    db_session.add(cf2)
    db_session.commit()

    # Consulta general
    res = auth_client.get("/api/consultations/codigos-fijos?page=1&page_size=10")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 2
    assert data["page"] == 1
    assert data["page_size"] == 10
    assert data["total_pages"] == 1
    assert len(data["items"]) == 2

    # Verificar que cf1 tiene su lote resuelto
    cf1_item = next(i for i in data["items"] if i["fixed_code"] == 102030)
    assert cf1_item["name"] == "Carlos Castro"
    assert cf1_item["status"] == 1
    assert cf1_item["lot_number"] == "12"

    # Verificar que cf2 tiene lot_number None
    cf2_item = next(i for i in data["items"] if i["fixed_code"] == 204050)
    assert cf2_item["lot_number"] is None
    assert cf2_item["status"] == 2

    # Filtro por fixed_code prefijo
    res_code = auth_client.get("/api/consultations/codigos-fijos?fixed_code=102")
    assert res_code.status_code == 200
    data_code = res_code.json()
    assert data_code["total"] == 1
    assert data_code["items"][0]["fixed_code"] == 102030

    # Filtro por nombre parcial case-insensitive
    res_name = auth_client.get("/api/consultations/codigos-fijos?name=castro")
    assert res_name.status_code == 200
    data_name = res_name.json()
    assert data_name["total"] == 1
    assert data_name["items"][0]["name"] == "Carlos Castro"

    # Paginación
    res_p1 = auth_client.get("/api/consultations/codigos-fijos?page=1&page_size=1")
    assert res_p1.status_code == 200
    assert res_p1.json()["total"] == 2
    assert res_p1.json()["total_pages"] == 2
    assert len(res_p1.json()["items"]) == 1

    # Paginación fuera de rango
    res_p99 = auth_client.get("/api/consultations/codigos-fijos?page=99&page_size=10")
    assert res_p99.status_code == 200
    assert res_p99.json()["items"] == []
    assert res_p99.json()["total"] == 2
    assert res_p99.json()["total_pages"] == 1

    # Detalle georreferenciado por ID
    res_detail = auth_client.get(f"/api/consultations/codigos-fijos/{cf1.id}")
    assert res_detail.status_code == 200
    detail_data = res_detail.json()
    assert detail_data["id"] == str(cf1.id)
    assert detail_data["fixed_code"] == 102030
    assert detail_data["name"] == "Carlos Castro"
    assert detail_data["latitude"] == -17.78
    assert detail_data["longitude"] == -63.18
    assert detail_data["lot_number"] == "12"
    assert detail_data["status"] == 1

    # Detalle por ID no existente (404)
    non_existent_id = uuid.uuid4()
    res_404 = auth_client.get(f"/api/consultations/codigos-fijos/{non_existent_id}")
    assert res_404.status_code == 404
    assert res_404.json()["detail"] == "Código fijo no encontrado"


def test_codigos_fijos_consultation_validation(auth_client):
    res = auth_client.get("/api/consultations/codigos-fijos?page=0")
    assert res.status_code == 422

    res_size = auth_client.get("/api/consultations/codigos-fijos?page_size=500")
    assert res_size.status_code == 422
