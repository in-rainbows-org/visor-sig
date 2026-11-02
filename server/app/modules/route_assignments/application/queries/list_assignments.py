from dataclasses import dataclass
from datetime import date

from app.modules.route_assignments.application.dtos.assignment_summary_dto import (
    PaginatedAssignmentsDTO,
)
from app.modules.route_assignments.application.ports.readers.assignment_summary_reader import (
    AssignmentSummaryReader,
)
from app.modules.route_assignments.domain.exceptions import InvalidDateRangeException


@dataclass(frozen=True, slots=True)
class ListAssignmentsQuery:
    """Consulta paginada con filtros para listar asignaciones."""

    page: int = 1
    page_size: int = 10
    technician_id: str | None = None
    scheduled_date_from: date | None = None
    scheduled_date_to: date | None = None


class ListAssignmentsQueryHandler:
    """Manejador de consulta para listar asignaciones con validación de fechas."""

    def __init__(self, reader: AssignmentSummaryReader) -> None:
        self.reader = reader

    def execute(self, query: ListAssignmentsQuery) -> PaginatedAssignmentsDTO:
        has_from = query.scheduled_date_from is not None
        has_to = query.scheduled_date_to is not None

        if has_from != has_to:
            raise InvalidDateRangeException(
                "Debe especificar tanto la fecha inicial como la fecha final del rango, o ambas deben omitirse."
            )

        if has_from and has_to and query.scheduled_date_from > query.scheduled_date_to:  # type: ignore[operator]
            raise InvalidDateRangeException(
                "La fecha inicial del rango no puede ser posterior a la fecha final."
            )

        return self.reader.get_paginated(
            page=query.page,
            page_size=query.page_size,
            technician_id=query.technician_id,
            scheduled_date_from=query.scheduled_date_from,
            scheduled_date_to=query.scheduled_date_to,
        )
