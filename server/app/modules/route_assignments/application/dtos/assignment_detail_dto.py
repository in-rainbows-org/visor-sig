from dataclasses import dataclass
from datetime import date, datetime
from typing import Any
from uuid import UUID


@dataclass(frozen=True, slots=True)
class AssignmentStopDetailItemDTO:
    """Información consolidada de una parada para la vista de detalle."""

    id: UUID
    codigo_fijo_id: UUID
    fixed_code: int | None
    name: str | None
    latitude: float
    longitude: float
    order_index: int
    status: str
    in_transit_at: datetime | None
    arrived_at: datetime | None
    completed_at: datetime | None
    route_geometry: dict[str, Any]


@dataclass(frozen=True, slots=True)
class AssignmentDetailDTO:
    """Información completa de una asignación con cabecera y paradas ordenadas."""

    id: UUID
    technician_name: str | None
    technician_image: str | None
    scheduled_date: date
    started_at: datetime | None
    completed_at: datetime | None
    status: str
    assignment_type: str
    total_stops: int
    total_distance_km: float
    start_latitude: float
    start_longitude: float
    completed_stops: int
    stops: tuple[AssignmentStopDetailItemDTO, ...]
    technician_id: str = ""
