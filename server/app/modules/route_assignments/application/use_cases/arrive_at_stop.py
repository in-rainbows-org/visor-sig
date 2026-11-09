from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import UUID

from app.modules.route_assignments.domain.entities.assignment_stop import AssignmentStop
from app.modules.route_assignments.domain.exceptions import (
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
class ArriveAtStopCommand:
    """Comando para notificar la llegada del técnico al predio o punto de la parada."""

    assignment_id: UUID
    stop_id: UUID
    technician_id: str


class ArriveAtStopUseCase:
    """Caso de uso para registrar el arribo a una parada previamente en tránsito."""

    def __init__(
        self,
        assignment_repo: AssignmentRepository,
        stop_repo: AssignmentStopRepository,
        uow: UnitOfWork,
    ) -> None:
        self.assignment_repo = assignment_repo
        self.stop_repo = stop_repo
        self.uow = uow

    def execute(self, command: ArriveAtStopCommand) -> AssignmentStop:
        assignment = self.assignment_repo.get_by_id(command.assignment_id)
        if assignment is None:
            raise AssignmentNotFoundException()

        if assignment.technician_id != command.technician_id:
            raise AssignmentOwnershipException()

        if assignment.status != AssignmentStatus.IN_PROGRESS:
            raise InvalidAssignmentStatusTransitionException(
                f"La asignación se encuentra en estado '{assignment.status.value}', debe estar en 'IN_PROGRESS' para registrar llegadas."
            )

        stop = self.stop_repo.get_by_id(command.stop_id)
        if stop is None or stop.assignment_id != command.assignment_id:
            raise StopNotFoundException()

        if stop.status != StopStatus.IN_TRANSIT:
            raise InvalidStopStatusTransitionException(
                f"La parada #{stop.order_index} se encuentra en estado '{stop.status.value}', debe estar en 'IN_TRANSIT' para registrar la llegada."
            )

        now = datetime.now(timezone.utc)
        stop.mark_arrived(now=now)
        self.stop_repo.save(stop)
        self.uow.commit()

        return stop
