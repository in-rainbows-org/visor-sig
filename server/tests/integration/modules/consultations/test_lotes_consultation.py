import uuid
import pytest
from fastapi.testclient import TestClient

from app.core.database import get_session
from app.core.security.auth import AuthUser, Role, get_current_user
from app.main import app
from app.modules.layers.domain.entities.data_version import DataVersion
from app.modules.layers.domain.enums import DataVersionStatus, LayerKind
from app.modules.layers.infrastructure.persistence.models.lote_model import LoteModel
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


def test_lotes_consultation_flow(db_session, auth_client):
    layer_repo = SqlModelLayerRepository(db_session)
    version_repo = SqlModelDataVersionRepository(db_session)

    lotes_layer = layer_repo.find_by_kind(LayerKind.LOTES)
    manzanas_layer = layer_repo.find_by_kind(LayerKind.MANZANAS)
    assert lotes_layer is not None
    assert manzanas_layer is not None

    # Crear versión activa para Manzanas
    mz_version = DataVersion(
        id=uuid.uuid4(),
        layer_id=manzanas_layer.id,
        version_number=version_repo.get_next_version_number(manzanas_layer.id),
        status=DataVersionStatus.READY,
        feature_count=1,
        source_filename="mz.zip",
        imported_by_user_id="admin-test",
    )
    version_repo.save(mz_version)
    version_repo.set_active_version(manzanas_layer.id, mz_version.id)

    mz_id = uuid.uuid4()
    mz = ManzanaModel(
        id=mz_id,
        data_version_id=mz_version.id,
        uv_block_code="UV14-MZ02",
        uv="14",
        block_number="02",
        geometry="SRID=4326;MULTIPOLYGON((( -63.18 -17.78, -63.17 -17.78, -63.17 -17.77, -63.18 -17.78 )))",
        properties={},
    )
    db_session.add(mz)

    # Crear versión activa para Lotes
    lotes_version = DataVersion(
        id=uuid.uuid4(),
        layer_id=lotes_layer.id,
        version_number=version_repo.get_next_version_number(lotes_layer.id),
        status=DataVersionStatus.READY,
        feature_count=2,
        source_filename="lotes.zip",
        imported_by_user_id="admin-test",
    )
    version_repo.save(lotes_version)
    version_repo.set_active_version(lotes_layer.id, lotes_version.id)

    lote1 = LoteModel(
        id=uuid.uuid4(),
        data_version_id=lotes_version.id,
        manzana_id=mz_id,
        lot_number="05",
        geometry="SRID=4326;MULTIPOLYGON((( -63.18 -17.78, -63.17 -17.78, -63.17 -17.77, -63.18 -17.78 )))",
        properties={},
    )
    lote2 = LoteModel(
        id=uuid.uuid4(),
        data_version_id=lotes_version.id,
        manzana_id=None,
        lot_number="12A",
        geometry="SRID=4326;MULTIPOLYGON((( -63.19 -17.79, -63.18 -17.79, -63.18 -17.78, -63.19 -17.79 )))",
        properties={},
    )
    db_session.add(lote1)
    db_session.add(lote2)
    db_session.commit()

    # Consulta general
    res = auth_client.get("/api/consultations/lotes?page=1&page_size=10")
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 2
    assert data["page"] == 1
    assert data["page_size"] == 10
    assert data["total_pages"] == 1

    # Verificar resolución de manzana_uv_block_code
    item_with_mz = next(i for i in data["items"] if i["lot_number"] == "05")
    assert item_with_mz["manzana_uv_block_code"] == "UV14-MZ02"

    item_without_mz = next(i for i in data["items"] if i["lot_number"] == "12A")
    assert item_without_mz["manzana_uv_block_code"] is None

    # Filtrar por lot_number parcial
    res_filter = auth_client.get("/api/consultations/lotes?lot_number=12")
    assert res_filter.status_code == 200
    assert res_filter.json()["total"] == 1
    assert res_filter.json()["items"][0]["lot_number"] == "12A"

    # Paginación
    res_p1 = auth_client.get("/api/consultations/lotes?page=1&page_size=1")
    assert res_p1.status_code == 200
    assert res_p1.json()["total"] == 2
    assert res_p1.json()["total_pages"] == 2
    assert len(res_p1.json()["items"]) == 1
