from abc import ABC, abstractmethod
from uuid import UUID

from app.modules.route_assignments.domain.entities.assignment_stop import AssignmentStop


class AssignmentStopRepository(ABC):
    """Contrato de persistencia para paradas de asignaciones de ruta."""

    @abstractmethod
    def get_by_id(self, stop_id: UUID) -> AssignmentStop | None:
        """Recupera una parada activa por su identificador único."""

    @abstractmethod
    def list_by_assignment_id(self, assignment_id: UUID) -> list[AssignmentStop]:
        """Obtiene todas las paradas activas asociadas a una asignación ordenadas correlativamente."""

    @abstractmethod
    def save(self, stop: AssignmentStop) -> None:
        """Inserta o actualiza una parada."""

    @abstractmethod
    def save_all(self, stops: list[AssignmentStop]) -> None:
        """Inserta o actualiza un lote de paradas."""
