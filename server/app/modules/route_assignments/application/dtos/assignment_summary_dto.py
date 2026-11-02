from dataclasses import dataclass
from datetime import date, datetime
from uuid import UUID


@dataclass(frozen=True)
class AssignmentSummaryDTO:
    """Proyección de una asignación con datos agregados del técnico responsable."""

    id: UUID
    technician_id: str
    technician_name: str | None
    technician_image: str | None
    technician_email: str | None
    total_stops: int
    scheduled_date: date
    assignment_type: str
    status: str
    created_date: datetime


@dataclass(frozen=True)
class PaginatedAssignmentsDTO:
    """Resultado paginado de asignaciones."""

    items: list[AssignmentSummaryDTO]
    total: int
    page: int
    page_size: int
    total_pages: int
