import logging
from uuid import UUID

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect, status
from sqlmodel import Session

from app.core.database import engine
from app.modules.route_assignments.domain.value_objects.assignment_status import AssignmentStatus
from app.modules.route_assignments.infrastructure.api.schemas.realtime_schemas import (
    ConnectionAckPayload,
    LocationPingPayload,
    RealtimeEnvelope,
    RealtimeEventType,
    TechnicianLocationPayload,
)
from app.modules.route_assignments.infrastructure.api.websocket.assignment_connection_manager import (
    assignment_connection_manager,
)
from app.modules.route_assignments.infrastructure.persistence.models.assignment_model import (
    AssignmentModel,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/route-assignments", tags=["Monitoreo en Tiempo Real"])


@router.websocket("/assignments/{assignment_id}/ws")
async def assignment_websocket_endpoint(
    websocket: WebSocket,
    assignment_id: UUID,
    role: str = Query(default="ADMIN"),
) -> None:
    """Canal WebSocket por asignación para seguimiento en vivo de ubicación y paradas.

    Solo permite conexiones a asignaciones activas en estado IN_PROGRESS.
    """
    with Session(engine) as session:
        assignment = session.get(AssignmentModel, assignment_id)
        if not assignment or assignment.deleted_date is not None:
            logger.warning(
                "Intento de conexión WebSocket a asignación inexistente: %s", assignment_id
            )
            await websocket.close(
                code=status.WS_1008_POLICY_VIOLATION,
                reason="Assignment not found",
            )
            return

        if assignment.status != AssignmentStatus.IN_PROGRESS:
            logger.warning(
                "Intento de conexión WebSocket a asignación no activa: %s (status=%s)",
                assignment_id,
                assignment.status,
            )
            await websocket.close(
                code=status.WS_1008_POLICY_VIOLATION,
                reason="Assignment is not in progress",
            )
            return

    await assignment_connection_manager.connect(assignment_id, websocket)

    ack_envelope = RealtimeEnvelope(
        type=RealtimeEventType.CONNECTION_ACK,
        assignment_id=assignment_id,
        payload=ConnectionAckPayload(
            role=role,
            message="Connected to assignment tracking room",
        ).model_dump(),
    )
    await websocket.send_json(ack_envelope.model_dump(mode="json"))

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")

            if msg_type == RealtimeEventType.LOCATION_PING:
                raw_payload = data.get("payload", {})
                ping = LocationPingPayload(**raw_payload)
                tech_location = TechnicianLocationPayload(
                    latitude=ping.latitude,
                    longitude=ping.longitude,
                    heading=ping.heading,
                    speed=ping.speed,
                    timestamp=ping.timestamp,
                )
                broadcast_envelope = RealtimeEnvelope(
                    type=RealtimeEventType.TECHNICIAN_LOCATION,
                    assignment_id=assignment_id,
                    payload=tech_location.model_dump(mode="json"),
                )
                await assignment_connection_manager.broadcast_to_room(
                    assignment_id,
                    broadcast_envelope.model_dump(mode="json"),
                )
    except WebSocketDisconnect:
        await assignment_connection_manager.disconnect(assignment_id, websocket)
    except Exception as exc:
        logger.warning(
            "Cierre por excepción en WebSocket para asignación %s: %s",
            assignment_id,
            exc,
        )
        await assignment_connection_manager.disconnect(assignment_id, websocket)
