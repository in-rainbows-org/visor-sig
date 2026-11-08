from abc import ABC, abstractmethod

from app.modules.route_assignments.application.dtos.technician_assignment_dto import (
    TechnicianAssignmentDTO,
)


class TechnicianAssignmentsReader(ABC):
    """Puerto de lectura de asignaciones correspondientes al técnico autenticado."""

    @abstractmethod
    def list_by_technician(self, technician_id: str) -> list[TechnicianAssignmentDTO]:
        """Obtiene todas las asignaciones activas (no eliminadas) asignadas a un técnico."""
