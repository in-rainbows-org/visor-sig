from dataclasses import dataclass
from datetime import date, datetime
from uuid import UUID


@dataclass(frozen=True)
class TechnicianAssignmentDTO:
    """Proyección de una asignación para el portal de trabajo del técnico."""

    id: UUID
    assignment_type: str
    status: str
    scheduled_date: date
    total_stops: int
    total_distance_km: float
    started_at: datetime | None
    completed_at: datetime | None
    created_date: datetime
