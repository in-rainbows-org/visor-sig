import os
import yaml
import pytest
from app.main import app

SPEC_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../../../specs/006-map-visualization/contracts/openapi.yaml")
)


@pytest.fixture(scope="module")
def openapi_yaml() -> dict:
    with open(SPEC_PATH, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


@pytest.fixture(scope="module")
def fastapi_openapi() -> dict:
    return app.openapi()


class TestOpenAPIContract:

    def test_all_contract_paths_and_methods_implemented(self, openapi_yaml, fastapi_openapi):
        contract_paths = openapi_yaml["paths"]
        app_paths = fastapi_openapi["paths"]

        for path, operations in contract_paths.items():
            # El prefijo /api se aplica en app.include_router
            # Normalizar nombres de parámetros de ruta (ej. {layerId} -> {layer_id})
            normalized_path = "/api" + path.replace("{layerId}", "{layer_id}").replace("{versionId}", "{version_id}")
            assert (
                normalized_path in app_paths
            ), f"La ruta del contrato {path} (mapeada a {normalized_path}) no está implementada en FastAPI."

            app_operations = app_paths[normalized_path]
            HTTP_METHODS = {"get", "post", "put", "delete", "patch", "options", "head"}
            for method in operations.keys():
                if method.lower() not in HTTP_METHODS:
                    continue
                assert (
                    method.lower() in app_operations
                ), f"El método HTTP {method.upper()} no está implementado para {normalized_path}."

    def test_obsolete_endpoints_not_present(self, fastapi_openapi):
        app_paths = fastapi_openapi["paths"]
        # POST /api/layers no debe existir
        if "/api/layers" in app_paths:
            assert "post" not in app_paths["/api/layers"], "POST /api/layers no debe existir en catálogo fijo"
        # /api/layers/{layer_id} individual read/mutation no debe existir (solo /color)
        assert "/api/layers/{layer_id}" not in app_paths, "/api/layers/{layer_id} no debe existir"
        # /api/layers/{layer_id}/data-versions/{version_id} individual read no debe existir
        assert "/api/layers/{layer_id}/data-versions/{version_id}" not in app_paths, "/api/layers/{layer_id}/data-versions/{version_id} no debe existir"
        # /activate y /deactivate a nivel de capa no deben existir
        assert "/api/layers/{layer_id}/activate" not in app_paths
        assert "/api/layers/{layer_id}/deactivate" not in app_paths

    def test_layer_schema_conformance(self, openapi_yaml, fastapi_openapi):
        layer_schema = fastapi_openapi["components"]["schemas"]["LayerRead"]
        required_fields = {"id", "kind", "name", "geometry_type", "color", "active_data_version_id", "updated_at"}
        actual_fields = set(layer_schema["properties"].keys())
        assert required_fields.issubset(actual_fields)
        assert "is_enabled" not in actual_fields

    def test_data_version_schema_conformance(self, openapi_yaml, fastapi_openapi):
        version_schema = fastapi_openapi["components"]["schemas"]["DataVersionRead"]
        required_fields = {
            "id",
            "layer_id",
            "version_number",
            "status",
            "source_filename",
            "feature_count",
            "error_message",
            "is_active",
            "created_at",
        }
        actual_fields = set(version_schema["properties"].keys())
        assert required_fields.issubset(actual_fields)

