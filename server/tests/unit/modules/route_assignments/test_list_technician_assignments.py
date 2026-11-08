from datetime import date, datetime, timezone
from unittest.mock import MagicMock
from uuid import uuid4

import pytest

from app.modules.route_assignments.application.dtos.technician_assignment_dto import (
    TechnicianAssignmentDTO,
)
from app.modules.route_assignments.application.ports.readers.technician_assignments_reader import (
    TechnicianAssignmentsReader,
)
from app.modules.route_assignments.application.queries.list_technician_assignments import (
    ListTechnicianAssignmentsQuery,
    ListTechnicianAssignmentsQueryHandler,
)


def test_list_technician_assignments_handler_returns_dtos():
    technician_id = str(uuid4())
    reader = MagicMock(spec=TechnicianAssignmentsReader)

    expected_dtos = [
        TechnicianAssignmentDTO(
            id=uuid4(),
            assignment_type="CUT",
            status="IN_PROGRESS",
            scheduled_date=date(2026, 11, 8),
            total_stops=10,
            total_distance_km=12.5,
            started_at=datetime.now(timezone.utc),
            completed_at=None,
            created_date=datetime.now(timezone.utc),
        ),
        TechnicianAssignmentDTO(
            id=uuid4(),
            assignment_type="RECONNECTION",
            status="ASSIGNED",
            scheduled_date=date(2026, 11, 9),
            total_stops=5,
            total_distance_km=6.0,
            started_at=None,
            completed_at=None,
            created_date=datetime.now(timezone.utc),
        ),
    ]
    reader.list_by_technician.return_value = expected_dtos

    handler = ListTechnicianAssignmentsQueryHandler(reader)
    query = ListTechnicianAssignmentsQuery(technician_id=technician_id)
    result = handler.execute(query)

    assert result == expected_dtos
    reader.list_by_technician.assert_called_once_with(technician_id)


def test_list_technician_assignments_handler_returns_empty_list():
    technician_id = str(uuid4())
    reader = MagicMock(spec=TechnicianAssignmentsReader)
    reader.list_by_technician.return_value = []

    handler = ListTechnicianAssignmentsQueryHandler(reader)
    query = ListTechnicianAssignmentsQuery(technician_id=technician_id)
    result = handler.execute(query)

    assert result == []
    reader.list_by_technician.assert_called_once_with(technician_id)
