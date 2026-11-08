from datetime import datetime, timezone
from uuid import uuid4

import pytest

from app.modules.route_assignments.domain.entities.assignment_stop import AssignmentStop
from app.modules.route_assignments.domain.value_objects.stop_status import StopStatus


def test_assignment_stop_initial_state_pending():
    assignment_id = uuid4()
    codigo_fijo_id = uuid4()
    stop = AssignmentStop.create(
        assignment_id=assignment_id,
        codigo_fijo_id=codigo_fijo_id,
        order_index=1,
        current_status=1,
        target_status=2,
        route_geometry={"type": "LineString", "coordinates": []},
    )

    assert stop.status == StopStatus.PENDING
    assert stop.status.is_pending() is True
    assert stop.in_transit_at is None
    assert stop.arrived_at is None
    assert stop.completed_at is None
    assert stop.is_active is True


def test_assignment_stop_start_transit():
    stop = AssignmentStop.create(
        assignment_id=uuid4(),
        codigo_fijo_id=uuid4(),
        order_index=1,
        current_status=1,
        target_status=2,
        route_geometry={"type": "LineString", "coordinates": []},
    )
    now = datetime(2026, 11, 7, 10, 30, tzinfo=timezone.utc)

    stop.start_transit(now)

    assert stop.status == StopStatus.IN_TRANSIT
    assert stop.status.is_in_transit() is True
    assert stop.in_transit_at == now
    assert stop.arrived_at is None
    assert stop.completed_at is None


def test_assignment_stop_mark_arrived():
    stop = AssignmentStop.create(
        assignment_id=uuid4(),
        codigo_fijo_id=uuid4(),
        order_index=1,
        current_status=1,
        target_status=2,
        route_geometry={"type": "LineString", "coordinates": []},
    )
    transit_time = datetime(2026, 11, 7, 10, 30, tzinfo=timezone.utc)
    arrival_time = datetime(2026, 11, 7, 10, 45, tzinfo=timezone.utc)

    stop.start_transit(transit_time)
    stop.mark_arrived(arrival_time)

    assert stop.status == StopStatus.ARRIVED
    assert stop.status.is_arrived() is True
    assert stop.in_transit_at == transit_time
    assert stop.arrived_at == arrival_time
    assert stop.completed_at is None


def test_assignment_stop_mark_completed_with_timestamp():
    stop = AssignmentStop.create(
        assignment_id=uuid4(),
        codigo_fijo_id=uuid4(),
        order_index=1,
        current_status=1,
        target_status=2,
        route_geometry={"type": "LineString", "coordinates": []},
    )
    completed_time = datetime(2026, 11, 7, 11, 0, tzinfo=timezone.utc)

    stop.mark_completed(completed_time)

    assert stop.status == StopStatus.COMPLETED
    assert stop.status.is_completed() is True
    assert stop.completed_at == completed_time


def test_assignment_stop_mark_completed_without_timestamp():
    stop = AssignmentStop.create(
        assignment_id=uuid4(),
        codigo_fijo_id=uuid4(),
        order_index=1,
        current_status=1,
        target_status=2,
        route_geometry={"type": "LineString", "coordinates": []},
    )

    stop.mark_completed()

    assert stop.status == StopStatus.COMPLETED
    assert stop.status.is_completed() is True
    assert stop.completed_at is None


def test_assignment_stop_mark_failed():
    stop = AssignmentStop.create(
        assignment_id=uuid4(),
        codigo_fijo_id=uuid4(),
        order_index=1,
        current_status=1,
        target_status=2,
        route_geometry={"type": "LineString", "coordinates": []},
    )

    stop.mark_failed()

    assert stop.status == StopStatus.FAILED
    assert stop.status.is_failed() is True
