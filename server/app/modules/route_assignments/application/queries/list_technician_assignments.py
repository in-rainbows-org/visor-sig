from dataclasses import dataclass

from app.modules.route_assignments.application.dtos.technician_assignment_dto import (
    TechnicianAssignmentDTO,
)
from app.modules.route_assignments.application.ports.readers.technician_assignments_reader import (
    TechnicianAssignmentsReader,
)


@dataclass(frozen=True, slots=True)
class ListTechnicianAssignmentsQuery:
    """Consulta para listar las asignaciones pertenecientes al técnico autenticado."""

    technician_id: str


class ListTechnicianAssignmentsQueryHandler:
    """Manejador de consulta para listar asignaciones del técnico."""

    def __init__(self, reader: TechnicianAssignmentsReader) -> None:
        self.reader = reader

    def execute(self, query: ListTechnicianAssignmentsQuery) -> list[TechnicianAssignmentDTO]:
        return self.reader.list_by_technician(query.technician_id)
