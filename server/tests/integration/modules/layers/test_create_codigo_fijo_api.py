import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
from app.core.database import get_session
from app.core.security.auth import AuthUser, Role, get_current_user
from app.main import app
from app.modules.layers.domain.enums import LayerKind
from app.modules.layers.infrastructure.persistence.models.codigo_fijo_model import (
    CodigoFijoModel,
)
from app.modules.layers.infrastructure.persistence.repositories.sqlmodel_layer_repository import (
    SqlModelLayerRepository,
)
from sqlmodel import select


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


def test_create_codigo_fijo_api_happy_path(admin_client, db_session):
    layer_repo = SqlModelLayerRepository(db_session)
    layer = layer_repo.find_by_kind(LayerKind.CODIGOS_FIJOS)
    assert layer is not None

    payload = {
        "fixed_code": 880001,
        "name": "CARLOS MENDOZA",
        "latitude": -17.783300,
        "longitude": -63.182100,
        "status": 1,
    }

    response = admin_client.post("/api/layers/codigos-fijos", json=payload)
    assert response.status_code == 201

    data = response.json()
    assert data["fixed_code"] == 880001
    assert data["name"] == "CARLOS MENDOZA"
    assert data["status"] == 1
    assert data["latitude"] == -17.783300
    assert data["longitude"] == -63.182100
    assert "id" in data

    # Verify persisted in database
    db_record = db_session.exec(
        select(CodigoFijoModel).where(CodigoFijoModel.fixed_code == 880001)
    ).first()
    assert db_record is not None
    assert db_record.name == "CARLOS MENDOZA"


def test_create_codigo_fijo_api_conflict_on_duplicate(admin_client, db_session):
    payload = {
        "fixed_code": 880002,
        "name": "TEST ORIGINAL",
        "latitude": -17.780000,
        "longitude": -63.180000,
        "status": 1,
    }

    res1 = admin_client.post("/api/layers/codigos-fijos", json=payload)
    assert res1.status_code == 201

    # Second attempt with same fixed_code
    res2 = admin_client.post("/api/layers/codigos-fijos", json=payload)
    assert res2.status_code == 409
    error_data = res2.json()
    assert "880002" in error_data.get("detail", "") or "880002" in str(error_data)


def test_create_codigo_fijo_api_forbidden_for_non_admin(consultant_client):
    payload = {
        "fixed_code": 880003,
        "name": "ATTEMPT USER",
        "latitude": -17.780000,
        "longitude": -63.180000,
        "status": 1,
    }

    response = consultant_client.post("/api/layers/codigos-fijos", json=payload)
    assert response.status_code == 403
