import uuid
import pytest
from fastapi.testclient import TestClient

from app.core.database import get_session
from app.core.security.auth import AuthUser, Role, get_current_user
from app.main import app
from app.modules.layers.domain.entities.data_version import DataVersion
from app.modules.layers.domain.enums import DataVersionStatus, LayerKind
from app.modules.layers.infrastructure.persistence.models.codigo_fijo_model import CodigoFijoModel
from app.modules.layers.infrastructure.persistence.repositories.sqlmodel_data_version_repository import (
    SqlModelDataVersionRepository,
)
from app.modules.layers.infrastructure.persistence.repositories.sqlmodel_layer_repository import (
    SqlModelLayerRepository,
)


@pytest.fixture
def auth_client(db_session):
    fake_user = AuthUser(
        user_id="admin-1",
        email="admin@test.com",
        role=Role.ADMIN,
    )
    app.dependency_overrides[get_current_user] = lambda: fake_user
    app.dependency_overrides[get_session] = lambda: db_session
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


def test_search_codigos_fijos_for_assignment_returns_coordinates(db_session, auth_client):
    layer_repo = SqlModelLayerRepository(db_session)
    version_repo = SqlModelDataVersionRepository(db_session)

    cf_layer = layer_repo.find_by_kind(LayerKind.CODIGOS_FIJOS)
    assert cf_layer is not None

    version = DataVersion(
        id=uuid.uuid4(),
        layer_id=cf_layer.id,
        version_number=version_repo.get_next_version_number(cf_layer.id),
        status=DataVersionStatus.READY,
        feature_count=2,
        source_filename="codigos_fijos.zip",
        imported_by_user_id="admin-test",
    )
    version_repo.save(version)
    version_repo.set_active_version(cf_layer.id, version.id)

    # Insertar 2 códigos fijos
    cf1 = CodigoFijoModel(
        id=uuid.uuid4(),
        data_version_id=version.id,
        fixed_code=1024,
        name="Carlos Mendoza",
        status=1,
        latitude=-17.7833,
        longitude=-63.1821,
        geometry="SRID=4326;MULTIPOINT((-63.1821 -17.7833))",
        properties={},
    )
    cf2 = CodigoFijoModel(
        id=uuid.uuid4(),
        data_version_id=version.id,
        fixed_code=1055,
        name="Ana Fernandez",
        status=2,
        latitude=-17.7840,
        longitude=-63.1810,
        geometry="SRID=4326;MULTIPOINT((-63.1810 -17.7840))",
        properties={},
    )
    cf3 = CodigoFijoModel(
        id=uuid.uuid4(),
        data_version_id=version.id,
        fixed_code=1099,
        name="Pedro Suarez",
        status=3,
        latitude=-17.7850,
        longitude=-63.1800,
        geometry="SRID=4326;MULTIPOINT((-63.1800 -17.7850))",
        properties={},
    )
    db_session.add(cf1)
    db_session.add(cf2)
    db_session.add(cf3)
    db_session.commit()

    # 1. Búsqueda sin filtro de servicio: debe retornar los 3
    response = auth_client.get("/api/consultations/codigos-fijos/for-assignment?fixed_code=10&limit=5")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3
    assert [d["fixed_code"] for d in data] == [1024, 1055, 1099]

    # 2. Búsqueda con service_type=CUT: excluye status == 3 (cortado)
    resp_cut = auth_client.get("/api/consultations/codigos-fijos/for-assignment?fixed_code=10&service_type=CUT")
    assert resp_cut.status_code == 200
    data_cut = resp_cut.json()
    assert len(data_cut) == 2
    assert [d["fixed_code"] for d in data_cut] == [1024, 1055]
    assert all(d["status"] != 3 for d in data_cut)

    # 3. Búsqueda con service_type=RECONNECTION: excluye status == 1 (normal)
    resp_rec = auth_client.get("/api/consultations/codigos-fijos/for-assignment?fixed_code=10&service_type=RECONNECTION")
    assert resp_rec.status_code == 200
    data_rec = resp_rec.json()
    assert len(data_rec) == 2
    assert [d["fixed_code"] for d in data_rec] == [1055, 1099]
    assert all(d["status"] != 1 for d in data_rec)

    # 4. Búsqueda específica por código exacto
    resp_exact = auth_client.get("/api/consultations/codigos-fijos/for-assignment?fixed_code=1055")
    assert resp_exact.status_code == 200
    exact_data = resp_exact.json()
    assert len(exact_data) == 1
    assert exact_data[0]["fixed_code"] == 1055
    assert exact_data[0]["name"] == "Ana Fernandez"
