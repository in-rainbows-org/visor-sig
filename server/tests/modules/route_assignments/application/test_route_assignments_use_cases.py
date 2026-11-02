from datetime import date
from unittest.mock import MagicMock
from uuid import uuid4

import pytest

from app.core.security.auth import Role
from app.modules.layers.domain.enums import CodigoFijoStatus
from app.modules.layers.infrastructure.persistence.models.codigo_fijo_model import CodigoFijoModel
from app.modules.route_assignments.application.dtos.assignment_summary_dto import (
    AssignmentSummaryDTO,
    PaginatedAssignmentsDTO,
)
from app.modules.route_assignments.application.dtos.route_dtos import (
    OptimizedStopDTO,
    RouteCalculationRequestDTO,
    RouteCalculationResultDTO,
    WaypointInputDTO,
)
from app.modules.route_assignments.application.ports.providers.route_calculator_provider import (
    RouteCalculatorProvider,
)
from app.modules.route_assignments.application.ports.readers.assignment_summary_reader import (
    AssignmentSummaryReader,
)
from app.modules.route_assignments.application.queries.list_assignments import (
    ListAssignmentsQuery,
    ListAssignmentsQueryHandler,
)
from app.modules.route_assignments.application.use_cases.calculate_route import (
    CalculateRouteUseCase,
)
from app.modules.route_assignments.application.use_cases.create_assignment import (
    CreateAssignmentCommand,
    CreateAssignmentStopCommand,
    CreateAssignmentUseCase,
)
from app.modules.route_assignments.domain.entities.assignment import Assignment
from app.modules.route_assignments.domain.exceptions import (
    DuplicateStopException,
    InvalidDateRangeException,
    InvalidStopSequenceException,
    InvalidStopsCountException,
    InvalidTechnicianException,
    InvalidWaterStatusException,
)
from app.modules.route_assignments.domain.repositories.assignment_repository import (
    AssignmentRepository,
)
from app.modules.route_assignments.domain.repositories.assignment_stop_repository import (
    AssignmentStopRepository,
)
from app.modules.route_assignments.domain.value_objects.assignment_status import AssignmentStatus
from app.modules.route_assignments.domain.value_objects.assignment_type import AssignmentType
from app.shared.application.ports import UnitOfWork
from app.shared.infrastructure.db.better_auth import BetterAuthUser


# ──────────────────────────────────────────────────────────────────────────────
# Tests: CalculateRouteUseCase
# ──────────────────────────────────────────────────────────────────────────────

class MockRouteProvider(RouteCalculatorProvider):
    def calculate_route(self, request: RouteCalculationRequestDTO) -> RouteCalculationResultDTO:
        stops = [
            OptimizedStopDTO(
                codigo_fijo_id=wp.codigo_fijo_id,
                order_index=i + 1,
                latitude=wp.latitude,
                longitude=wp.longitude,
                leg_distance_km=1.2,
                leg_duration_seconds=180,
                leg_geometry={"type": "LineString"},
            )
            for i, wp in enumerate(request.waypoints)
        ]
        return RouteCalculationResultDTO(
            total_distance_km=len(stops) * 1.2,
            total_duration_seconds=len(stops) * 180,
            encoded_polyline="mock_polyline",
            ordered_stops=tuple(stops),
        )


def test_calculate_route_success():
    provider = MockRouteProvider()
    use_case = CalculateRouteUseCase(provider)

    req = RouteCalculationRequestDTO(
        start_latitude=-17.78,
        start_longitude=-63.18,
        waypoints=(
            WaypointInputDTO(codigo_fijo_id=uuid4(), latitude=-17.79, longitude=-63.19),
            WaypointInputDTO(codigo_fijo_id=uuid4(), latitude=-17.80, longitude=-63.20),
        ),
    )

    result = use_case.execute(req)
    assert result.total_distance_km == 2.4
    assert len(result.ordered_stops) == 2
    assert result.ordered_stops[0].order_index == 1
    assert result.ordered_stops[1].order_index == 2


