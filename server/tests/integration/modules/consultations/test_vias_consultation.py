import uuid
import pytest
from fastapi.testclient import TestClient

from app.core.database import get_session
from app.core.security.auth import AuthUser, Role, get_current_user
from app.main import app
from app.modules.layers.domain.entities.data_version import DataVersion
from app.modules.layers.domain.enums import DataVersionStatus, LayerKind
from app.modules.layers.infrastructure.persistence.models.via_model import ViaModel
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


def test_vias_consultation_flow(db_session, auth_client):
    layer_repo = SqlModelLayerRepository(db_session)
    version_repo = SqlModelDataVersionRepository(db_session)

    vias_layer = layer_repo.find_by_kind(LayerKind.VIAS)
    assert vias_layer is not None

    # Crear versión activa para Vías
    vias_version = DataVersion(
        id=uuid.uuid4(),
        layer_id=vias_layer.id,
        version_number=version_repo.get_next_version_number(vias_layer.id),
        status=DataVersionStatus.READY,
        feature_count=3,
        source_filename="vias.zip",
        imported_by_user_id="admin-test",
    )
    version_repo.save(vias_version)
    version_repo.set_active_version(vias_layer.id, vias_version.id)

    via1 = ViaModel(
        id=uuid.uuid4(),
        data_version_id=vias_version.id,
        name="Avenida San Martin",
        road_type="Avenida",
        reference="AV-SM",
        geometry="SRID=4326;MULTILINESTRING((-63.18 -17.78, -63.17 -17.78))",
        properties={},
    )
    via2 = ViaModel(
        id=uuid.uuid4(),
        data_version_id=vias_version.id,
        name="Calle Bolivar",
        road_type="Calle",
        reference="CL-BOL",
        geometry="SRID=4326;MULTILINESTRING((-63.19 -17.79, -63.18 -17.79))",
        properties={},
    )
    via3 = ViaModel(
        id=uuid.uuid4(),
        data_version_id=vias_version.id,
        name="Calle Sucre",
        road_type="Calle",
        reference="CL-SUC",
        geometry="SRID=4326;MULTILINESTRING((-63.20 -17.80, -63.19 -17.80))",
        properties={},
    )
    db_session.add(via1)
    db_session.add(via2)
    db_session.add(via3)
    db_session.commit()

    # Consulta sin filtros
    res = auth_client.get("/api/consultations/vias?page=1&page_size=10")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 3
    assert len(data["items"]) == 3

    # Filtro por road_type
    res_type = auth_client.get("/api/consultations/vias?road_type=Avenida")
    assert res_type.status_code == 200
    assert res_type.json()["total"] == 1
    assert res_type.json()["items"][0]["name"] == "Avenida San Martin"

    # Filtro por name parcial (case-insensitive)
    res_name = auth_client.get("/api/consultations/vias?name=bolivar")
    assert res_name.status_code == 200
    assert res_name.json()["total"] == 1
    assert res_name.json()["items"][0]["name"] == "Calle Bolivar"

    # Filtro sin resultados
    res_empty = auth_client.get("/api/consultations/vias?name=NoExiste")
    assert res_empty.status_code == 200
    assert res_empty.json()["total"] == 0
    assert res_empty.json()["items"] == []
    assert res_empty.json()["total_pages"] == 0
