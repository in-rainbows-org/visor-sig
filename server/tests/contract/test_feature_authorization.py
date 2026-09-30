import pytest
from fastapi import APIRouter, Depends, FastAPI
from fastapi.testclient import TestClient

from app.core.dependencies import AdminUser, AuthUser, Role
from app.core.errors.handlers import setup_exception_handlers
from app.core.security.auth import get_current_user


def create_auth_test_app() -> FastAPI:
    app = FastAPI()
    setup_exception_handlers(app)

    router = APIRouter(prefix="/api/test")

    @router.get("/admin-only")
    def admin_endpoint(user: AdminUser):
        return {"status": "ok", "user_id": user.user_id, "role": user.role}

    app.include_router(router)
    return app


def test_missing_jwt_returns_401():
    app = create_auth_test_app()
    client = TestClient(app)

    response = client.get("/api/test/admin-only")
    assert response.status_code == 401
    data = response.json()
    assert "detail" in data
    assert data["error"]["code"] == "AUTH_TOKEN_MISSING"


def test_consultant_role_returns_403():
    app = create_auth_test_app()

    def mock_consultant_user() -> AuthUser:
        return AuthUser(user_id="user-123", email="consultor@example.com", role=Role.CONSULTANT)

    app.dependency_overrides[get_current_user] = mock_consultant_user
    client = TestClient(app)

    response = client.get("/api/test/admin-only")
    assert response.status_code == 403
    data = response.json()
    assert "detail" in data
    assert data["error"]["code"] == "AUTH_FORBIDDEN"


def test_admin_role_succeeds_200():
    app = create_auth_test_app()

    def mock_admin_user() -> AuthUser:
        return AuthUser(user_id="admin-999", email="admin@example.com", role=Role.ADMIN)

    app.dependency_overrides[get_current_user] = mock_admin_user
    client = TestClient(app)

    response = client.get("/api/test/admin-only")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["role"] == "ADMIN"
