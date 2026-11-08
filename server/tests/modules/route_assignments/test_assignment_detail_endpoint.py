from datetime import date, datetime, timezone
from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.core.security.auth import AuthUser, Role, get_current_user
from app.main import app
from app.modules.route_assignments.application.dtos.assignment_detail_dto import (
    AssignmentDetailDTO,
    AssignmentStopDetailItemDTO,
)
from app.modules.route_assignments.domain.value_objects.assignment_status import AssignmentStatus
from app.modules.route_assignments.domain.value_objects.assignment_type import AssignmentType
from app.modules.route_assignments.domain.value_objects.stop_status import StopStatus


@pytest.fixture
def client():
    return TestClient(app)


def test_assignment_detail_requires_authentication(client):
    """Petición sin cabecera Authorization debe ser rechazada con HTTP 401."""
    assignment_id = uuid4()
    app.dependency_overrides.pop(get_current_user, None)

    response = client.get(f"/api/route-assignments/assignments/{assignment_id}")

    assert response.status_code == 401
    body = response.json()
    assert body["error"]["code"] == "AUTH_TOKEN_MISSING"


def test_assignment_detail_forbidden_for_technician(client):
    """Petición con usuario de rol TECHNICIAN debe ser rechazada con HTTP 403."""
    assignment_id = uuid4()
    app.dependency_overrides[get_current_user] = lambda: AuthUser(
        user_id="tech-01",
        email="tech@example.com",
        role=Role.TECHNICIAN,
    )

    try:
        response = client.get(f"/api/route-assignments/assignments/{assignment_id}")
        assert response.status_code == 403
        body = response.json()
        assert body["error"]["code"] == "AUTH_FORBIDDEN"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_assignment_detail_forbidden_for_consultant(client):
    """Petición con usuario de rol CONSULTANT debe ser rechazada con HTTP 403."""
    assignment_id = uuid4()
    app.dependency_overrides[get_current_user] = lambda: AuthUser(
        user_id="consultant-01",
        email="consultant@example.com",
        role=Role.CONSULTANT,
    )

    try:
        response = client.get(f"/api/route-assignments/assignments/{assignment_id}")
        assert response.status_code == 403
        body = response.json()
        assert body["error"]["code"] == "AUTH_FORBIDDEN"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_assignment_detail_invalid_uuid_returns_422(client):
    """ID no parseable como UUID debe responder HTTP 422."""
    app.dependency_overrides[get_current_user] = lambda: AuthUser(
        user_id="admin-01",
        email="admin@example.com",
        role=Role.ADMIN,
    )

    try:
        response = client.get("/api/route-assignments/assignments/id-invalido-123")
        assert response.status_code == 422
        body = response.json()
        assert body["error"]["code"] == "SCHEMA_VALIDATION_ERROR"
    finally:
        app.dependency_overrides.pop(get_current_user, None)


def test_assignment_detail_not_found_returns_404(client):
    """Asignación inexistente debe responder HTTP 404 con ASSIGNMENT_NOT_FOUND."""
    assignment_id = uuid4()
    app.dependency_overrides[get_current_user] = lambda: AuthUser(
        user_id="admin-01",
        email="admin@example.com",
        role=Role.ADMIN,
    )

    with patch(
        "app.modules.route_assignments.infrastructure.api.routers.route_assignments_router.SqlModelAssignmentDetailReader"
    ) as mock_reader_cls:
        mock_reader = MagicMock()
        mock_reader.get_by_id.return_value = None
        mock_reader_cls.return_value = mock_reader

        try:
            response = client.get(f"/api/route-assignments/assignments/{assignment_id}")
            assert response.status_code == 404
            body = response.json()
            assert body["error"]["code"] == "ASSIGNMENT_NOT_FOUND"
        finally:
            app.dependency_overrides.pop(get_current_user, None)


