from datetime import datetime, timezone
from unittest.mock import MagicMock
from uuid import uuid4

import pytest

from app.modules.route_assignments.application.use_cases.arrive_at_stop import (
    ArriveAtStopCommand,
    ArriveAtStopUseCase,
)
from app.modules.route_assignments.domain.entities.assignment import Assignment
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
        total_stops=3,
        total_distance_km=10.0,
    )


def make_stop(
    assignment_id,
    order_index: int = 1,
    status: StopStatus = StopStatus.IN_TRANSIT,
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


def test_arrive_at_stop_assignment_not_found():
    assignment_repo = MagicMock(spec=AssignmentRepository)
    stop_repo = MagicMock(spec=AssignmentStopRepository)
    uow = MagicMock(spec=UnitOfWork)
    assignment_repo.get_by_id.return_value = None

    use_case = ArriveAtStopUseCase(assignment_repo, stop_repo, uow)
    command = ArriveAtStopCommand(assignment_id=uuid4(), stop_id=uuid4(), technician_id="tech-123")

    with pytest.raises(AssignmentNotFoundException):
        use_case.execute(command)


def test_arrive_at_stop_assignment_not_owned():
    assignment_repo = MagicMock(spec=AssignmentRepository)
    stop_repo = MagicMock(spec=AssignmentStopRepository)
    uow = MagicMock(spec=UnitOfWork)
    assignment = make_assignment(technician_id="tech-other")
    assignment_repo.get_by_id.return_value = assignment

    use_case = ArriveAtStopUseCase(assignment_repo, stop_repo, uow)
    command = ArriveAtStopCommand(assignment_id=assignment.id, stop_id=uuid4(), technician_id="tech-123")

    with pytest.raises(AssignmentOwnershipException):
        use_case.execute(command)


def test_arrive_at_stop_assignment_not_in_progress():
    assignment_repo = MagicMock(spec=AssignmentRepository)
    stop_repo = MagicMock(spec=AssignmentStopRepository)
    uow = MagicMock(spec=UnitOfWork)
    assignment = make_assignment(status=AssignmentStatus.ASSIGNED)
    assignment_repo.get_by_id.return_value = assignment

    use_case = ArriveAtStopUseCase(assignment_repo, stop_repo, uow)
    command = ArriveAtStopCommand(assignment_id=assignment.id, stop_id=uuid4(), technician_id="tech-123")

    with pytest.raises(InvalidAssignmentStatusTransitionException):
        use_case.execute(command)


def test_arrive_at_stop_stop_not_found():
    assignment_repo = MagicMock(spec=AssignmentRepository)
    stop_repo = MagicMock(spec=AssignmentStopRepository)
    uow = MagicMock(spec=UnitOfWork)
    assignment = make_assignment()
    assignment_repo.get_by_id.return_value = assignment
    stop_repo.get_by_id.return_value = None

    use_case = ArriveAtStopUseCase(assignment_repo, stop_repo, uow)
    command = ArriveAtStopCommand(assignment_id=assignment.id, stop_id=uuid4(), technician_id="tech-123")

    with pytest.raises(StopNotFoundException):
        use_case.execute(command)


def test_arrive_at_stop_not_in_transit():
    assignment_repo = MagicMock(spec=AssignmentRepository)
    stop_repo = MagicMock(spec=AssignmentStopRepository)
    uow = MagicMock(spec=UnitOfWork)
    assignment = make_assignment()
    stop = make_stop(assignment.id, order_index=1, status=StopStatus.PENDING)
    assignment_repo.get_by_id.return_value = assignment
    stop_repo.get_by_id.return_value = stop

    use_case = ArriveAtStopUseCase(assignment_repo, stop_repo, uow)
    command = ArriveAtStopCommand(assignment_id=assignment.id, stop_id=stop.id, technician_id="tech-123")

    with pytest.raises(InvalidStopStatusTransitionException):
        use_case.execute(command)


def test_arrive_at_stop_success():
    assignment_repo = MagicMock(spec=AssignmentRepository)
    stop_repo = MagicMock(spec=AssignmentStopRepository)
    uow = MagicMock(spec=UnitOfWork)
    assignment = make_assignment()
    stop = make_stop(assignment.id, order_index=1, status=StopStatus.IN_TRANSIT)
    assignment_repo.get_by_id.return_value = assignment
    stop_repo.get_by_id.return_value = stop

    use_case = ArriveAtStopUseCase(assignment_repo, stop_repo, uow)
    command = ArriveAtStopCommand(assignment_id=assignment.id, stop_id=stop.id, technician_id="tech-123")

    result = use_case.execute(command)

    assert result.status == StopStatus.ARRIVED
    assert result.arrived_at is not None
    stop_repo.save.assert_called_once_with(stop)
    uow.commit.assert_called_once()
