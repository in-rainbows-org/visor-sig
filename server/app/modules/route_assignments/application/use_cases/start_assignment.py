from dataclasses import dataclass
from datetime import datetime, timezone, tzinfo
from uuid import UUID

try:
    from zoneinfo import ZoneInfo
    BOLIVIA_TZ: tzinfo = ZoneInfo("America/La_Paz")
except Exception:
    from datetime import timedelta
    BOLIVIA_TZ = timezone(timedelta(hours=-4))

from app.modules.route_assignments.domain.entities.assignment import Assignment
from app.modules.route_assignments.domain.exceptions import (
    AssignmentDateMismatchException,
    AssignmentNotFoundException,
    AssignmentOwnershipException,
    InvalidAssignmentStatusTransitionException,
    TechnicianActiveAssignmentConflictException,
)
from app.modules.route_assignments.domain.repositories.assignment_repository import (
    AssignmentRepository,
)
from app.modules.route_assignments.domain.value_objects.assignment_status import AssignmentStatus
from app.shared.application.ports import UnitOfWork


@dataclass(slots=True)
class StartAssignmentCommand:
    """Comando para iniciar formalmente la jornada de trabajo de una asignación."""

    assignment_id: UUID
    technician_id: str


class StartAssignmentUseCase:
    """Caso de uso para que un técnico inicie su asignación programada."""

    def __init__(
        self,
        assignment_repo: AssignmentRepository,
        uow: UnitOfWork,
        tz: tzinfo = BOLIVIA_TZ,
    ) -> None:
        self.assignment_repo = assignment_repo
        self.uow = uow
        self.tz = tz

    def execute(self, command: StartAssignmentCommand) -> Assignment:
        assignment = self.assignment_repo.get_by_id(command.assignment_id)
        if assignment is None:
            raise AssignmentNotFoundException()

        if assignment.technician_id != command.technician_id:
            raise AssignmentOwnershipException()

        if assignment.status != AssignmentStatus.ASSIGNED:
            raise InvalidAssignmentStatusTransitionException(
                f"La asignación se encuentra en estado '{assignment.status.value}', solo puede iniciarse si está 'ASSIGNED'."
            )

        today_local = datetime.now(self.tz).date()
        if assignment.scheduled_date != today_local:
            raise AssignmentDateMismatchException(
                f"La asignación está programada para '{assignment.scheduled_date}', hoy es '{today_local}'."
            )

        active_assignment = self.assignment_repo.find_in_progress_by_technician(command.technician_id)
        if active_assignment is not None and active_assignment.id != assignment.id:
            raise TechnicianActiveAssignmentConflictException()

        now = datetime.now(timezone.utc)
        assignment.start(now=now)
        self.assignment_repo.save(assignment)
        self.uow.commit()

        return assignment
