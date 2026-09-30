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


def test_color_patch_and_obsolete_lifecycle_routes(admin_client):
    # 1. Obtener una capa existente
    list_res = admin_client.get("/api/layers")
    assert list_res.status_code == 200
    items = list_res.json()["items"]
    if not items:
        pytest.skip("No layers in catalog")
    layer_id = items[0]["id"]
    original_name = items[0]["name"]
    original_geom = items[0]["geometry_type"]

    # 2. PATCH /api/layers/{id}/color funciona exclusivamente para el color
    patch_res = admin_client.patch(
        f"/api/layers/{layer_id}/color",
        json={"color": "VIOLET"},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["color"] == "VIOLET"
    assert patch_res.json()["name"] == original_name
    assert patch_res.json()["geometry_type"] == original_geom

    # 3. Intentar enviar campos adicionales devuelve 422
    patch_extra = admin_client.patch(
        f"/api/layers/{layer_id}/color",
        json={"color": "RED", "name": "Nuevo Nombre"},
    )
    assert patch_extra.status_code == 422

    # 4. Endpoints obsoletos devuelven 404/405
    assert admin_client.post("/api/layers", json={"name": "test"}).status_code in (404, 405)
    assert admin_client.post(f"/api/layers/{layer_id}/activate").status_code in (404, 405)
    assert admin_client.post(f"/api/layers/{layer_id}/deactivate").status_code in (404, 405)

