from __future__ import annotations

from datetime import date, datetime
from uuid import UUID, uuid4

from app.modules.route_assignments.domain.value_objects.assignment_status import (
    AssignmentStatus,
)
from app.modules.route_assignments.domain.value_objects.assignment_type import (
    AssignmentType,
)


class Assignment:
    """Entidad de dominio pura que representa la cabecera de una asignación de ruta."""

    def __init__(
        self,
        id: UUID,
        technician_id: str,
        status: AssignmentStatus,
        assignment_type: AssignmentType,
        scheduled_date: date,
        start_latitude: float,
        start_longitude: float,
        total_stops: int,
        total_distance_km: float,
        started_at: datetime | None = None,
        completed_at: datetime | None = None,
        is_active: bool = True,
    ) -> None:
        self.id = id
        self.technician_id = technician_id
        self.status = status
        self.assignment_type = assignment_type
        self.scheduled_date = scheduled_date
        self.start_latitude = start_latitude
        self.start_longitude = start_longitude
        self.total_stops = total_stops
        self.total_distance_km = total_distance_km
        self.started_at = started_at
        self.completed_at = completed_at
        self.is_active = is_active

    @classmethod
    def create(
        cls,
        *,
        technician_id: str,
        assignment_type: AssignmentType,
        scheduled_date: date,
        start_latitude: float,
        start_longitude: float,
        total_stops: int,
        total_distance_km: float,
    ) -> Assignment:
        """Fábrica de negocio: genera identificador UUID y fija estado inicial ASSIGNED."""
        return cls(
            id=uuid4(),
            technician_id=technician_id,
            status=AssignmentStatus.ASSIGNED,
            assignment_type=assignment_type,
            scheduled_date=scheduled_date,
            start_latitude=start_latitude,
            start_longitude=start_longitude,
            total_stops=total_stops,
            total_distance_km=total_distance_km,
            started_at=None,
            completed_at=None,
            is_active=True,
        )

    def start(self, now: datetime) -> None:
        """Transición a IN_PROGRESS registrando la fecha/hora de inicio."""
        self.status = AssignmentStatus.IN_PROGRESS
        self.started_at = now

    def complete(self, now: datetime) -> None:
        """Transición a COMPLETED registrando la fecha/hora de finalización."""
        self.status = AssignmentStatus.COMPLETED
        self.completed_at = now
