from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import UUID

from app.modules.route_assignments.domain.entities.assignment_stop import AssignmentStop
from app.modules.route_assignments.domain.exceptions import (
    ActiveStopConflictException,
    AssignmentNotFoundException,
    AssignmentOwnershipException,
    InvalidAssignmentStatusTransitionException,
    InvalidStopStatusTransitionException,
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
class StartStopTransitCommand:
    """Comando para notificar el inicio de traslado del técnico hacia una parada."""

    assignment_id: UUID
    stop_id: UUID
    technician_id: str


class StartStopTransitUseCase:
    """Caso de uso para iniciar el traslado hacia una parada con regla de exclusividad."""

    def __init__(
        self,
        assignment_repo: AssignmentRepository,
        stop_repo: AssignmentStopRepository,
        uow: UnitOfWork,
    ) -> None:
        self.assignment_repo = assignment_repo
        self.stop_repo = stop_repo
        self.uow = uow

    def execute(self, command: StartStopTransitCommand) -> AssignmentStop:
        assignment = self.assignment_repo.get_by_id(command.assignment_id)
        if assignment is None:
            raise AssignmentNotFoundException()

        if assignment.technician_id != command.technician_id:
            raise AssignmentOwnershipException()

        if assignment.status != AssignmentStatus.IN_PROGRESS:
            raise InvalidAssignmentStatusTransitionException(
                f"La asignación se encuentra en estado '{assignment.status.value}', debe estar en 'IN_PROGRESS' para iniciar traslados."
            )

        stop = self.stop_repo.get_by_id(command.stop_id)
        if stop is None or stop.assignment_id != command.assignment_id:
            raise StopNotFoundException()

        if stop.status != StopStatus.PENDING:
            raise InvalidStopStatusTransitionException(
                f"La parada #{stop.order_index} se encuentra en estado '{stop.status.value}', solo puede pasar a 'IN_TRANSIT' si está 'PENDING'."
            )

        # Regla de Exclusividad: Ninguna otra parada puede estar en IN_TRANSIT o ARRIVED
        all_stops = self.stop_repo.list_by_assignment_id(command.assignment_id)
        for s in all_stops:
            if s.id != stop.id and s.status in (StopStatus.IN_TRANSIT, StopStatus.ARRIVED):
                raise ActiveStopConflictException(
                    f"La parada #{s.order_index} ya se encuentra en estado '{s.status.value}'. Debe concluirse antes de iniciar otra."
                )

        now = datetime.now(timezone.utc)
        stop.start_transit(now=now)
        self.stop_repo.save(stop)
        self.uow.commit()

        return stop