def test_assignment_detail_admin_success_200(client):
    """Consulta exitosa por Administrador: valida cabecera completa, paradas ordenadas y exclusiones."""
    assignment_id = uuid4()
    stop_id_1 = uuid4()
    stop_id_2 = uuid4()
    cf_id_1 = uuid4()
    cf_id_2 = uuid4()

    in_transit_time = datetime(2026, 11, 10, 8, 30, tzinfo=timezone.utc)
    arrived_time = datetime(2026, 11, 10, 8, 45, tzinfo=timezone.utc)
    completed_time = datetime(2026, 11, 10, 9, 0, tzinfo=timezone.utc)

    mock_dto = AssignmentDetailDTO(
        id=assignment_id,
        technician_name="Juan Perez",
        technician_image="https://example.com/avatar.jpg",
        scheduled_date=date(2026, 11, 10),
        started_at=datetime(2026, 11, 10, 8, 0, tzinfo=timezone.utc),
        completed_at=None,
        status=AssignmentStatus.IN_PROGRESS.value,
        assignment_type=AssignmentType.CUT.value,
        total_stops=2,
        total_distance_km=4.85,
        start_latitude=-17.7812,
        start_longitude=-63.1804,
        completed_stops=1,
        stops=(
            AssignmentStopDetailItemDTO(
                id=stop_id_1,
                codigo_fijo_id=cf_id_1,
                fixed_code=1024,
                name="Titular 1",
                latitude=-17.7850,
                longitude=-63.1850,
                order_index=1,
                status=StopStatus.COMPLETED.value,
                in_transit_at=in_transit_time,
                arrived_at=arrived_time,
                completed_at=completed_time,
                route_geometry={"type": "LineString", "coordinates": [[-63.1804, -17.7812], [-63.1850, -17.7850]]},
            ),
            AssignmentStopDetailItemDTO(
                id=stop_id_2,
                codigo_fijo_id=cf_id_2,
                fixed_code=1025,
                name="Titular 2",
                latitude=-17.7900,
                longitude=-63.1900,
                order_index=2,
                status=StopStatus.IN_TRANSIT.value,
                in_transit_at=datetime(2026, 11, 10, 9, 15, tzinfo=timezone.utc),
                arrived_at=None,
                completed_at=None,
                route_geometry={"type": "LineString", "coordinates": [[-63.1850, -17.7850], [-63.1900, -17.7900]]},
            ),
        ),
    )

    app.dependency_overrides[get_current_user] = lambda: AuthUser(
        user_id="admin-01",
        email="admin@example.com",
        role=Role.ADMIN,
    )

    with patch(
        "app.modules.route_assignments.infrastructure.api.routers.route_assignments_router.SqlModelAssignmentDetailReader"
    ) as mock_reader_cls:
        mock_reader = MagicMock()
        mock_reader.get_by_id.return_value = mock_dto
        mock_reader_cls.return_value = mock_reader

        try:
            response = client.get(f"/api/route-assignments/assignments/{assignment_id}")
            assert response.status_code == 200
            data = response.json()

            # Verificación de cabecera
            assert data["id"] == str(assignment_id)
            assert data["technician_name"] == "Juan Perez"
            assert data["technician_image"] == "https://example.com/avatar.jpg"
            assert data["scheduled_date"] == "2026-11-10"
            assert data["started_at"] is not None
            assert data["completed_at"] is None
            assert data["status"] == "IN_PROGRESS"
            assert data["assignment_type"] == "CUT"
            assert data["total_stops"] == 2
            assert data["total_distance_km"] == 4.85
            assert data["start_latitude"] == -17.7812
            assert data["start_longitude"] == -63.1804
            assert data["completed_stops"] == 1

            # Verificación de que no se exponen identificadores no requeridos en la cabecera
            assert "technician_id" not in data
            assert "technician_email" not in data

            # Verificación de paradas ordenadas
            stops = data["stops"]
            assert len(stops) == 2
            assert stops[0]["id"] == str(stop_id_1)
            assert stops[0]["codigo_fijo_id"] == str(cf_id_1)
            assert stops[0]["order_index"] == 1
            assert stops[0]["fixed_code"] == 1024
            assert stops[0]["name"] == "Titular 1"
            assert stops[0]["status"] == "COMPLETED"
            assert stops[0]["in_transit_at"] is not None
            assert stops[0]["arrived_at"] is not None
            assert stops[0]["completed_at"] is not None
            assert stops[0]["route_geometry"]["type"] == "LineString"

            assert stops[1]["order_index"] == 2
            assert stops[1]["status"] == "IN_TRANSIT"
            assert stops[1]["in_transit_at"] is not None
            assert stops[1]["arrived_at"] is None
            assert stops[1]["completed_at"] is None

            # CRÍTICO: Asegurar que current_status y target_status NO están presentes en ninguna parada
            for s in stops:
                assert "current_status" not in s
                assert "target_status" not in s
        finally:
            app.dependency_overrides.pop(get_current_user, None)
