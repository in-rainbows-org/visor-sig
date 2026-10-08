import io
import os
import uuid
import zipfile
import pytest
from fastapi.testclient import TestClient

from app.core.security.auth import AuthUser, Role, get_current_user
from app.main import app
from tests.fixtures_shapefiles import build_lotes_zip

FIXTURE_DIR = "venv/lib/python3.14/site-packages/pyogrio/tests/fixtures/naturalearth_lowres"

WKT_3857 = (
    'PROJCS["WGS_1984_Web_Mercator_Auxiliary_Sphere",'
    'GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],'
    'PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]],'
    'PROJECTION["Mercator_Auxiliary_Sphere"],PARAMETER["False_Easting",0.0],'
    'PARAMETER["False_Northing",0.0],PARAMETER["Central_Meridian",0.0],'
    'PARAMETER["Standard_Parallel_1",0.0],PARAMETER["Auxiliary_Sphere_Type",0.0],UNIT["Meter",1.0]]'
)


def _build_zip(exclude_extensions: list[str] | None = None, prj_content: str | None = None) -> bytes:
    exclude = set(exclude_extensions or [])
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as zf:
        for fname in os.listdir(FIXTURE_DIR):
            ext = os.path.splitext(fname)[1]
            if ext in exclude:
                continue
            file_path = os.path.join(FIXTURE_DIR, fname)
            if ext == ".prj" and prj_content is not None:
                zf.writestr(fname, prj_content)
            else:
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


def _get_layer_by_kind(client: TestClient, kind: str) -> dict:
    res = client.get("/api/layers")
    assert res.status_code == 200
    for item in res.json()["items"]:
        if item["kind"] == kind:
            return item
    pytest.skip(f"Capa {kind} no encontrada en catálogo")


class TestGeographicDataImportContract:
    def test_import_unauthorized_missing_jwt(self, unauthenticated_client):
        layer_id = str(uuid.uuid4())
        response = unauthenticated_client.post(
            f"/api/layers/{layer_id}/data-versions",
            files={"file": ("data.zip", b"PKdummy", "application/zip")},
        )
        assert response.status_code == 401

    def test_import_forbidden_for_consultant(self, consultant_client):
        layer_id = str(uuid.uuid4())
        response = consultant_client.post(
            f"/api/layers/{layer_id}/data-versions",
            files={"file": ("data.zip", b"PKdummy", "application/zip")},
        )
        assert response.status_code == 403

    def test_import_nonexistent_layer_returns_404(self, admin_client):
        layer_id = str(uuid.uuid4())
        zip_bytes = _build_zip()
        response = admin_client.post(
            f"/api/layers/{layer_id}/data-versions",
            files={"file": ("naturalearth.zip", zip_bytes, "application/zip")},
        )
        assert response.status_code == 404

    def test_import_unsupported_media_type_returns_415(self, admin_client):
        layer = _get_layer_by_kind(admin_client, "LOTES")
        layer_id = layer["id"]

        # Intentar cargar .rar
        response = admin_client.post(
            f"/api/layers/{layer_id}/data-versions",
            files={"file": ("archive.rar", b"Rar!dummy", "application/x-rar-compressed")},
        )
        assert response.status_code == 415

    def test_import_missing_shapefile_component_returns_422(self, admin_client):
        layer = _get_layer_by_kind(admin_client, "LOTES")
        layer_id = layer["id"]

        zip_bytes = _build_zip(exclude_extensions=[".shx"])
        response = admin_client.post(
            f"/api/layers/{layer_id}/data-versions",
            files={"file": ("missing_shx.zip", zip_bytes, "application/zip")},
        )
        assert response.status_code == 422

    def test_import_invalid_crs_returns_422(self, admin_client):
        layer = _get_layer_by_kind(admin_client, "LOTES")
        layer_id = layer["id"]

        zip_bytes = _build_zip(prj_content=WKT_3857)
        response = admin_client.post(
            f"/api/layers/{layer_id}/data-versions",
            files={"file": ("bad_crs.zip", zip_bytes, "application/zip")},
        )
        assert response.status_code == 422

    def test_import_incompatible_geometry_type_returns_422(self, admin_client):
        layer = _get_layer_by_kind(admin_client, "CODIGOS_FIJOS")  # POINT
        layer_id = layer["id"]

        zip_bytes = _build_zip()  # Contiene polígonos
        response = admin_client.post(
            f"/api/layers/{layer_id}/data-versions",
            files={"file": ("polygons.zip", zip_bytes, "application/zip")},
        )
        assert response.status_code == 422

    def test_import_successful_returns_201_and_publishes_version(self, admin_client):
        layer = _get_layer_by_kind(admin_client, "LOTES")  # POLYGON
        layer_id = layer["id"]

        zip_bytes = build_lotes_zip(count=10)
        response = admin_client.post(
            f"/api/layers/{layer_id}/data-versions",
            files={"file": ("lotes.zip", zip_bytes, "application/zip")},
        )
        assert response.status_code == 201
        data = response.json()
        assert data["layer_id"] == layer_id
        assert data["status"] == "READY"
        assert data["feature_count"] == 10
        assert data["is_active"] is True
        assert data["source_filename"] == "lotes.zip"
        assert data["error_message"] is None

        # Verificar que la capa ahora tiene active_data_version_id actualizado
        list_res = admin_client.get("/api/layers")
        assert list_res.status_code == 200
        lote_layer = next(item for item in list_res.json()["items"] if item["id"] == layer_id)
        assert lote_layer["active_data_version_id"] == data["id"]

