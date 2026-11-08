from datetime import date, datetime, timezone
from unittest.mock import MagicMock
from uuid import uuid4

import pytest

from app.modules.route_assignments.application.dtos.assignment_detail_dto import (
    AssignmentDetailDTO,
    AssignmentStopDetailItemDTO,
)
from app.modules.route_assignments.application.ports.readers.assignment_detail_reader import (
    AssignmentDetailReader,
)
from app.modules.route_assignments.application.queries.get_assignment_detail import (
    GetAssignmentDetailQuery,
    GetAssignmentDetailQueryHandler,
)
from app.modules.route_assignments.domain.exceptions import AssignmentNotFoundException
from app.modules.route_assignments.domain.value_objects.assignment_status import AssignmentStatus
from app.modules.route_assignments.domain.value_objects.assignment_type import AssignmentType
from app.modules.route_assignments.domain.value_objects.stop_status import StopStatus
from app.modules.route_assignments.infrastructure.persistence.readers.sqlmodel_assignment_detail_reader import (
    SqlModelAssignmentDetailReader,
)


def test_get_assignment_detail_query_handler_success():
    assignment_id = uuid4()
    reader = MagicMock(spec=AssignmentDetailReader)
    expected_dto = AssignmentDetailDTO(
        id=assignment_id,
        technician_name="Juan Pérez",
        technician_image="https://example.com/photo.jpg",
        scheduled_date=date(2026, 11, 10),
        started_at=datetime.now(timezone.utc),
        completed_at=None,
        status=AssignmentStatus.IN_PROGRESS.value,
        assignment_type=AssignmentType.CUT.value,
        total_stops=2,
        total_distance_km=3.5,
        start_latitude=-17.78,
        start_longitude=-63.18,
        completed_stops=1,
        stops=(
            AssignmentStopDetailItemDTO(
                id=uuid4(),
                codigo_fijo_id=uuid4(),
                fixed_code=1001,
                name="Titular 1",
                latitude=-17.79,
                longitude=-63.19,
                order_index=1,
                status=StopStatus.COMPLETED.value,
                in_transit_at=datetime.now(timezone.utc),
                arrived_at=datetime.now(timezone.utc),
                completed_at=datetime.now(timezone.utc),
                route_geometry={"type": "LineString", "coordinates": [[-63.18, -17.78], [-63.19, -17.79]]},
            ),
        ),
    )
    reader.get_by_id.return_value = expected_dto

    handler = GetAssignmentDetailQueryHandler(reader)
    result = handler.execute(GetAssignmentDetailQuery(assignment_id=assignment_id))

    assert result == expected_dto
    reader.get_by_id.assert_called_once_with(assignment_id)


def test_get_assignment_detail_query_handler_not_found():
    assignment_id = uuid4()
    reader = MagicMock(spec=AssignmentDetailReader)
    reader.get_by_id.return_value = None

    handler = GetAssignmentDetailQueryHandler(reader)
    with pytest.raises(AssignmentNotFoundException):
        handler.execute(GetAssignmentDetailQuery(assignment_id=assignment_id))


def test_sqlmodel_assignment_detail_reader_get_by_id():
    mock_session = MagicMock()
    assignment_id = uuid4()

    # 1. Mock de cabecera
    mock_assignment = MagicMock()
    mock_assignment.id = assignment_id
    mock_assignment.scheduled_date = date(2026, 11, 12)
    mock_assignment.started_at = None
    mock_assignment.completed_at = None
    mock_assignment.status = "ASSIGNED"
    mock_assignment.assignment_type = "RECONNECTION"
    mock_assignment.total_stops = 2
    mock_assignment.total_distance_km = 5.2
    mock_assignment.start_latitude = -17.75
    mock_assignment.start_longitude = -63.15

    header_exec = MagicMock()
    header_exec.first.return_value = (mock_assignment, "Pedro Técnico", "https://avatar.png")

    # 2. Mock de paradas
    stop1 = MagicMock()
    stop1.id = uuid4()
    stop1.codigo_fijo_id = uuid4()
    stop1.order_index = 1
    stop1.status = "COMPLETED"
    stop1.in_transit_at = datetime.now(timezone.utc)
    stop1.arrived_at = datetime.now(timezone.utc)
    stop1.completed_at = datetime.now(timezone.utc)
    stop1.route_geometry = {"type": "LineString", "coordinates": []}

    stop2 = MagicMock()
    stop2.id = uuid4()
    stop2.codigo_fijo_id = uuid4()
    stop2.order_index = 2
    stop2.status = "PENDING"
    stop2.in_transit_at = None
    stop2.arrived_at = None
    stop2.completed_at = None
    stop2.route_geometry = {"type": "LineString", "coordinates": []}

    stops_exec = MagicMock()
    stops_exec.all.return_value = [
        (stop1, 2001, "Abonado Uno", -17.76, -63.16),
        (stop2, 2002, "Abonado Dos", -17.77, -63.17),
    ]

    mock_session.exec.side_effect = [header_exec, stops_exec]

    reader = SqlModelAssignmentDetailReader(mock_session)
    detail = reader.get_by_id(assignment_id)

    assert detail is not None
    assert detail.id == assignment_id
    assert detail.technician_name == "Pedro Técnico"
    assert detail.technician_image == "https://avatar.png"
    assert detail.completed_stops == 1
    assert detail.total_stops == 2
    assert len(detail.stops) == 2
    assert detail.stops[0].order_index == 1
    assert detail.stops[0].fixed_code == 2001
    assert detail.stops[0].name == "Abonado Uno"
    assert detail.stops[0].status == "COMPLETED"
    assert detail.stops[1].order_index == 2
    assert detail.stops[1].status == "PENDING"


def test_sqlmodel_assignment_detail_reader_returns_none_when_header_not_found():
    mock_session = MagicMock()
    header_exec = MagicMock()
    header_exec.first.return_value = None
    mock_session.exec.return_value = header_exec

    reader = SqlModelAssignmentDetailReader(mock_session)
    result = reader.get_by_id(uuid4())

    assert result is None