def test_calculate_route_rejects_empty_or_excessive_stops():
    use_case = CalculateRouteUseCase(MockRouteProvider())

    # 0 paradas
    with pytest.raises(InvalidStopsCountException):
        use_case.execute(
            RouteCalculationRequestDTO(
                start_latitude=-17.78,
                start_longitude=-63.18,
                waypoints=(),
            )
        )

    # 11 paradas
    waypoints_11 = tuple(
        WaypointInputDTO(codigo_fijo_id=uuid4(), latitude=-17.79 + i * 0.01, longitude=-63.19)
        for i in range(11)
    )
    with pytest.raises(InvalidStopsCountException):
        use_case.execute(
            RouteCalculationRequestDTO(
                start_latitude=-17.78,
                start_longitude=-63.18,
                waypoints=waypoints_11,
            )
        )


def test_calculate_route_rejects_duplicates():
    use_case = CalculateRouteUseCase(MockRouteProvider())
    duplicate_id = uuid4()
    req = RouteCalculationRequestDTO(
        start_latitude=-17.78,
        start_longitude=-63.18,
        waypoints=(
            WaypointInputDTO(codigo_fijo_id=duplicate_id, latitude=-17.79, longitude=-63.19),
            WaypointInputDTO(codigo_fijo_id=duplicate_id, latitude=-17.80, longitude=-63.20),
        ),
    )
    with pytest.raises(DuplicateStopException):
        use_case.execute(req)


# ──────────────────────────────────────────────────────────────────────────────
# Tests: CreateAssignmentUseCase
# ──────────────────────────────────────────────────────────────────────────────

def test_create_assignment_rejects_non_technician_role():
    assignment_repo = MagicMock(spec=AssignmentRepository)
    stop_repo = MagicMock(spec=AssignmentStopRepository)
    uow = MagicMock()

    # Simular usuario con rol ADMIN (no TECHNICIAN)
    user_admin = BetterAuthUser(
        id="user-admin-1",
        name="Admin User",
        email="admin@example.com",
        role=Role.ADMIN.value,
    )
    uow.session.get.return_value = user_admin

    use_case = CreateAssignmentUseCase(assignment_repo, stop_repo, uow)

    cmd = CreateAssignmentCommand(
        technician_id="user-admin-1",
        assignment_type=AssignmentType.CUT,
        scheduled_date=date(2026, 11, 10),
        start_latitude=-17.78,
        start_longitude=-63.18,
        total_distance_km=5.0,
        stops=[
            CreateAssignmentStopCommand(
                codigo_fijo_id=uuid4(),
                order_index=1,
                target_status=3,
                route_geometry={},
            )
        ],
    )

    with pytest.raises(InvalidTechnicianException) as exc_info:
        use_case.execute(cmd)
    assert "no tiene el rol de técnico" in str(exc_info.value)


def test_create_assignment_rejects_invalid_order_sequence():
    assignment_repo = MagicMock(spec=AssignmentRepository)
    stop_repo = MagicMock(spec=AssignmentStopRepository)
    uow = MagicMock()

    user_tech = BetterAuthUser(
        id="user-tech-1",
        name="Tech",
        email="tech@example.com",
        role=Role.TECHNICIAN.value,
    )
    uow.session.get.return_value = user_tech

    use_case = CreateAssignmentUseCase(assignment_repo, stop_repo, uow)

    # Secuencia con salto: 1, 3 en lugar de 1, 2
    cmd = CreateAssignmentCommand(
        technician_id="user-tech-1",
        assignment_type=AssignmentType.CUT,
        scheduled_date=date(2026, 11, 10),
        start_latitude=-17.78,
        start_longitude=-63.18,
        total_distance_km=5.0,
        stops=[
            CreateAssignmentStopCommand(
                codigo_fijo_id=uuid4(),
                order_index=1,
                target_status=3,
                route_geometry={},
            ),
            CreateAssignmentStopCommand(
                codigo_fijo_id=uuid4(),
                order_index=3,
                target_status=3,
                route_geometry={},
            ),
        ],
    )

    with pytest.raises(InvalidStopSequenceException):
        use_case.execute(cmd)


