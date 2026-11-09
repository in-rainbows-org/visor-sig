from datetime import datetime, timezone
from unittest.mock import MagicMock
from uuid import uuid4

import pytest

from app.modules.layers.domain.entities.codigo_fijo import CodigoFijo
from app.modules.layers.domain.enums import CodigoFijoStatus
from app.modules.layers.domain.repositories.codigo_fijo_repository import (
    CodigoFijoRepository,
)
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
    MissingEvidencePhotoException,
    MissingMeterReadingException,
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
from app.shared.application.ports import ImageStorageService, UnitOfWork


def make_assignment(
    technician_id: str = "tech-123",
    status: AssignmentStatus = AssignmentStatus.IN_PROGRESS,
    assignment_type: AssignmentType = AssignmentType.CUT,
) -> Assignment:
    return Assignment(
        id=uuid4(),
        technician_id=technician_id,
        status=status,
        assignment_type=assignment_type,
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
    codigo_fijo_id=None,
    target_status: int = 3,
) -> AssignmentStop:
    return AssignmentStop(
        id=uuid4(),
        assignment_id=assignment_id,
        codigo_fijo_id=codigo_fijo_id or uuid4(),
        order_index=order_index,
        current_status=1,
        target_status=target_status,
        status=status,
        route_geometry={},
    )


