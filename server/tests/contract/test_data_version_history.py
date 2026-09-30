import io
import os
import uuid
import zipfile
import pytest
from fastapi.testclient import TestClient

from app.core.security.auth import AuthUser, Role, get_current_user
from app.main import app

FIXTURE_DIR = "venv/lib/python3.14/site-packages/pyogrio/tests/fixtures/naturalearth_lowres"


def _build_zip() -> bytes:
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        for fname in os.listdir(FIXTURE_DIR):
            file_path = os.path.join(FIXTURE_DIR, fname)
            zf.write(file_path, arcname=fname)
    return buf.getvalue()


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


@pytest.fixture
def unauthenticated_client():
    client = TestClient(app)
    return client


from tests.fixtures_shapefiles import build_lotes_zip


def _get_layer_by_kind(client: TestClient, kind: str) -> dict:
    res = client.get("/api/layers")
    assert res.status_code == 200
    for item in res.json()["items"]:
        if item["kind"] == kind:
            return item
    pytest.skip(f"Capa {kind} no encontrada en catálogo")


class TestDataVersionHistoryContract:
    def test_list_and_get_and_activate_history_workflow(self, admin_client):
        layer = _get_layer_by_kind(admin_client, "LOTES")
        layer_id = layer["id"]

        # 1. Importar versión 1
        zip_bytes = build_lotes_zip(count=10)
        v1_res = admin_client.post(
            f"/api/layers/{layer_id}/data-versions",
            files={"file": ("v1.zip", zip_bytes, "application/zip")},
        )
        assert v1_res.status_code == 201
        v1 = v1_res.json()
        assert v1["is_active"] is True

        # 2. Importar versión 2
        v2_res = admin_client.post(
            f"/api/layers/{layer_id}/data-versions",
            files={"file": ("v2.zip", zip_bytes, "application/zip")},
        )
        assert v2_res.status_code == 201
        v2 = v2_res.json()
        assert v2["is_active"] is True

        # 3. Listar versiones históricas (debe tener v2 y v1, v2 activa y v1 inactiva)
        list_res = admin_client.get(f"/api/layers/{layer_id}/data-versions")
        assert list_res.status_code == 200
        items = list_res.json()["items"]
        assert len(items) >= 2
        v2_item = next(i for i in items if i["id"] == v2["id"])
        v1_item = next(i for i in items if i["id"] == v1["id"])
        assert v2_item["is_active"] is True
        assert v1_item["is_active"] is False

        # 4. Obtener detalle de versión 1
        get_v1_res = admin_client.get(f"/api/layers/{layer_id}/data-versions/{v1['id']}")
        assert get_v1_res.status_code == 200
        assert get_v1_res.json()["id"] == v1["id"]
        assert get_v1_res.json()["is_active"] is False

        # 5. Activar versión 1 (Rollback a v1)
        act_res = admin_client.post(f"/api/layers/{layer_id}/data-versions/{v1['id']}/activate")
        assert act_res.status_code == 200
        assert act_res.json()["id"] == v1["id"]
        assert act_res.json()["is_active"] is True

        # 6. Verificar que el puntero en la capa ahora es v1
        layer_res = admin_client.get(f"/api/layers/{layer_id}")
        assert layer_res.status_code == 200
        assert layer_res.json()["active_data_version_id"] == v1["id"]

        # 7. Re-listar y confirmar que v1 es is_active=True y v2 es is_active=False
        list_res_after = admin_client.get(f"/api/layers/{layer_id}/data-versions")
        assert list_res_after.status_code == 200
        items_after = list_res_after.json()["items"]
        v2_after = next(i for i in items_after if i["id"] == v2["id"])
        v1_after = next(i for i in items_after if i["id"] == v1["id"])
        assert v2_after["is_active"] is False
        assert v1_after["is_active"] is True

    def test_list_versions_forbidden_for_consultant(self, consultant_client):
        layer_id = str(uuid.uuid4())
        res = consultant_client.get(f"/api/layers/{layer_id}/data-versions")
        assert res.status_code == 403

    def test_get_version_forbidden_for_consultant(self, consultant_client):
        layer_id = str(uuid.uuid4())
        version_id = str(uuid.uuid4())
        res = consultant_client.get(f"/api/layers/{layer_id}/data-versions/{version_id}")
        assert res.status_code == 403

    def test_activate_version_forbidden_for_consultant(self, consultant_client):
        layer_id = str(uuid.uuid4())
        version_id = str(uuid.uuid4())
        res = consultant_client.post(f"/api/layers/{layer_id}/data-versions/{version_id}/activate")
        assert res.status_code == 403

    def test_activate_failed_version_returns_409(self, admin_client):
        layer = _get_layer_by_kind(admin_client, "CODIGOS_FIJOS")  # POINT
        layer_id = layer["id"]

        # Subir shapefile de polígonos a capa de puntos para forzar fallo
        zip_bytes = build_lotes_zip(count=5)
        imp_res = admin_client.post(
            f"/api/layers/{layer_id}/data-versions",
            files={"file": ("bad_geom.zip", zip_bytes, "application/zip")},
        )
        assert imp_res.status_code == 422

        # Listar y encontrar la versión FAILED
        list_res = admin_client.get(f"/api/layers/{layer_id}/data-versions")
        assert list_res.status_code == 200
        items = list_res.json()["items"]
        failed_versions = [i for i in items if i["status"] == "FAILED"]
        assert len(failed_versions) > 0
        failed_v = failed_versions[0]

        # Intentar activarla debe devolver 409 Conflict
        act_res = admin_client.post(f"/api/layers/{layer_id}/data-versions/{failed_v['id']}/activate")
        assert act_res.status_code == 409

    def test_activate_version_from_other_layer_returns_409(self, admin_client):
        layer_a = _get_layer_by_kind(admin_client, "LOTES")
        layer_b = _get_layer_by_kind(admin_client, "MANZANAS")

        # Cargar versión en capa A
        v_a = admin_client.post(
            f"/api/layers/{layer_a['id']}/data-versions",
            files={"file": ("va.zip", build_lotes_zip(count=5), "application/zip")},
        ).json()

        # Intentar activar en capa B la versión de la capa A
        act_res = admin_client.post(f"/api/layers/{layer_b['id']}/data-versions/{v_a['id']}/activate")
        assert act_res.status_code == 409


