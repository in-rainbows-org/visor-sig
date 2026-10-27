from datetime import datetime, timezone
import uuid
import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.database import get_session
from app.core.security.auth import AuthUser, Role, get_current_user
from app.main import app
from app.modules.layers.domain.entities.data_version import DataVersion
from app.modules.layers.domain.enums import (
    CodigoFijoStatus,
    DataVersionStatus,
    GeometryType,
    LayerColor,
    LayerKind,
)
from app.modules.layers.infrastructure.persistence.models.codigo_fijo_model import (
    CodigoFijoModel,
)
from app.modules.layers.infrastructure.persistence.models.data_version_model import (
    DataVersionModel,
)
from app.modules.layers.infrastructure.persistence.models.layer_model import LayerModel
from app.modules.layers.infrastructure.persistence.repositories.sqlmodel_data_version_repository import (
    SqlModelDataVersionRepository,
)
from app.modules.layers.infrastructure.persistence.repositories.sqlmodel_layer_repository import (
    SqlModelLayerRepository,
)


@pytest.fixture
def admin_client(db_session, monkeypatch):
    monkeypatch.setattr(settings, "BETTER_AUTH_ENABLE_ROLES", True)
    admin_user = AuthUser(
        user_id="admin-test",
        email="admin@test.com",
        role=Role.ADMIN,
    )
    app.dependency_overrides[get_current_user] = lambda: admin_user
    app.dependency_overrides[get_session] = lambda: db_session
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


@pytest.fixture
def consultant_client(db_session, monkeypatch):
    monkeypatch.setattr(settings, "BETTER_AUTH_ENABLE_ROLES", True)
    consultant_user = AuthUser(
        user_id="consultant-test",
        email="consultant@test.com",
        role=Role.CONSULTANT,
    )
    app.dependency_overrides[get_current_user] = lambda: consultant_user
    app.dependency_overrides[get_session] = lambda: db_session
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


def test_get_codigo_fijo_statistics_success(db_session, admin_client):
    layer_repo = SqlModelLayerRepository(db_session)
    version_repo = SqlModelDataVersionRepository(db_session)

    # 1. Asegurar la existencia de la capa CODIGOS_FIJOS
    layer = layer_repo.find_by_kind(LayerKind.CODIGOS_FIJOS)
    if not layer:
        layer = LayerModel(
            id=uuid.uuid4(),
            kind=LayerKind.CODIGOS_FIJOS,
            name="Códigos Fijos",
            geometry_type=GeometryType.POINT,
            color=LayerColor.BLUE,
        )
        db_session.add(layer)
        db_session.commit()
        db_session.refresh(layer)

    # 2. Crear versión de datos activa
    active_version = DataVersion(
        id=uuid.uuid4(),
        layer_id=layer.id,
        version_number=version_repo.get_next_version_number(layer.id),
        status=DataVersionStatus.READY,
        feature_count=8,
        source_filename="codigos_activos.zip",
        imported_by_user_id="admin-test",
    )
    version_repo.save(active_version)
    version_repo.set_active_version(layer.id, active_version.id)

    # 3. Insertar registros con distintos estados en la versión activa:
    # 3x NORMAL (1), 2x PARA_CORTE (2), 1x CORTADO (3), 1x BAJA_PARCIAL (4), 1x BAJA_TOTAL (5) = Total 8
    statuses = [
        CodigoFijoStatus.NORMAL.value,
        CodigoFijoStatus.NORMAL.value,
        CodigoFijoStatus.NORMAL.value,
        CodigoFijoStatus.PARA_CORTE.value,
        CodigoFijoStatus.PARA_CORTE.value,
        CodigoFijoStatus.CORTADO.value,
        CodigoFijoStatus.BAJA_PARCIAL.value,
        CodigoFijoStatus.BAJA_TOTAL.value,
    ]

    for idx, st in enumerate(statuses):
        cf = CodigoFijoModel(
            id=uuid.uuid4(),
            data_version_id=active_version.id,
            fixed_code=1000 + idx,
            name=f"Suministro {idx}",
            longitude=-77.0,
            latitude=-12.0,
            status=st,
            status_changed_at=datetime.now(timezone.utc),
            geometry="SRID=4326;MULTIPOINT((-77.0 -12.0))",
        )
        db_session.add(cf)
    db_session.commit()

    # 4. Consultar endpoint
    response = admin_client.get("/api/layers/codigos-fijos/statistics")
    assert response.status_code == 200

    data = response.json()
    assert data["total"] == 8
    assert data["normal"] == 3
    assert data["para_corte"] == 2
    assert data["cortado"] == 1
    assert data["baja_parcial"] == 1
    assert data["baja_total"] == 1

    # Invariante matemática
    assert (
        data["normal"]
        + data["para_corte"]
        + data["cortado"]
        + data["baja_parcial"]
        + data["baja_total"]
        == data["total"]
    )


