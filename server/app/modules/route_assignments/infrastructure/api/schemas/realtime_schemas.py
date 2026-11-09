from datetime import datetime, timezone
from enum import Enum
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class RealtimeEventType(str, Enum):
    """Tipos de eventos soportados en la mensajería WebSocket de asignaciones."""

    CONNECTION_ACK = "CONNECTION_ACK"
    LOCATION_PING = "LOCATION_PING"
    TECHNICIAN_LOCATION = "TECHNICIAN_LOCATION"
    STOP_STATUS_UPDATED = "STOP_STATUS_UPDATED"
    ASSIGNMENT_COMPLETED = "ASSIGNMENT_COMPLETED"


class LocationPingPayload(BaseModel):
    """Carga útil enviada por el técnico en cada lectura GPS."""

    latitude: float = Field(ge=-90.0, le=90.0)
    longitude: float = Field(ge=-180.0, le=180.0)
    heading: float | None = Field(default=None, ge=0.0, le=360.0)
    speed: float | None = Field(default=None, ge=0.0)
    timestamp: datetime


class LocationPingMessage(BaseModel):
    """Mensaje entrante de ping de ubicación desde el cliente del técnico."""

    type: RealtimeEventType = RealtimeEventType.LOCATION_PING
    payload: LocationPingPayload


class TechnicianLocationPayload(BaseModel):
    """Carga útil retransmitida a los observadores con la posición del técnico."""

    latitude: float
    longitude: float
    heading: float | None = None
    speed: float | None = None
    timestamp: datetime


class ConnectionAckPayload(BaseModel):
    """Carga útil de confirmación de conexión a la sala."""

    role: str | None = None
    message: str = "Connected to assignment tracking room"


class StopStatusUpdatedPayload(BaseModel):
    """Carga útil notificada cuando una parada cambia de estado operativo."""

    stop_id: UUID
    order_index: int
    status: str
    in_transit_at: datetime | None = None
    arrived_at: datetime | None = None
    completed_at: datetime | None = None
    meter_reading: str | None = None
    observation: str | None = None
    evidence_photo_url: str | None = None
    completed_stops_count: int
    total_stops: int
    is_assignment_completed: bool


class AssignmentCompletedPayload(BaseModel):
    """Carga útil notificada cuando la asignación completa finaliza exitosamente."""

    assignment_id: UUID
    completed_at: datetime
    total_stops: int
    completed_stops: int


class RealtimeEnvelope(BaseModel):
    """Envoltorio estándar para todos los mensajes emitidos por el servidor."""

    type: RealtimeEventType
    assignment_id: UUID
    payload: dict[str, Any]
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
