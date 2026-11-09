from datetime import datetime, timezone
from unittest.mock import MagicMock
from uuid import uuid4

import pytest

from app.modules.route_assignments.application.use_cases.complete_stop import (
    CompleteStopCommand,
    CompleteStopUseCase,
)
from app.modules.route_assignments.domain.entities.assignment import Assignment
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
from app.modules.route_assignments.domain.value_objects.assignment_type import AssignmentType
from app.modules.route_assignments.domain.value_objects.stop_status import StopStatus
from app.shared.application.ports import UnitOfWork


def make_assignment(
    technician_id: str = "tech-123",
    status: AssignmentStatus = AssignmentStatus.IN_PROGRESS,
) -> Assignment:
    return Assignment(
        id=uuid4(),
        technician_id=technician_id,
        status=status,
        assignment_type=AssignmentType.CUT,
        scheduled_date=datetime.now(timezone.utc).date(),
        start_latitude=-17.78,
        start_longitude=-63.18,
        total_stops=2,
        total_distance_km=5.0,
    )


def make_stop(
    assignment_id,
    order_index: int = 1,
    status: StopStatus = StopStatus.ARRIVED,
) -> AssignmentStop:
    return AssignmentStop(
        id=uuid4(),
        assignment_id=assignment_id,
        codigo_fijo_id=uuid4(),
        order_index=order_index,
        current_status=1,
        target_status=3,
        status=status,
        route_geometry={},
    )


def test_complete_stop_assignment_not_found():
    assignment_repo = MagicMock(spec=AssignmentRepository)
    stop_repo = MagicMock(spec=AssignmentStopRepository)
    uow = MagicMock(spec=UnitOfWork)
    assignment_repo.get_by_id.return_value = None

    use_case = CompleteStopUseCase(assignment_repo, stop_repo, uow)
    command = CompleteStopCommand(
        assignment_id=uuid4(),
        stop_id=uuid4(),
        technician_id="tech-123",
        status="SUCCESS",
    )

    with pytest.raises(AssignmentNotFoundException):
        use_case.execute(command)


def test_complete_stop_assignment_not_owned():
    assignment_repo = MagicMock(spec=AssignmentRepository)
    stop_repo = MagicMock(spec=AssignmentStopRepository)
    uow = MagicMock(spec=UnitOfWork)
    assignment = make_assignment(technician_id="tech-other")
    assignment_repo.get_by_id.return_value = assignment

    use_case = CompleteStopUseCase(assignment_repo, stop_repo, uow)
    command = CompleteStopCommand(
        assignment_id=assignment.id,
        stop_id=uuid4(),
        technician_id="tech-123",
        status="SUCCESS",
    )

    with pytest.raises(AssignmentOwnershipException):
        use_case.execute(command)


def test_complete_stop_assignment_not_in_progress():
    assignment_repo = MagicMock(spec=AssignmentRepository)
    stop_repo = MagicMock(spec=AssignmentStopRepository)
    uow = MagicMock(spec=UnitOfWork)
    assignment = make_assignment(status=AssignmentStatus.ASSIGNED)
    assignment_repo.get_by_id.return_value = assignment

    use_case = CompleteStopUseCase(assignment_repo, stop_repo, uow)
    command = CompleteStopCommand(
        assignment_id=assignment.id,
        stop_id=uuid4(),
        technician_id="tech-123",
        status="SUCCESS",
    )

    with pytest.raises(InvalidAssignmentStatusTransitionException):
        use_case.execute(command)


def test_complete_stop_stop_not_found():
    assignment_repo = MagicMock(spec=AssignmentRepository)
    stop_repo = MagicMock(spec=AssignmentStopRepository)
    uow = MagicMock(spec=UnitOfWork)
    assignment = make_assignment()
    assignment_repo.get_by_id.return_value = assignment
    stop_repo.get_by_id.return_value = None

    use_case = CompleteStopUseCase(assignment_repo, stop_repo, uow)
    command = CompleteStopCommand(
        assignment_id=assignment.id,
        stop_id=uuid4(),
        technician_id="tech-123",
        status="SUCCESS",
    )

    with pytest.raises(StopNotFoundException):
        use_case.execute(command)


def test_complete_stop_not_arrived():
    assignment_repo = MagicMock(spec=AssignmentRepository)
    stop_repo = MagicMock(spec=AssignmentStopRepository)
    uow = MagicMock(spec=UnitOfWork)
    assignment = make_assignment()
    stop = make_stop(assignment.id, order_index=1, status=StopStatus.IN_TRANSIT)
    assignment_repo.get_by_id.return_value = assignment
    stop_repo.get_by_id.return_value = stop

    use_case = CompleteStopUseCase(assignment_repo, stop_repo, uow)
    command = CompleteStopCommand(
        assignment_id=assignment.id,
        stop_id=stop.id,
        technician_id="tech-123",
        status="SUCCESS",
    )

    with pytest.raises(InvalidStopStatusTransitionException):
        use_case.execute(command)


