from abc import ABC, abstractmethod
from datetime import date

from app.modules.route_assignments.application.dtos.assignment_summary_dto import (
    PaginatedAssignmentsDTO,
    TechnicianOptionDTO,
)


class AssignmentSummaryReader(ABC):
    """Puerto de lectura optimizada para asignaciones de ruta con outer join hacia usuarios."""

    @abstractmethod
    def get_paginated(
        self,
        page: int,
        page_size: int,
        technician_id: str | None = None,
        scheduled_date_from: date | None = None,
        scheduled_date_to: date | None = None,
    ) -> PaginatedAssignmentsDTO:
        """Obtiene una página de asignaciones activas filtradas."""

    @abstractmethod
    def list_technicians(self) -> list[TechnicianOptionDTO]:
        """Obtiene la lista de usuarios con rol de técnico operativo."""
