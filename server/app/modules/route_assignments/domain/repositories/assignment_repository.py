from abc import ABC, abstractmethod
from uuid import UUID

from app.modules.route_assignments.domain.entities.assignment import Assignment


class AssignmentRepository(ABC):
    """Contrato de persistencia para la cabecera de asignaciones de ruta."""

    @abstractmethod
    def get_by_id(self, assignment_id: UUID) -> Assignment | None:
        """Recupera una asignación activa por su identificador único."""

    @abstractmethod
    def find_in_progress_by_technician(self, technician_id: str) -> Assignment | None:
        """Recupera una asignación activa en estado IN_PROGRESS del técnico indicado."""

    @abstractmethod
    def save(self, assignment: Assignment) -> None:
        """Inserta o actualiza una asignación en la base de datos."""