def test_complete_stop_failed_without_observation_raises():
    assignment_repo = MagicMock(spec=AssignmentRepository)
    stop_repo = MagicMock(spec=AssignmentStopRepository)
    uow = MagicMock(spec=UnitOfWork)
    assignment = make_assignment()
    stop = make_stop(assignment.id, order_index=1, status=StopStatus.ARRIVED)
    assignment_repo.get_by_id.return_value = assignment
    stop_repo.get_by_id.return_value = stop

    use_case = CompleteStopUseCase(assignment_repo, stop_repo, uow)
    command = CompleteStopCommand(
        assignment_id=assignment.id,
        stop_id=stop.id,
        technician_id="tech-123",
        status="FAILED",
        observation="",
    )

    with pytest.raises(MissingStopObservationException):
        use_case.execute(command)


def test_complete_stop_failed_with_observation_success():
    assignment_repo = MagicMock(spec=AssignmentRepository)
    stop_repo = MagicMock(spec=AssignmentStopRepository)
    uow = MagicMock(spec=UnitOfWork)
    assignment = make_assignment()
    stop = make_stop(assignment.id, order_index=1, status=StopStatus.ARRIVED)
    other_stop = make_stop(assignment.id, order_index=2, status=StopStatus.PENDING)
    assignment_repo.get_by_id.return_value = assignment
    stop_repo.get_by_id.return_value = stop
    stop_repo.list_by_assignment_id.return_value = [stop, other_stop]

    use_case = CompleteStopUseCase(assignment_repo, stop_repo, uow)
    command = CompleteStopCommand(
        assignment_id=assignment.id,
        stop_id=stop.id,
        technician_id="tech-123",
        status="FAILED",
        observation="Predio cerrado con candado",
    )

    result = use_case.execute(command)

    assert result.status == StopStatus.FAILED
    assert result.completed_at is not None
    assert result.observation == "Predio cerrado con candado"
    stop_repo.save.assert_called_once_with(stop)
    # Assignment should not complete yet because other_stop is PENDING
    assert assignment.status == AssignmentStatus.IN_PROGRESS
    assignment_repo.save.assert_not_called()
    uow.commit.assert_called_once()


def test_complete_stop_intermediate_stop_success():
    assignment_repo = MagicMock(spec=AssignmentRepository)
    stop_repo = MagicMock(spec=AssignmentStopRepository)
    uow = MagicMock(spec=UnitOfWork)
    assignment = make_assignment()
    stop1 = make_stop(assignment.id, order_index=1, status=StopStatus.ARRIVED)
    stop2 = make_stop(assignment.id, order_index=2, status=StopStatus.PENDING)
    assignment_repo.get_by_id.return_value = assignment
    stop_repo.get_by_id.return_value = stop1
    stop_repo.list_by_assignment_id.return_value = [stop1, stop2]

    use_case = CompleteStopUseCase(assignment_repo, stop_repo, uow)
    command = CompleteStopCommand(
        assignment_id=assignment.id,
        stop_id=stop1.id,
        technician_id="tech-123",
        status="SUCCESS",
        meter_reading="12345",
        observation="Corte realizado",
    )

    result = use_case.execute(command)

    assert result.status == StopStatus.COMPLETED
    assert result.completed_at is not None
    assert result.meter_reading == "12345"
    assert result.observation == "Corte realizado"
    stop_repo.save.assert_called_once_with(stop1)
    assert assignment.status == AssignmentStatus.IN_PROGRESS
    assignment_repo.save.assert_not_called()
    uow.commit.assert_called_once()


def test_complete_stop_last_stop_triggers_assignment_completion():
    assignment_repo = MagicMock(spec=AssignmentRepository)
    stop_repo = MagicMock(spec=AssignmentStopRepository)
    uow = MagicMock(spec=UnitOfWork)
    assignment = make_assignment()
    stop1 = make_stop(assignment.id, order_index=1, status=StopStatus.COMPLETED)
    stop2 = make_stop(assignment.id, order_index=2, status=StopStatus.ARRIVED)
    assignment_repo.get_by_id.return_value = assignment
    stop_repo.get_by_id.return_value = stop2
    stop_repo.list_by_assignment_id.return_value = [stop1, stop2]

    use_case = CompleteStopUseCase(assignment_repo, stop_repo, uow)
    command = CompleteStopCommand(
        assignment_id=assignment.id,
        stop_id=stop2.id,
        technician_id="tech-123",
        status="COMPLETED",
        meter_reading="9999",
    )

    result = use_case.execute(command)

    assert result.status == StopStatus.COMPLETED
    assert result.completed_at is not None
    stop_repo.save.assert_called_once_with(stop2)

    # All stops are now terminal -> assignment must transition to COMPLETED
    assert assignment.status == AssignmentStatus.COMPLETED
    assert assignment.completed_at is not None
    assignment_repo.save.assert_called_once_with(assignment)
    uow.commit.assert_called_once()


def test_complete_stop_invalid_status_raises():
    assignment_repo = MagicMock(spec=AssignmentRepository)
    stop_repo = MagicMock(spec=AssignmentStopRepository)
    uow = MagicMock(spec=UnitOfWork)
    assignment = make_assignment()
    stop = make_stop(assignment.id, order_index=1, status=StopStatus.ARRIVED)
    assignment_repo.get_by_id.return_value = assignment
    stop_repo.get_by_id.return_value = stop

    use_case = CompleteStopUseCase(assignment_repo, stop_repo, uow)
    command = CompleteStopCommand(
        assignment_id=assignment.id,
        stop_id=stop.id,
        technician_id="tech-123",
        status="UNKNOWN_STATUS",
    )

    with pytest.raises(InvalidStopStatusTransitionException):
        use_case.execute(command)
