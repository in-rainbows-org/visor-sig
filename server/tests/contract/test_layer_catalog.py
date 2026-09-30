import uuid
import pytest
from fastapi.testclient import TestClient

from app.core.security.auth import AuthUser, Role, get_current_user
from app.main import app


@pytest.fixture
def admin_client():
    def mock_admin() -> AuthUser:
        return AuthUser(user_id="admin-1", email="admin@example.com", role=Role.ADMIN)

    app.dependency_overrides[get_current_user] = mock_admin
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


@pytest.fixture
def consultant_client():
    def mock_consultant() -> AuthUser:
        return AuthUser(user_id="consultant-1", email="consultant@example.com", role=Role.CONSULTANT)

    app.dependency_overrides[get_current_user] = mock_consultant
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


def test_get_nonexistent_layer_returns_404(admin_client):
    non_existent_id = str(uuid.uuid4())
    response = admin_client.get(f"/api/layers/{non_existent_id}")
    assert response.status_code == 404


def test_list_layers_returns_items(admin_client):
    response = admin_client.get("/api/layers")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    # Each item must have id, kind, name, geometry_type, color, active_data_version_id
    for item in data["items"]:
        assert "id" in item
        assert "kind" in item
        assert "name" in item
        assert "geometry_type" in item
        assert "color" in item
        assert "active_data_version_id" in item
        assert "is_enabled" not in item


def test_patch_layer_color_forbidden_for_consultant(consultant_client):
    layer_id = str(uuid.uuid4())
    # Consultor no puede mutar color (403)
    response = consultant_client.patch(f"/api/layers/{layer_id}/color", json={"color": "GREEN"})
    assert response.status_code == 403


def test_patch_layer_color_invalid_returns_422(admin_client):
    list_res = admin_client.get("/api/layers")
    items = list_res.json()["items"]
    if not items:
        pytest.skip("No layers in catalog")
    layer_id = items[0]["id"]

    # Color no permitido
    response = admin_client.patch(f"/api/layers/{layer_id}/color", json={"color": "MAGENTA"})
    assert response.status_code == 422


def test_patch_layer_color_success(admin_client):
    list_res = admin_client.get("/api/layers")
    items = list_res.json()["items"]
    if not items:
        pytest.skip("No layers in catalog")
    layer_id = items[0]["id"]

    response = admin_client.patch(f"/api/layers/{layer_id}/color", json={"color": "YELLOW"})
    assert response.status_code == 200
    updated = response.json()
    assert updated["id"] == layer_id
    assert updated["color"] == "YELLOW"

    # Verificar con GET
    get_res = admin_client.get(f"/api/layers/{layer_id}")
    assert get_res.status_code == 200
    assert get_res.json()["color"] == "YELLOW"

