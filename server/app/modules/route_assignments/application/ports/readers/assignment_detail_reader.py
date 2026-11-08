from abc import ABC, abstractmethod
from uuid import UUID

from app.modules.route_assignments.application.dtos.assignment_detail_dto import AssignmentDetailDTO


class AssignmentDetailReader(ABC):
    """Puerto de lectura optimizada para el detalle completo de una asignación."""

    @abstractmethod
    def get_by_id(self, assignment_id: UUID) -> AssignmentDetailDTO | None:
        """Obtiene la asignación con su cabecera y paradas ordenadas o None si no existe o está eliminada."""
