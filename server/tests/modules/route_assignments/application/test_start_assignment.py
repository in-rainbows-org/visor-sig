from datetime import date, datetime, timedelta, timezone
from unittest.mock import MagicMock
from uuid import uuid4

import pytest

from app.modules.route_assignments.application.use_cases.start_assignment import (
    BOLIVIA_TZ,
    StartAssignmentCommand,
    StartAssignmentUseCase,
)
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
from app.modules.route_assignments.domain.value_objects.assignment_type import AssignmentType
from app.shared.application.ports import UnitOfWork


def make_assignment(
    technician_id: str = "tech-123",
    status: AssignmentStatus = AssignmentStatus.ASSIGNED,
    scheduled_date: date | None = None,
) -> Assignment:
    if scheduled_date is None:
        scheduled_date = datetime.now(BOLIVIA_TZ).date()
    return Assignment(
        id=uuid4(),
        technician_id=technician_id,
        status=status,
        assignment_type=AssignmentType.CUT,
        scheduled_date=scheduled_date,
        start_latitude=-17.78,
        start_longitude=-63.18,
        total_stops=5,
        total_distance_km=12.5,
    )


def test_start_assignment_not_found():
    repo = MagicMock(spec=AssignmentRepository)
    uow = MagicMock(spec=UnitOfWork)
    repo.get_by_id.return_value = None

    use_case = StartAssignmentUseCase(repo, uow)
    command = StartAssignmentCommand(assignment_id=uuid4(), technician_id="tech-123")

    with pytest.raises(AssignmentNotFoundException):
        use_case.execute(command)


def test_start_assignment_not_owned():
    repo = MagicMock(spec=AssignmentRepository)
    uow = MagicMock(spec=UnitOfWork)
    assignment = make_assignment(technician_id="tech-different")
    repo.get_by_id.return_value = assignment

    use_case = StartAssignmentUseCase(repo, uow)
    command = StartAssignmentCommand(assignment_id=assignment.id, technician_id="tech-123")

    with pytest.raises(AssignmentOwnershipException):
        use_case.execute(command)


def test_start_assignment_invalid_status():
    repo = MagicMock(spec=AssignmentRepository)
    uow = MagicMock(spec=UnitOfWork)
    assignment = make_assignment(status=AssignmentStatus.IN_PROGRESS)
    repo.get_by_id.return_value = assignment

    use_case = StartAssignmentUseCase(repo, uow)
    command = StartAssignmentCommand(assignment_id=assignment.id, technician_id="tech-123")

    with pytest.raises(InvalidAssignmentStatusTransitionException):
        use_case.execute(command)


def test_start_assignment_date_mismatch():
    repo = MagicMock(spec=AssignmentRepository)
    uow = MagicMock(spec=UnitOfWork)
    yesterday = datetime.now(BOLIVIA_TZ).date() - timedelta(days=1)
    assignment = make_assignment(scheduled_date=yesterday)
    repo.get_by_id.return_value = assignment

    use_case = StartAssignmentUseCase(repo, uow)
    command = StartAssignmentCommand(assignment_id=assignment.id, technician_id="tech-123")

    with pytest.raises(AssignmentDateMismatchException) as exc_info:
        use_case.execute(command)

    today_local = datetime.now(BOLIVIA_TZ).date()
    assert str(today_local) in str(exc_info.value)
    assert str(yesterday) in str(exc_info.value)


def test_start_assignment_bolivia_timezone_boundary():
    """Verifica que la asignación se valida contra la fecha de Bolivia (UTC-4) y no contra UTC puro."""
    repo = MagicMock(spec=AssignmentRepository)
    uow = MagicMock(spec=UnitOfWork)

    # Simular una fecha que coincide con la fecha local de Bolivia
    today_bolivia = datetime.now(BOLIVIA_TZ).date()
    assignment = make_assignment(scheduled_date=today_bolivia)
    repo.get_by_id.return_value = assignment
    repo.find_in_progress_by_technician.return_value = None

    use_case = StartAssignmentUseCase(repo, uow)
    command = StartAssignmentCommand(assignment_id=assignment.id, technician_id="tech-123")

    result = use_case.execute(command)
    assert result.status == AssignmentStatus.IN_PROGRESS
    assert result.started_at is not None


def test_start_assignment_custom_timezone_injection():
    """Verifica que el caso de uso admita inyección de zona horaria explícita."""
    repo = MagicMock(spec=AssignmentRepository)
    uow = MagicMock(spec=UnitOfWork)

    custom_tz = timezone(timedelta(hours=-4))
    today_custom = datetime.now(custom_tz).date()

    assignment = make_assignment(scheduled_date=today_custom)
    repo.get_by_id.return_value = assignment
    repo.find_in_progress_by_technician.return_value = None

    use_case = StartAssignmentUseCase(repo, uow, tz=custom_tz)
    command = StartAssignmentCommand(assignment_id=assignment.id, technician_id="tech-123")

    result = use_case.execute(command)
    assert result.status == AssignmentStatus.IN_PROGRESS


def test_start_assignment_technician_already_has_active():
    repo = MagicMock(spec=AssignmentRepository)
    uow = MagicMock(spec=UnitOfWork)
    assignment = make_assignment()
    other_active = make_assignment()
    repo.get_by_id.return_value = assignment
    repo.find_in_progress_by_technician.return_value = other_active

    use_case = StartAssignmentUseCase(repo, uow)
    command = StartAssignmentCommand(assignment_id=assignment.id, technician_id="tech-123")

    with pytest.raises(TechnicianActiveAssignmentConflictException):
        use_case.execute(command)


def test_start_assignment_success():
    repo = MagicMock(spec=AssignmentRepository)
    uow = MagicMock(spec=UnitOfWork)
    assignment = make_assignment()
    repo.get_by_id.return_value = assignment
    repo.find_in_progress_by_technician.return_value = None

    use_case = StartAssignmentUseCase(repo, uow)
    command = StartAssignmentCommand(assignment_id=assignment.id, technician_id="tech-123")

    result = use_case.execute(command)

    assert result.status == AssignmentStatus.IN_PROGRESS
    assert result.started_at is not None
    repo.save.assert_called_once_with(assignment)
    uow.commit.assert_called_once()
