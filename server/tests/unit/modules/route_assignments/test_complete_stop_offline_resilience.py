from datetime import datetime, timezone
from unittest.mock import MagicMock
from uuid import uuid4

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


def _make_assignment(
    status: AssignmentStatus = AssignmentStatus.ASSIGNED,
    assignment_type: AssignmentType = AssignmentType.CUT,
) -> Assignment:
    return Assignment(
        id=uuid4(),
        technician_id="tech-offline-1",
        status=status,
        assignment_type=assignment_type,
        scheduled_date=datetime.now(timezone.utc).date(),
        start_latitude=-17.78,
        start_longitude=-63.18,
        total_stops=2,
        total_distance_km=4.2,
    )


def _make_stop(
    assignment_id,
    order_index: int = 1,
    status: StopStatus = StopStatus.PENDING,
    codigo_fijo_id=None,
) -> AssignmentStop:
    return AssignmentStop(
        id=uuid4(),
        assignment_id=assignment_id,
        codigo_fijo_id=codigo_fijo_id or uuid4(),
        order_index=order_index,
        current_status=1,
        target_status=3,
        status=status,
        route_geometry={},
    )


def _make_codigo_fijo(cf_id) -> CodigoFijo:
    return CodigoFijo(
        id=cf_id,
        longitude=-63.18,
        latitude=-17.78,
        status=CodigoFijoStatus.NORMAL,
        status_changed_at=datetime.now(timezone.utc),
        geometry_wkt="MULTIPOINT((-63.18 -17.78))",
        fixed_code=504010,
        name="Vivienda Offline",
    )


def test_complete_stop_directly_from_pending_and_assigned_assignment_with_client_timestamps():
    """Al sincronizar offline desde PENDING con asignación ASSIGNED, auto-inicia la ruta y respeta timestamps de campo."""
    assignment_repo = MagicMock(spec=AssignmentRepository)
    stop_repo = MagicMock(spec=AssignmentStopRepository)
    codigo_fijo_repo = MagicMock(spec=CodigoFijoRepository)
    image_storage = MagicMock(spec=ImageStorageService)
    uow = MagicMock(spec=UnitOfWork)

    cf = _make_codigo_fijo(uuid4())
    assignment = _make_assignment(status=AssignmentStatus.ASSIGNED, assignment_type=AssignmentType.CUT)
    stop1 = _make_stop(assignment.id, order_index=1, status=StopStatus.PENDING, codigo_fijo_id=cf.id)
    stop2 = _make_stop(assignment.id, order_index=2, status=StopStatus.PENDING)

    assignment_repo.get_by_id.return_value = assignment
    stop_repo.get_by_id.return_value = stop1
    stop_repo.list_by_assignment_id.return_value = [stop1, stop2]
    codigo_fijo_repo.get_by_id.return_value = cf
    image_storage.upload_image.return_value = "https://res.cloudinary.com/sig/offline.jpg"

    transit_ts = datetime(2026, 11, 17, 13, 0, 0, tzinfo=timezone.utc)
    arrived_ts = datetime(2026, 11, 17, 13, 10, 0, tzinfo=timezone.utc)
    completed_ts = datetime(2026, 11, 17, 13, 14, 0, tzinfo=timezone.utc)

    use_case = CompleteStopUseCase(
        assignment_repo=assignment_repo,
        stop_repo=stop_repo,
        uow=uow,
        codigo_fijo_repo=codigo_fijo_repo,
        image_storage=image_storage,
    )
    command = CompleteStopCommand(
        assignment_id=assignment.id,
        stop_id=stop1.id,
        technician_id="tech-offline-1",
        status="SUCCESS",
        meter_reading="045812",
        observation="Corte offline completado",
        image_bytes=b"offline-jpg-bytes",
        image_filename="offline.jpg",
        in_transit_at=transit_ts,
        arrived_at=arrived_ts,
        completed_at=completed_ts,
    )

    result = use_case.execute(command)

    assert assignment.status == AssignmentStatus.IN_PROGRESS
    assert assignment.started_at == transit_ts
    assert result.status == StopStatus.COMPLETED
    assert result.in_transit_at == transit_ts
    assert result.arrived_at == arrived_ts
    assert result.completed_at == completed_ts
    assert cf.status == CodigoFijoStatus.CORTADO
    assignment_repo.save.assert_called_once_with(assignment)
    stop_repo.save.assert_called_once_with(stop1)
    uow.commit.assert_called_once()


def test_complete_stop_is_idempotent_when_already_completed():
    """Si una petición en cola ya fue persistida en el servidor, reintentarla devuelve la parada sin error ni re-subida."""
    assignment_repo = MagicMock(spec=AssignmentRepository)
    stop_repo = MagicMock(spec=AssignmentStopRepository)
    image_storage = MagicMock(spec=ImageStorageService)
    uow = MagicMock(spec=UnitOfWork)

    assignment = _make_assignment(status=AssignmentStatus.COMPLETED)
    stop = _make_stop(assignment.id, order_index=1, status=StopStatus.COMPLETED)

    assignment_repo.get_by_id.return_value = assignment
    stop_repo.get_by_id.return_value = stop

    use_case = CompleteStopUseCase(
        assignment_repo=assignment_repo,
        stop_repo=stop_repo,
        uow=uow,
        image_storage=image_storage,
    )
    command = CompleteStopCommand(
        assignment_id=assignment.id,
        stop_id=stop.id,
        technician_id="tech-offline-1",
        status="SUCCESS",
        meter_reading="045812",
        image_bytes=b"duplicate-retry",
    )

    result = use_case.execute(command)

    assert result.status == StopStatus.COMPLETED
    image_storage.upload_image.assert_not_called()
    stop_repo.save.assert_not_called()
    uow.commit.assert_not_called()
