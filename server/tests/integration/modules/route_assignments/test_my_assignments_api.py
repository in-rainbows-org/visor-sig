from datetime import date, datetime, timezone
from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.core.security.auth import AuthUser, Role, get_current_user
from app.main import app
from app.modules.route_assignments.application.dtos.technician_assignment_dto import (
    TechnicianAssignmentDTO,
)


@pytest.fixture
def client():
    return TestClient(app)


def test_my_assignments_requires_authentication(client):
    """Petición sin cabecera Authorization debe ser rechazada con HTTP 401."""
    app.dependency_overrides.pop(get_current_user, None)

    response = client.get("/api/route-assignments/my-assignments")

    assert response.status_code == 401
    body = response.json()
    assert body["error"]["code"] == "AUTH_TOKEN_MISSING"


def test_my_assignments_forbidden_for_admin_or_consultant(client):
    """Petición con rol ADMIN debe ser rechazada con HTTP 403."""
    app.dependency_overrides[get_current_user] = lambda: AuthUser(
        user_id="admin-01",
        email="admin@example.com",
        role=Role.ADMIN,
    )

    try:
        response = client.get("/api/route-assignments/my-assignments")
        assert response.status_code == 403
        body = response.json()
        assert body["error"]["code"] == "AUTH_FORBIDDEN"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_my_assignments_success_for_technician(client):
    """Petición con rol TECHNICIAN debe retornar HTTP 200 con la lista de asignaciones."""
    tech_id = "tech-uuid-1234"
    assignment_id = uuid4()
    mock_dto = TechnicianAssignmentDTO(
        id=assignment_id,
        assignment_type="CUT",
        status="IN_PROGRESS",
        scheduled_date=date(2026, 11, 8),
        total_stops=8,
        total_distance_km=14.2,
        started_at=datetime(2026, 11, 8, 8, 30, tzinfo=timezone.utc),
        completed_at=None,
        created_date=datetime(2026, 11, 8, 8, 0, tzinfo=timezone.utc),
    )

    app.dependency_overrides[get_current_user] = lambda: AuthUser(
        user_id=tech_id,
        email="tech@example.com",
        role=Role.TECHNICIAN,
    )

    try:
        with patch(
            "app.modules.route_assignments.infrastructure.api.routers.route_assignments_router.SqlModelTechnicianAssignmentsReader"
        ) as mock_reader_cls:
            mock_reader_inst = MagicMock()
            mock_reader_cls.return_value = mock_reader_inst
            mock_reader_inst.list_by_technician.return_value = [mock_dto]

            response = client.get("/api/route-assignments/my-assignments")

            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            assert len(data) == 1
            item = data[0]
            assert item["id"] == str(assignment_id)
            assert item["assignment_type"] == "CUT"
            assert item["status"] == "IN_PROGRESS"
            assert item["scheduled_date"] == "2026-11-08"
            assert item["total_stops"] == 8
            assert item["total_distance_km"] == 14.2
            mock_reader_inst.list_by_technician.assert_called_once_with(tech_id)
    finally:
        app.dependency_overrides.pop(get_current_user, None)
