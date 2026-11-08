from dataclasses import dataclass
from uuid import UUID

from app.modules.route_assignments.application.dtos.assignment_detail_dto import AssignmentDetailDTO
from app.modules.route_assignments.application.ports.readers.assignment_detail_reader import (
    AssignmentDetailReader,
)
from app.modules.route_assignments.domain.exceptions import AssignmentNotFoundException


@dataclass(frozen=True, slots=True)
class GetAssignmentDetailQuery:
    """Consulta para obtener el detalle completo de una asignación."""

    assignment_id: UUID


class GetAssignmentDetailQueryHandler:
    """Manejador para consultar el detalle de asignación y verificar existencia."""

    def __init__(self, reader: AssignmentDetailReader) -> None:
        self.reader = reader

    def execute(self, query: GetAssignmentDetailQuery) -> AssignmentDetailDTO:
        result = self.reader.get_by_id(query.assignment_id)
        if result is None:
            raise AssignmentNotFoundException(
                f"La asignación '{query.assignment_id}' no fue encontrada o fue dada de baja."
            )
        return result
