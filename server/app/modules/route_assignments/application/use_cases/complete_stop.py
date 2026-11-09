from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import UUID

from app.modules.route_assignments.domain.entities.assignment_stop import AssignmentStop
from app.modules.route_assignments.domain.exceptions import (
    AssignmentNotFoundException,
    AssignmentOwnershipException,
    InvalidAssignmentStatusTransitionException,
    InvalidStopStatusTransitionException,
    MissingStopObservationException,
    StopNotFoundException,
)
from app.modules.route_assignments.domain.repositories.assignment_repository import (
    AssignmentRepository,
)
from app.modules.route_assignments.domain.repositories.assignment_stop_repository import (
    AssignmentStopRepository,
)
from app.modules.route_assignments.domain.value_objects.assignment_status import AssignmentStatus
from app.modules.route_assignments.domain.value_objects.stop_status import StopStatus
from app.shared.application.ports import UnitOfWork


@dataclass(slots=True)
class CompleteStopCommand:
    """Comando para concluir la visita técnica de una parada (exitosa o fallida)."""

    assignment_id: UUID
    stop_id: UUID
    technician_id: str
    status: str
    observation: str | None = None
    meter_reading: str | None = None


class CompleteStopUseCase:
    """Caso de uso para finalizar la visita a una parada y cerrar la asignación si es la última."""

    def __init__(
        self,
        assignment_repo: AssignmentRepository,
        stop_repo: AssignmentStopRepository,
        uow: UnitOfWork,
    ) -> None:
        self.assignment_repo = assignment_repo
        self.stop_repo = stop_repo
        self.uow = uow

    def execute(self, command: CompleteStopCommand) -> AssignmentStop:
        assignment = self.assignment_repo.get_by_id(command.assignment_id)
        if assignment is None:
            raise AssignmentNotFoundException()

        if assignment.technician_id != command.technician_id:
            raise AssignmentOwnershipException()

        if assignment.status != AssignmentStatus.IN_PROGRESS:
            raise InvalidAssignmentStatusTransitionException(
                f"La asignación se encuentra en estado '{assignment.status.value}', debe estar en 'IN_PROGRESS' para concluir paradas."
            )

        stop = self.stop_repo.get_by_id(command.stop_id)
        if stop is None or stop.assignment_id != command.assignment_id:
            raise StopNotFoundException()

        if stop.status != StopStatus.ARRIVED:
            raise InvalidStopStatusTransitionException(
                f"La parada #{stop.order_index} se encuentra en estado '{stop.status.value}', debe estar en 'ARRIVED' para concluir la visita."
            )

        status_norm = command.status.upper()
        now = datetime.now(timezone.utc)

        if status_norm == "FAILED":
            if not command.observation or not command.observation.strip():
                raise MissingStopObservationException()
            stop.mark_failed(now=now, observation=command.observation.strip())
        elif status_norm in ("SUCCESS", "COMPLETED"):
            stop.mark_completed(
                now=now,
                meter_reading=command.meter_reading,
                observation=command.observation,
            )
        else:
            raise InvalidStopStatusTransitionException(
                f"Estado de finalización no reconocido: '{command.status}'"
            )

        self.stop_repo.save(stop)

        all_stops = self.stop_repo.list_by_assignment_id(command.assignment_id)
        all_terminal = all(
            (stop.status if s.id == stop.id else s.status) in (StopStatus.COMPLETED, StopStatus.FAILED)
            for s in all_stops
        )
        if all_stops and all_terminal:
            assignment.complete(now=now)
            self.assignment_repo.save(assignment)

        self.uow.commit()

        return stop
