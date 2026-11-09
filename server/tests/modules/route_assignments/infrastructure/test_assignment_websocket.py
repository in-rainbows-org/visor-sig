from datetime import datetime, timezone
from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect

from app.main import app
from app.modules.route_assignments.domain.value_objects.assignment_status import AssignmentStatus


@pytest.fixture
def client():
    return TestClient(app)


def test_websocket_rejects_non_existent_assignment(client):
    """Conexión a una asignación que no existe debe cerrarse con código 1008."""
    assignment_id = uuid4()

    with patch("app.modules.route_assignments.infrastructure.api.websocket.assignment_websocket_router.Session") as mock_session_cls:
        mock_session = MagicMock()
        mock_session.__enter__.return_value = mock_session
        mock_session.get.return_value = None
        mock_session_cls.return_value = mock_session

        with pytest.raises(WebSocketDisconnect) as exc_info:
            with client.websocket_connect(f"/api/route-assignments/assignments/{assignment_id}/ws"):
                pass

        assert exc_info.value.code == 1008


def test_websocket_rejects_assignment_not_in_progress(client):
    """Conexión a una asignación con estado diferente a IN_PROGRESS debe cerrarse con código 1008."""
    assignment_id = uuid4()
    mock_assignment = MagicMock()
    mock_assignment.id = assignment_id
    mock_assignment.status = AssignmentStatus.ASSIGNED
    mock_assignment.deleted_date = None

    with patch("app.modules.route_assignments.infrastructure.api.websocket.assignment_websocket_router.Session") as mock_session_cls:
        mock_session = MagicMock()
        mock_session.__enter__.return_value = mock_session
        mock_session.get.return_value = mock_assignment
        mock_session_cls.return_value = mock_session

        with pytest.raises(WebSocketDisconnect) as exc_info:
            with client.websocket_connect(f"/api/route-assignments/assignments/{assignment_id}/ws"):
                pass

        assert exc_info.value.code == 1008


def test_websocket_connects_when_in_progress_and_receives_ack(client):
    """Conexión a una asignación en IN_PROGRESS es aceptada y recibe CONNECTION_ACK."""
    assignment_id = uuid4()
    mock_assignment = MagicMock()
    mock_assignment.id = assignment_id
    mock_assignment.status = AssignmentStatus.IN_PROGRESS
    mock_assignment.deleted_date = None

    with patch("app.modules.route_assignments.infrastructure.api.websocket.assignment_websocket_router.Session") as mock_session_cls:
        mock_session = MagicMock()
        mock_session.__enter__.return_value = mock_session
        mock_session.get.return_value = mock_assignment
        mock_session_cls.return_value = mock_session

        with client.websocket_connect(f"/api/route-assignments/assignments/{assignment_id}/ws?role=ADMIN") as ws:
            ack_msg = ws.receive_json()
            assert ack_msg["type"] == "CONNECTION_ACK"
            assert ack_msg["assignment_id"] == str(assignment_id)
            assert ack_msg["payload"]["role"] == "ADMIN"


def test_websocket_location_ping_broadcasts_technician_location(client):
    """Recepción de LOCATION_PING genera la retransmisión TECHNICIAN_LOCATION a la sala."""
    assignment_id = uuid4()
    mock_assignment = MagicMock()
    mock_assignment.id = assignment_id
    mock_assignment.status = AssignmentStatus.IN_PROGRESS
    mock_assignment.deleted_date = None

    with patch("app.modules.route_assignments.infrastructure.api.websocket.assignment_websocket_router.Session") as mock_session_cls:
        mock_session = MagicMock()
        mock_session.__enter__.return_value = mock_session
        mock_session.get.return_value = mock_assignment
        mock_session_cls.return_value = mock_session

        with client.websocket_connect(f"/api/route-assignments/assignments/{assignment_id}/ws?role=TECHNICIAN") as ws:
            # 1. Consumir CONNECTION_ACK
            ack = ws.receive_json()
            assert ack["type"] == "CONNECTION_ACK"

            # 2. Emitir LOCATION_PING
            now_iso = datetime.now(timezone.utc).isoformat()
            ws.send_json({
                "type": "LOCATION_PING",
                "payload": {
                    "latitude": -17.7833,
                    "longitude": -63.1821,
                    "heading": 180.0,
                    "speed": 12.5,
                    "timestamp": now_iso,
                },
            })

            # 3. Recibir evento TECHNICIAN_LOCATION retransmitido a la sala
            broadcast = ws.receive_json()
            assert broadcast["type"] == "TECHNICIAN_LOCATION"
            assert broadcast["assignment_id"] == str(assignment_id)
            assert broadcast["payload"]["latitude"] == -17.7833
            assert broadcast["payload"]["longitude"] == -63.1821
            assert broadcast["payload"]["heading"] == 180.0
            assert broadcast["payload"]["speed"] == 12.5


@pytest.mark.anyio
async def test_broadcast_stop_status_includes_evidence_photo_url():
    """Valida que _broadcast_stop_status emita el envelope con evidence_photo_url hacia la sala."""
    from unittest.mock import AsyncMock
    from app.modules.route_assignments.domain.entities.assignment_stop import AssignmentStop
    from app.modules.route_assignments.domain.value_objects.stop_status import StopStatus
    from app.modules.route_assignments.infrastructure.api.routers.route_assignments_router import (
        _broadcast_stop_status,
    )
    from app.modules.route_assignments.infrastructure.persistence.repositories.sqlmodel_assignment_stop_repository import (
        SQLModelAssignmentStopRepository,
    )

    assignment_id = uuid4()
    stop = AssignmentStop(
        id=uuid4(),
        assignment_id=assignment_id,
        codigo_fijo_id=uuid4(),
        order_index=1,
        current_status=1,
        target_status=3,
        status=StopStatus.COMPLETED,
        completed_at=datetime.now(timezone.utc),
        meter_reading="12345",
        observation="Trabajo completado",
        evidence_photo_url="https://res.cloudinary.com/demo/image/upload/v1/sig/evidence.jpg",
        route_geometry={},
    )

    mock_stop_repo = MagicMock(spec=SQLModelAssignmentStopRepository)
    mock_stop_repo.list_by_assignment_id.return_value = [stop]

    with patch(
        "app.modules.route_assignments.infrastructure.api.routers.route_assignments_router.assignment_connection_manager"
    ) as mock_manager:
        mock_manager.broadcast_to_room = AsyncMock()

        await _broadcast_stop_status(assignment_id, stop, mock_stop_repo)

        assert mock_manager.broadcast_to_room.call_count >= 1
        call_args = mock_manager.broadcast_to_room.call_args_list[0]
        broadcasted_room = call_args[0][0]
        broadcasted_envelope = call_args[0][1]

        assert broadcasted_room == assignment_id
        assert broadcasted_envelope["type"] == "STOP_STATUS_UPDATED"
        payload = broadcasted_envelope["payload"]
        assert payload["stop_id"] == str(stop.id)
        assert payload["meter_reading"] == "12345"
        assert payload["observation"] == "Trabajo completado"
        assert (
            payload["evidence_photo_url"]
            == "https://res.cloudinary.com/demo/image/upload/v1/sig/evidence.jpg"
        )