def make_codigo_fijo(
    cf_id,
    status: CodigoFijoStatus = CodigoFijoStatus.NORMAL,
) -> CodigoFijo:
    return CodigoFijo(
        id=cf_id,
        longitude=-63.18,
        latitude=-17.78,
        status=status,
        status_changed_at=datetime.now(timezone.utc),
        geometry_wkt="MULTIPOINT((-63.18 -17.78))",
        fixed_code=102030,
        name="Juan Perez",
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
    assignment = make_assignment(technician_id="other-tech")
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
    stop = make_stop(assignment.id, status=StopStatus.IN_TRANSIT)
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
    stop = make_stop(assignment.id, status=StopStatus.ARRIVED)
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
    codigo_fijo_repo = MagicMock(spec=CodigoFijoRepository)
    uow = MagicMock(spec=UnitOfWork)
    cf = make_codigo_fijo(uuid4(), status=CodigoFijoStatus.NORMAL)
    assignment = make_assignment()
    stop = make_stop(assignment.id, order_index=1, status=StopStatus.ARRIVED, codigo_fijo_id=cf.id)
    other_stop = make_stop(assignment.id, order_index=2, status=StopStatus.PENDING)
    assignment_repo.get_by_id.return_value = assignment
    stop_repo.get_by_id.return_value = stop
    stop_repo.list_by_assignment_id.return_value = [stop, other_stop]
    codigo_fijo_repo.get_by_id.return_value = cf

    use_case = CompleteStopUseCase(
        assignment_repo=assignment_repo,
        stop_repo=stop_repo,
        uow=uow,
        codigo_fijo_repo=codigo_fijo_repo,
    )
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
    assert assignment.status == AssignmentStatus.IN_PROGRESS
    assignment_repo.save.assert_not_called()
    # CodigoFijo status must NOT change on failure
    assert cf.status == CodigoFijoStatus.NORMAL
    codigo_fijo_repo.save.assert_not_called()
    uow.commit.assert_called_once()


def test_complete_stop_success_without_meter_reading_raises():
    assignment_repo = MagicMock(spec=AssignmentRepository)
    stop_repo = MagicMock(spec=AssignmentStopRepository)
    uow = MagicMock(spec=UnitOfWork)
    assignment = make_assignment()
    stop = make_stop(assignment.id, status=StopStatus.ARRIVED)
    assignment_repo.get_by_id.return_value = assignment
    stop_repo.get_by_id.return_value = stop

    use_case = CompleteStopUseCase(assignment_repo, stop_repo, uow)
    command = CompleteStopCommand(
        assignment_id=assignment.id,
        stop_id=stop.id,
        technician_id="tech-123",
        status="SUCCESS",
        evidence_photo_url="https://res.cloudinary.com/test/sig/photo.jpg",
        meter_reading="",
    )

    with pytest.raises(MissingMeterReadingException):
        use_case.execute(command)


def test_complete_stop_success_without_evidence_photo_raises():
    assignment_repo = MagicMock(spec=AssignmentRepository)
    stop_repo = MagicMock(spec=AssignmentStopRepository)
    uow = MagicMock(spec=UnitOfWork)
    assignment = make_assignment()
    stop = make_stop(assignment.id, status=StopStatus.ARRIVED)
    assignment_repo.get_by_id.return_value = assignment
    stop_repo.get_by_id.return_value = stop

    use_case = CompleteStopUseCase(assignment_repo, stop_repo, uow)
    command = CompleteStopCommand(
        assignment_id=assignment.id,
        stop_id=stop.id,
        technician_id="tech-123",
        status="SUCCESS",
        meter_reading="12345",
        evidence_photo_url=None,
        image_bytes=None,
    )

    with pytest.raises(MissingEvidencePhotoException):
        use_case.execute(command)


def test_complete_stop_success_with_image_bytes_uploads_to_cloudinary():
    assignment_repo = MagicMock(spec=AssignmentRepository)
    stop_repo = MagicMock(spec=AssignmentStopRepository)
    codigo_fijo_repo = MagicMock(spec=CodigoFijoRepository)
    image_storage = MagicMock(spec=ImageStorageService)
    uow = MagicMock(spec=UnitOfWork)

    cf = make_codigo_fijo(uuid4(), status=CodigoFijoStatus.NORMAL)
    assignment = make_assignment(assignment_type=AssignmentType.CUT)
    stop = make_stop(assignment.id, status=StopStatus.ARRIVED, codigo_fijo_id=cf.id)
    assignment_repo.get_by_id.return_value = assignment
    stop_repo.get_by_id.return_value = stop
    stop_repo.list_by_assignment_id.return_value = [stop]
    codigo_fijo_repo.get_by_id.return_value = cf
    image_storage.upload_image.return_value = "https://res.cloudinary.com/test/sig/uploaded.jpg"

    use_case = CompleteStopUseCase(
        assignment_repo=assignment_repo,
        stop_repo=stop_repo,
        uow=uow,
        codigo_fijo_repo=codigo_fijo_repo,
        image_storage=image_storage,
    )
    command = CompleteStopCommand(
        assignment_id=assignment.id,
        stop_id=stop.id,
        technician_id="tech-123",
        status="SUCCESS",
        meter_reading="04581",
        image_bytes=b"fake-image-bytes",
        image_filename="medidor.jpg",
    )

    result = use_case.execute(command)

    image_storage.upload_image.assert_called_once_with(
        file_bytes=b"fake-image-bytes",
        filename="medidor.jpg",
        folder="sig",
    )
    assert result.status == StopStatus.COMPLETED
    assert result.evidence_photo_url == "https://res.cloudinary.com/test/sig/uploaded.jpg"
    assert result.meter_reading == "04581"
    # CUT assignment transitions CodigoFijo to CORTADO (3)
    assert cf.status == CodigoFijoStatus.CORTADO
    codigo_fijo_repo.save.assert_called_once_with(cf)


def test_complete_stop_intermediate_stop_success():
    assignment_repo = MagicMock(spec=AssignmentRepository)
    stop_repo = MagicMock(spec=AssignmentStopRepository)
    codigo_fijo_repo = MagicMock(spec=CodigoFijoRepository)
    uow = MagicMock(spec=UnitOfWork)
    cf = make_codigo_fijo(uuid4(), status=CodigoFijoStatus.NORMAL)
    assignment = make_assignment(assignment_type=AssignmentType.CUT)
    stop1 = make_stop(assignment.id, order_index=1, status=StopStatus.ARRIVED, codigo_fijo_id=cf.id)
    stop2 = make_stop(assignment.id, order_index=2, status=StopStatus.PENDING)
    assignment_repo.get_by_id.return_value = assignment
    stop_repo.get_by_id.return_value = stop1
    stop_repo.list_by_assignment_id.return_value = [stop1, stop2]
    codigo_fijo_repo.get_by_id.return_value = cf

    use_case = CompleteStopUseCase(
        assignment_repo=assignment_repo,
        stop_repo=stop_repo,
        uow=uow,
        codigo_fijo_repo=codigo_fijo_repo,
    )
    command = CompleteStopCommand(
        assignment_id=assignment.id,
        stop_id=stop1.id,
        technician_id="tech-123",
        status="SUCCESS",
        meter_reading="12345",
        evidence_photo_url="https://res.cloudinary.com/test/sig/medidor.jpg",
        observation="Corte realizado",
    )

    result = use_case.execute(command)

    assert result.status == StopStatus.COMPLETED
    assert result.completed_at is not None
    assert result.meter_reading == "12345"
    assert result.evidence_photo_url == "https://res.cloudinary.com/test/sig/medidor.jpg"
    assert result.observation == "Corte realizado"
    stop_repo.save.assert_called_once_with(stop1)
    assert cf.status == CodigoFijoStatus.CORTADO
    codigo_fijo_repo.save.assert_called_once_with(cf)
    assert assignment.status == AssignmentStatus.IN_PROGRESS
    assignment_repo.save.assert_not_called()
    uow.commit.assert_called_once()


def test_complete_stop_last_stop_triggers_assignment_completion():
    assignment_repo = MagicMock(spec=AssignmentRepository)
    stop_repo = MagicMock(spec=AssignmentStopRepository)
    codigo_fijo_repo = MagicMock(spec=CodigoFijoRepository)
    uow = MagicMock(spec=UnitOfWork)
    cf = make_codigo_fijo(uuid4(), status=CodigoFijoStatus.CORTADO)
    assignment = make_assignment(assignment_type=AssignmentType.RECONNECTION)
    stop1 = make_stop(assignment.id, order_index=1, status=StopStatus.COMPLETED)
    stop2 = make_stop(assignment.id, order_index=2, status=StopStatus.ARRIVED, codigo_fijo_id=cf.id)
    assignment_repo.get_by_id.return_value = assignment
    stop_repo.get_by_id.return_value = stop2
    stop_repo.list_by_assignment_id.return_value = [stop1, stop2]
    codigo_fijo_repo.get_by_id.return_value = cf

    use_case = CompleteStopUseCase(
        assignment_repo=assignment_repo,
        stop_repo=stop_repo,
        uow=uow,
        codigo_fijo_repo=codigo_fijo_repo,
    )
    command = CompleteStopCommand(
        assignment_id=assignment.id,
        stop_id=stop2.id,
        technician_id="tech-123",
        status="COMPLETED",
        meter_reading="9999",
        evidence_photo_url="https://res.cloudinary.com/test/sig/recone.jpg",
    )

    result = use_case.execute(command)

    assert result.status == StopStatus.COMPLETED
    assert result.completed_at is not None
    stop_repo.save.assert_called_once_with(stop2)
    # RECONNECTION assignment transitions CodigoFijo to NORMAL (1)
    assert cf.status == CodigoFijoStatus.NORMAL
    codigo_fijo_repo.save.assert_called_once_with(cf)

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
