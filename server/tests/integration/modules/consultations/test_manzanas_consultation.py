import uuid
import pytest
from fastapi.testclient import TestClient

from app.core.database import get_session
from app.core.security.auth import AuthUser, Role, get_current_user
from app.main import app
from app.modules.layers.domain.entities.data_version import DataVersion
from app.modules.layers.domain.enums import DataVersionStatus, LayerKind
from app.modules.layers.infrastructure.persistence.models.manzana_model import ManzanaModel
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


def test_manzanas_consultation_flow(db_session, auth_client):
    layer_repo = SqlModelLayerRepository(db_session)
    version_repo = SqlModelDataVersionRepository(db_session)

    manzanas_layer = layer_repo.find_by_kind(LayerKind.MANZANAS)
    assert manzanas_layer is not None

    # Crear versión activa para Manzanas
    mz_version = DataVersion(
        id=uuid.uuid4(),
        layer_id=manzanas_layer.id,
        version_number=version_repo.get_next_version_number(manzanas_layer.id),
        status=DataVersionStatus.READY,
        feature_count=3,
        source_filename="manzanas.zip",
        imported_by_user_id="admin-test",
    )
    version_repo.save(mz_version)
    version_repo.set_active_version(manzanas_layer.id, mz_version.id)

    mz1 = ManzanaModel(
        id=uuid.uuid4(),
        data_version_id=mz_version.id,
        uv_block_code="UV01-MZ01",
        uv="01",
        block_number="01",
        geometry="SRID=4326;MULTIPOLYGON((( -63.18 -17.78, -63.17 -17.78, -63.17 -17.77, -63.18 -17.78 )))",
        properties={},
    )
    mz2 = ManzanaModel(
        id=uuid.uuid4(),
        data_version_id=mz_version.id,
        uv_block_code="UV01-MZ02",
        uv="01",
        block_number="02",
        geometry="SRID=4326;MULTIPOLYGON((( -63.19 -17.79, -63.18 -17.79, -63.18 -17.78, -63.19 -17.79 )))",
        properties={},
    )
    mz3 = ManzanaModel(
        id=uuid.uuid4(),
        data_version_id=mz_version.id,
        uv_block_code="UV02-MZ01",
        uv="02",
        block_number="01",
        geometry="SRID=4326;MULTIPOLYGON((( -63.20 -17.80, -63.19 -17.80, -63.19 -17.79, -63.20 -17.80 )))",
        properties={},
    )
    db_session.add(mz1)
    db_session.add(mz2)
    db_session.add(mz3)
    db_session.commit()

    # Consulta sin filtros
    res = auth_client.get("/api/consultations/manzanas?page=1&page_size=10")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 3
    assert len(data["items"]) == 3
    assert data["page"] == 1
    assert data["page_size"] == 10
    assert data["total_pages"] == 1

    # Filtro por UV
    res_uv = auth_client.get("/api/consultations/manzanas?uv=01")
    assert res_uv.status_code == 200
    assert res_uv.json()["total"] == 2

    # Filtro por block_number
    res_bn = auth_client.get("/api/consultations/manzanas?block_number=02")
    assert res_bn.status_code == 200
    assert res_bn.json()["total"] == 1
    assert res_bn.json()["items"][0]["uv_block_code"] == "UV01-MZ02"

    # Filtro por uv_block_code
    res_code = auth_client.get("/api/consultations/manzanas?uv_block_code=UV02")
    assert res_code.status_code == 200
    assert res_code.json()["total"] == 1
    assert res_code.json()["items"][0]["uv_block_code"] == "UV02-MZ01"

    # Paginación
    res_pag = auth_client.get("/api/consultations/manzanas?page=2&page_size=2")
    assert res_pag.status_code == 200
    assert res_pag.json()["total"] == 3
    assert res_pag.json()["total_pages"] == 2
    assert len(res_pag.json()["items"]) == 1