def test_create_assignment_rejects_cut_on_already_cut_water():
    assignment_repo = MagicMock(spec=AssignmentRepository)
    stop_repo = MagicMock(spec=AssignmentStopRepository)
    uow = MagicMock()

    user_tech = BetterAuthUser(
        id="user-tech-1",
        name="Tech",
        email="tech@example.com",
        role=Role.TECHNICIAN.value,
    )
    uow.session.get.return_value = user_tech

    # Código fijo ya cortado (status = 3)
    code_id = uuid4()
    cf_model = MagicMock(spec=CodigoFijoModel)
    cf_model.id = code_id
    cf_model.status = CodigoFijoStatus.CORTADO.value
    uow.session.exec.return_value.all.return_value = [cf_model]

    use_case = CreateAssignmentUseCase(assignment_repo, stop_repo, uow)

    cmd = CreateAssignmentCommand(
        technician_id="user-tech-1",
        assignment_type=AssignmentType.CUT,
        scheduled_date=date(2026, 11, 10),
        start_latitude=-17.78,
        start_longitude=-63.18,
        total_distance_km=3.0,
        stops=[
            CreateAssignmentStopCommand(
                codigo_fijo_id=code_id,
                order_index=1,
                target_status=CodigoFijoStatus.CORTADO.value,
                route_geometry={},
            )
        ],
    )

    with pytest.raises(InvalidWaterStatusException) as exc_info:
        use_case.execute(cmd)
    assert "ya se encuentra cortado" in str(exc_info.value)


def test_create_assignment_success():
    assignment_repo = MagicMock(spec=AssignmentRepository)
    stop_repo = MagicMock(spec=AssignmentStopRepository)
    uow = MagicMock()

    user_tech = BetterAuthUser(
        id="user-tech-1",
        name="Tech",
        email="tech@example.com",
        role=Role.TECHNICIAN.value,
    )
    uow.session.get.return_value = user_tech

    # Código fijo normal (status = 1) a cortar (target = 3)
    code_id = uuid4()
    cf_model = MagicMock(spec=CodigoFijoModel)
    cf_model.id = code_id
    cf_model.status = CodigoFijoStatus.NORMAL.value
    uow.session.exec.return_value.all.return_value = [cf_model]

    use_case = CreateAssignmentUseCase(assignment_repo, stop_repo, uow)

    cmd = CreateAssignmentCommand(
        technician_id="user-tech-1",
        assignment_type=AssignmentType.CUT,
        scheduled_date=date(2026, 11, 10),
        start_latitude=-17.78,
        start_longitude=-63.18,
        total_distance_km=3.0,
        stops=[
            CreateAssignmentStopCommand(
                codigo_fijo_id=code_id,
                order_index=1,
                target_status=CodigoFijoStatus.CORTADO.value,
                route_geometry={"type": "LineString"},
            )
        ],
    )

    created = use_case.execute(cmd)
    assert created.status == AssignmentStatus.ASSIGNED
    assert created.total_stops == 1
    assert assignment_repo.save.called is True
    assert stop_repo.save_all.called is True
    assert uow.commit.called is True


# ──────────────────────────────────────────────────────────────────────────────
# Tests: ListAssignmentsQueryHandler
# ──────────────────────────────────────────────────────────────────────────────

def test_list_assignments_rejects_asymmetric_date_range():
    reader = MagicMock(spec=AssignmentSummaryReader)
    handler = ListAssignmentsQueryHandler(reader)

    # Solo scheduled_date_from
    with pytest.raises(InvalidDateRangeException):
        handler.execute(
            ListAssignmentsQuery(
                scheduled_date_from=date(2026, 11, 1),
                scheduled_date_to=None,
            )
        )

    # Solo scheduled_date_to
    with pytest.raises(InvalidDateRangeException):
        handler.execute(
            ListAssignmentsQuery(
                scheduled_date_from=None,
                scheduled_date_to=date(2026, 11, 10),
            )
        )

    # from posterior a to
    with pytest.raises(InvalidDateRangeException):
        handler.execute(
            ListAssignmentsQuery(
                scheduled_date_from=date(2026, 11, 15),
                scheduled_date_to=date(2026, 11, 10),
            )
        )


