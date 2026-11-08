from datetime import date, datetime, timezone
from uuid import UUID, uuid4

from app.modules.route_assignments.domain.entities.assignment import Assignment
from app.modules.route_assignments.domain.entities.assignment_stop import AssignmentStop
from app.modules.route_assignments.domain.value_objects.assignment_status import AssignmentStatus
from app.modules.route_assignments.domain.value_objects.assignment_type import AssignmentType
from app.modules.route_assignments.domain.value_objects.stop_status import StopStatus


def test_assignment_create_and_lifecycle():
    now = datetime.now(timezone.utc)
    scheduled = date(2026, 11, 10)

    assignment = Assignment.create(
        technician_id="tech-user-123",
        assignment_type=AssignmentType.CUT,
        scheduled_date=scheduled,
        start_latitude=-17.78,
        start_longitude=-63.18,
        total_stops=5,
        total_distance_km=12.4,
    )

    assert isinstance(assignment.id, UUID)
    assert assignment.technician_id == "tech-user-123"
    assert assignment.status == AssignmentStatus.ASSIGNED
    assert assignment.status.is_assigned() is True
    assert assignment.assignment_type == AssignmentType.CUT
    assert assignment.assignment_type.is_cut() is True
    assert assignment.assignment_type.is_reconnection() is False
    assert assignment.total_stops == 5
    assert assignment.total_distance_km == 12.4
    assert assignment.started_at is None
    assert assignment.completed_at is None
    assert assignment.is_active is True

    # Mutación de inicio de ruta
    assignment.start(now)
    assert assignment.status == AssignmentStatus.IN_PROGRESS
    assert assignment.status.is_in_progress() is True
    assert assignment.started_at == now

    # Mutación de finalización de ruta
    completed_time = datetime.now(timezone.utc)
    assignment.complete(completed_time)
    assert assignment.status == AssignmentStatus.COMPLETED
    assert assignment.status.is_completed() is True
    assert assignment.completed_at == completed_time


def test_assignment_stop_create_and_lifecycle():
    assignment_id = uuid4()
    codigo_fijo_id = uuid4()

    stop = AssignmentStop.create(
        assignment_id=assignment_id,
        codigo_fijo_id=codigo_fijo_id,
        order_index=1,
        current_status=1,
        target_status=3,
        route_geometry={"type": "LineString", "coordinates": [[-63.18, -17.78], [-63.17, -17.79]]},
    )

    assert isinstance(stop.id, UUID)
    assert stop.assignment_id == assignment_id
    assert stop.codigo_fijo_id == codigo_fijo_id
    assert stop.order_index == 1
    assert stop.current_status == 1
    assert stop.target_status == 3
    assert stop.status == StopStatus.PENDING
    assert stop.status.is_pending() is True
    assert stop.is_active is True
    assert stop.in_transit_at is None
    assert stop.arrived_at is None
    assert stop.completed_at is None

    # Iniciar traslado
    transit_time = datetime.now(timezone.utc)
    stop.start_transit(transit_time)
    assert stop.status == StopStatus.IN_TRANSIT
    assert stop.status.is_in_transit() is True
    assert stop.in_transit_at == transit_time

    # Llegar a la parada
    arrived_time = datetime.now(timezone.utc)
    stop.mark_arrived(arrived_time)
    assert stop.status == StopStatus.ARRIVED
    assert stop.status.is_arrived() is True
    assert stop.arrived_at == arrived_time

    # Completar parada con timestamp
    completed_time = datetime.now(timezone.utc)
    stop.mark_completed(completed_time)
    assert stop.status == StopStatus.COMPLETED
    assert stop.status.is_completed() is True
    assert stop.completed_at == completed_time

    # Marcar como fallida
    stop.mark_failed()
    assert stop.status == StopStatus.FAILED
    assert stop.status.is_failed() is True

