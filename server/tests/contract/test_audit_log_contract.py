import pytest
from fastapi.testclient import TestClient

from app.core.dependencies import AuthUser, Role
from app.core.security.auth import get_current_user
from app.main import app


def test_audit_logs_endpoint_unauthenticated_returns_401():
    client = TestClient(app)
    response = client.get("/api/audit-logs")
    assert response.status_code == 401


def test_audit_logs_endpoint_consultant_returns_403():
    def mock_consultant():
        return AuthUser(user_id="consultant-01", email="consultor@test.com", role=Role.CONSULTANT)

    app.dependency_overrides[get_current_user] = mock_consultant
    try:
        client = TestClient(app)
        response = client.get("/api/audit-logs")
        assert response.status_code == 403
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_audit_logs_endpoint_admin_returns_200():
    def mock_admin():
        return AuthUser(user_id="admin-01", email="admin@test.com", role=Role.ADMIN)

    app.dependency_overrides[get_current_user] = mock_admin
    try:
        client = TestClient(app)
        response = client.get("/api/audit-logs?page=1&page_size=5")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert "page" in data
        assert "page_size" in data
        assert "total_pages" in data
        assert data["page"] == 1
        assert data["page_size"] == 5
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_record_client_audit_log_post_unauthenticated_returns_401():
    client = TestClient(app)
    response = client.post(
        "/api/audit-logs",
        json={"action": "LOGIN", "description": "Login test"},
    )
    assert response.status_code == 401


def test_record_client_audit_log_post_authenticated_returns_201():
    def mock_user():
        return AuthUser(user_id="usr-test-1", email="user@test.com", role=Role.CONSULTANT)

    app.dependency_overrides[get_current_user] = mock_user
    try:
        client = TestClient(app)
        response = client.post(
            "/api/audit-logs",
            json={"action": "LOGIN", "description": "Login test from client"},
        )
        assert response.status_code == 201
        assert response.json() == {"status": "ok"}
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_record_client_audit_log_post_invalid_action_returns_422():
    def mock_user():
        return AuthUser(user_id="usr-test-1", email="user@test.com", role=Role.CONSULTANT)

    app.dependency_overrides[get_current_user] = mock_user
    try:
        client = TestClient(app)
        response = client.post(
            "/api/audit-logs",
            json={"action": "INVALID_ACTION", "description": "Invalid test"},
        )
        assert response.status_code == 422
    finally:
        app.dependency_overrides.pop(get_current_user, None)