def test_list_assignments_success():
    reader = MagicMock(spec=AssignmentSummaryReader)
    expected_dto = PaginatedAssignmentsDTO(
        items=[],
        total=0,
        page=1,
        page_size=10,
        total_pages=0,
    )
    reader.get_paginated.return_value = expected_dto

    handler = ListAssignmentsQueryHandler(reader)
    result = handler.execute(
        ListAssignmentsQuery(
            page=1,
            page_size=10,
            technician_id="tech-123",
            scheduled_date_from=date(2026, 11, 1),
            scheduled_date_to=date(2026, 11, 10),
        )
    )

    assert result == expected_dto
    reader.get_paginated.assert_called_once_with(
        page=1,
        page_size=10,
        technician_id="tech-123",
        scheduled_date_from=date(2026, 11, 1),
        scheduled_date_to=date(2026, 11, 10),
    )


# ──────────────────────────────────────────────────────────────────────────────
# Tests: OSRMRouteProvider
# ──────────────────────────────────────────────────────────────────────────────

def test_osrm_provider_fallback_route_calculation():
    from app.modules.route_assignments.infrastructure.external.osrm_route_provider import (
        OSRMRouteProvider,
        encode_polyline,
    )

    # Coordenadas de prueba en Santa Cruz
    coords = [[-63.181592, -17.783266], [-63.181626, -17.782794]]
    poly = encode_polyline(coords)
    assert isinstance(poly, str)
    assert len(poly) > 0

    provider = OSRMRouteProvider(base_url="http://invalid-host-for-fallback:9999", timeout_seconds=0.1)
    req = RouteCalculationRequestDTO(
        start_latitude=-17.78,
        start_longitude=-63.18,
        waypoints=(
            WaypointInputDTO(codigo_fijo_id=uuid4(), latitude=-17.79, longitude=-63.19),
            WaypointInputDTO(codigo_fijo_id=uuid4(), latitude=-17.80, longitude=-63.20),
        ),
    )

    result = provider.calculate_route(req)
    assert result.total_distance_km > 0
    assert result.total_duration_seconds > 0
    assert len(result.ordered_stops) == 2
    assert result.ordered_stops[0].order_index == 1
    assert result.ordered_stops[1].order_index == 2
    assert result.ordered_stops[0].leg_geometry["type"] == "LineString"


def test_list_technicians_reader():
    from app.modules.route_assignments.application.dtos.assignment_summary_dto import TechnicianOptionDTO
    from app.modules.route_assignments.infrastructure.persistence.readers.sqlmodel_assignment_summary_reader import (
        SqlModelAssignmentSummaryReader,
    )

    mock_session = MagicMock()
    mock_exec = MagicMock()
    mock_user = MagicMock()
    mock_user.id = "tech-1"
    mock_user.name = "Carlos Mendoza"
    mock_user.email = "carlos@test.com"
    mock_user.image = None
    mock_exec.all.return_value = [mock_user]
    mock_session.exec.return_value = mock_exec

    reader = SqlModelAssignmentSummaryReader(mock_session)
    technicians = reader.list_technicians()

    assert len(technicians) == 1
    assert technicians[0].id == "tech-1"
    assert technicians[0].name == "Carlos Mendoza"
    assert technicians[0].email == "carlos@test.com"


def test_osrm_provider_reorders_waypoints_optimally():
    """Verifica que el proveedor de rutas reordene paradas no óptimas hacia la secuencia más cercana."""
    from app.modules.route_assignments.infrastructure.external.osrm_route_provider import (
        OSRMRouteProvider,
    )

    provider = OSRMRouteProvider()

    far_id = uuid4()
    near_id = uuid4()
    req = RouteCalculationRequestDTO(
        start_latitude=-17.7833,
        start_longitude=-63.1821,
        optimize_waypoint_order=True,
        waypoints=(
            WaypointInputDTO(codigo_fijo_id=far_id, latitude=-17.8500, longitude=-63.2500),
            WaypointInputDTO(codigo_fijo_id=near_id, latitude=-17.7835, longitude=-63.1823),
        ),
    )

    result = provider.calculate_route(req)
    assert len(result.ordered_stops) == 2
    # La primera parada optimizada debe ser la más cercana al punto de partida
    assert result.ordered_stops[0].codigo_fijo_id == near_id
    assert result.ordered_stops[0].order_index == 1
    assert result.ordered_stops[1].codigo_fijo_id == far_id
    assert result.ordered_stops[1].order_index == 2