def test_get_codigo_fijo_statistics_empty_when_no_active_version(db_session, admin_client):
    from sqlmodel import update
    layer_repo = SqlModelLayerRepository(db_session)
    layer = layer_repo.find_by_kind(LayerKind.CODIGOS_FIJOS)
    if layer:
        db_session.exec(
            update(DataVersionModel)
            .where(DataVersionModel.layer_id == layer.id)
            .values(is_active=False)
        )
        db_session.commit()

    response = admin_client.get("/api/layers/codigos-fijos/statistics")
    assert response.status_code == 200
    data = response.json()
    assert data == {
        "total": 0,
        "normal": 0,
        "para_corte": 0,
        "cortado": 0,
        "baja_parcial": 0,
        "baja_total": 0,
    }


def test_get_codigo_fijo_statistics_ignores_inactive_and_deleted_records(db_session, admin_client):
    layer_repo = SqlModelLayerRepository(db_session)
    version_repo = SqlModelDataVersionRepository(db_session)

    layer = layer_repo.find_by_kind(LayerKind.CODIGOS_FIJOS)
    if not layer:
        layer = LayerModel(
            id=uuid.uuid4(),
            kind=LayerKind.CODIGOS_FIJOS,
            name="Códigos Fijos",
            geometry_type=GeometryType.POINT,
            color=LayerColor.BLUE,
        )
        db_session.add(layer)
        db_session.commit()
        db_session.refresh(layer)

    # 1. Versión antigua (inactiva) con 5 registros
    old_version = DataVersion(
        id=uuid.uuid4(),
        layer_id=layer.id,
        version_number=version_repo.get_next_version_number(layer.id),
        status=DataVersionStatus.READY,
        feature_count=5,
        source_filename="antiguo.zip",
        imported_by_user_id="admin-test",
    )
    version_repo.save(old_version)

    for i in range(5):
        cf = CodigoFijoModel(
            id=uuid.uuid4(),
            data_version_id=old_version.id,
            fixed_code=2000 + i,
            longitude=-77.0,
            latitude=-12.0,
            status=CodigoFijoStatus.NORMAL.value,
            status_changed_at=datetime.now(timezone.utc),
            geometry="SRID=4326;MULTIPOINT((-77.0 -12.0))",
        )
        db_session.add(cf)

    # 2. Versión actual (activa) con 2 registros activos y 1 soft-deleted
    active_version = DataVersion(
        id=uuid.uuid4(),
        layer_id=layer.id,
        version_number=version_repo.get_next_version_number(layer.id),
        status=DataVersionStatus.READY,
        feature_count=2,
        source_filename="nuevo.zip",
        imported_by_user_id="admin-test",
    )
    version_repo.save(active_version)
    version_repo.set_active_version(layer.id, active_version.id)

    cf_active_1 = CodigoFijoModel(
        id=uuid.uuid4(),
        data_version_id=active_version.id,
        fixed_code=3001,
        longitude=-77.0,
        latitude=-12.0,
        status=CodigoFijoStatus.NORMAL.value,
        status_changed_at=datetime.now(timezone.utc),
        geometry="SRID=4326;MULTIPOINT((-77.0 -12.0))",
    )
    cf_active_2 = CodigoFijoModel(
        id=uuid.uuid4(),
        data_version_id=active_version.id,
        fixed_code=3002,
        longitude=-77.0,
        latitude=-12.0,
        status=CodigoFijoStatus.CORTADO.value,
        status_changed_at=datetime.now(timezone.utc),
        geometry="SRID=4326;MULTIPOINT((-77.0 -12.0))",
    )
    cf_deleted = CodigoFijoModel(
        id=uuid.uuid4(),
        data_version_id=active_version.id,
        fixed_code=3003,
        longitude=-77.0,
        latitude=-12.0,
        status=CodigoFijoStatus.PARA_CORTE.value,
        status_changed_at=datetime.now(timezone.utc),
        deleted_date=datetime.now(timezone.utc),
        geometry="SRID=4326;MULTIPOINT((-77.0 -12.0))",
    )
    db_session.add(cf_active_1)
    db_session.add(cf_active_2)
    db_session.add(cf_deleted)
    db_session.commit()

    # 3. Consultar
    response = admin_client.get("/api/layers/codigos-fijos/statistics")
    assert response.status_code == 200
    data = response.json()

    # Solo deben contarse los 2 registros activos de la versión activa
    assert data["total"] == 2
    assert data["normal"] == 1
    assert data["cortado"] == 1
    assert data["para_corte"] == 0
    assert data["baja_parcial"] == 0
    assert data["baja_total"] == 0


def test_get_codigo_fijo_statistics_forbidden_for_non_admin(consultant_client):
    response = consultant_client.get("/api/layers/codigos-fijos/statistics")
    assert response.status_code == 403


def test_get_codigo_fijo_statistics_unauthorized_without_auth(db_session):
    app.dependency_overrides.clear()
    app.dependency_overrides[get_session] = lambda: db_session
    client = TestClient(app)
    response = client.get("/api/layers/codigos-fijos/statistics")
    assert response.status_code == 401
    app.dependency_overrides.clear()
