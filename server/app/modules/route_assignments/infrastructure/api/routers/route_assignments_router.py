from datetime import date, datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Query, status

from app.core.config import settings
from app.core.dependencies import Admin, CurrentUser, DBSession, Role, TechnicianUser, UoWDep
from app.core.errors.exceptions import APIHTTPException
from app.modules.route_assignments.application.dtos.route_dtos import (
    RouteCalculationRequestDTO,
    WaypointInputDTO,
)
from app.modules.route_assignments.application.queries.get_assignment_detail import (
    GetAssignmentDetailQuery,
    GetAssignmentDetailQueryHandler,
)
from app.modules.route_assignments.application.queries.list_assignments import (
    ListAssignmentsQuery,
    ListAssignmentsQueryHandler,
)
from app.modules.route_assignments.application.queries.list_technician_assignments import (
    ListTechnicianAssignmentsQuery,
    ListTechnicianAssignmentsQueryHandler,
)
from app.modules.route_assignments.application.use_cases.calculate_route import (
    CalculateRouteUseCase,
)
from app.modules.route_assignments.application.use_cases.create_assignment import (
    CreateAssignmentCommand,
    CreateAssignmentStopCommand,
    CreateAssignmentUseCase,
)
from app.modules.route_assignments.infrastructure.api.schemas.assignment_schemas import (
    AssignmentDetailRead,
    AssignmentRead,
    AssignmentStopDetailRead,
    AssignmentSummaryRead,
    CreateAssignmentRequest,
    PaginatedAssignmentsRead,
    TechnicianOptionRead,
)

from app.modules.route_assignments.infrastructure.api.schemas.route_schemas import (
    CalculateRouteRead,
    CalculateRouteRequest,
    OptimizedStopRead,
)
from app.modules.route_assignments.infrastructure.external.osrm_route_provider import (
    OSRMRouteProvider,
)
from app.modules.route_assignments.infrastructure.persistence.models.assignment_model import (
    AssignmentModel,
)
from app.modules.route_assignments.infrastructure.api.schemas.technician_assignment_schemas import (
    TechnicianAssignmentRead,
)
from app.modules.route_assignments.infrastructure.persistence.readers.sqlmodel_assignment_detail_reader import (
    SqlModelAssignmentDetailReader,
)
from app.modules.route_assignments.infrastructure.persistence.readers.sqlmodel_assignment_summary_reader import (
    SqlModelAssignmentSummaryReader,
)
from app.modules.route_assignments.infrastructure.persistence.readers.sqlmodel_technician_assignments_reader import (
    SqlModelTechnicianAssignmentsReader,
)

from app.modules.route_assignments.infrastructure.persistence.repositories.sqlmodel_assignment_repository import (
    SQLModelAssignmentRepository,
)
from app.modules.route_assignments.infrastructure.persistence.repositories.sqlmodel_assignment_stop_repository import (
    SQLModelAssignmentStopRepository,
)

router = APIRouter(prefix="/route-assignments", tags=["Asignaciones y Rutas"])


@router.post(
    "/routes/calculate",
    response_model=CalculateRouteRead,
    summary="Calcular y optimizar ruta de paradas con OSRM",
)
def calculate_route(
    request: CalculateRouteRequest,
    _: CurrentUser,
) -> CalculateRouteRead:
    """Calcula la mejor ruta y desglosa tramos viales para una lista de hasta 10 paradas."""
    provider = OSRMRouteProvider(
        base_url=settings.OSRM_BASE_URL,
        timeout_seconds=settings.OSRM_TIMEOUT_SECONDS,
    )
    use_case = CalculateRouteUseCase(provider)

    dto_request = RouteCalculationRequestDTO(
        start_latitude=request.start_latitude,
        start_longitude=request.start_longitude,
        optimize_waypoint_order=request.optimize_waypoint_order,
        waypoints=tuple(
            WaypointInputDTO(
                codigo_fijo_id=wp.codigo_fijo_id,
                latitude=wp.latitude,
                longitude=wp.longitude,
            )
            for wp in request.waypoints
        ),
    )

    result = use_case.execute(dto_request)

    return CalculateRouteRead(
        total_distance_km=result.total_distance_km,
        total_duration_seconds=result.total_duration_seconds,
        encoded_polyline=result.encoded_polyline,
        ordered_stops=[
            OptimizedStopRead(
                codigo_fijo_id=s.codigo_fijo_id,
                order_index=s.order_index,
                latitude=s.latitude,
                longitude=s.longitude,
                leg_distance_km=s.leg_distance_km,
                leg_duration_seconds=s.leg_duration_seconds,
                leg_geometry=s.leg_geometry,
            )
            for s in result.ordered_stops
        ],
    )


@router.post(
    "/assignments",
    response_model=AssignmentRead,
    status_code=status.HTTP_201_CREATED,
    summary="Crear asignación de ruta con paradas",
)
def create_assignment(
    request: CreateAssignmentRequest,
    _: CurrentUser,
    uow: UoWDep,
) -> AssignmentRead:
    """Registra en una sola transacción atómica la cabecera y todas las paradas ordenadas."""
    assignment_repo = SQLModelAssignmentRepository(uow.session)
    stop_repo = SQLModelAssignmentStopRepository(uow.session)
    use_case = CreateAssignmentUseCase(assignment_repo, stop_repo, uow)

    command = CreateAssignmentCommand(
        technician_id=request.technician_id,
        assignment_type=request.assignment_type,
        scheduled_date=request.scheduled_date,
        start_latitude=request.start_latitude,
        start_longitude=request.start_longitude,
        total_distance_km=request.total_distance_km,
        stops=[
            CreateAssignmentStopCommand(
                codigo_fijo_id=s.codigo_fijo_id,
                order_index=s.order_index,
                target_status=s.target_status,
                route_geometry=s.route_geometry,
                current_status=s.current_status,
            )
            for s in request.stops
        ],
    )

    created_assignment = use_case.execute(command)

    record = uow.session.get(AssignmentModel, created_assignment.id)
    created_date = record.created_date if record else datetime.now(timezone.utc)

    return AssignmentRead(
        id=created_assignment.id,
        technician_id=created_assignment.technician_id,
        status=created_assignment.status.value,
        assignment_type=created_assignment.assignment_type.value,
        scheduled_date=created_assignment.scheduled_date,
        start_latitude=created_assignment.start_latitude,
        start_longitude=created_assignment.start_longitude,
        total_stops=created_assignment.total_stops,
        total_distance_km=created_assignment.total_distance_km,
        started_at=created_assignment.started_at,
        completed_at=created_assignment.completed_at,
        created_date=created_date,
    )


@router.get(
    "/assignments",
    response_model=PaginatedAssignmentsRead,
    summary="Listar asignaciones paginadas con perfil de técnico",
)
def list_assignments(
    db: DBSession,
    _: CurrentUser,
    page: int = Query(default=1, ge=1, description="Número de página"),
    page_size: int = Query(default=10, ge=1, le=100, description="Cantidad por página"),
    technician_id: str | None = Query(default=None, description="Filtro opcional por técnico"),
    scheduled_date_from: date | None = Query(default=None, description="Fecha límite inferior (YYYY-MM-DD)"),
    scheduled_date_to: date | None = Query(default=None, description="Fecha límite superior (YYYY-MM-DD)"),
) -> PaginatedAssignmentsRead:
    """Lista asignaciones paginadas proyectando el avatar, nombre y correo del técnico asignado."""
    reader = SqlModelAssignmentSummaryReader(db)
    handler = ListAssignmentsQueryHandler(reader)

    query = ListAssignmentsQuery(
        page=page,
        page_size=page_size,
        technician_id=technician_id,
        scheduled_date_from=scheduled_date_from,
        scheduled_date_to=scheduled_date_to,
    )

    result = handler.execute(query)

    return PaginatedAssignmentsRead(
        items=[
            AssignmentSummaryRead(
                id=item.id,
                technician_id=item.technician_id,
                technician_name=item.technician_name,
                technician_image=item.technician_image,
                technician_email=item.technician_email,
                total_stops=item.total_stops,
                scheduled_date=item.scheduled_date,
                assignment_type=item.assignment_type,
                status=item.status,
                created_date=item.created_date,
            )
            for item in result.items
        ],
        total=result.total,
        page=result.page,
        page_size=result.page_size,
        total_pages=result.total_pages,
    )


@router.get(
    "/technicians",
    response_model=list[TechnicianOptionRead],
    summary="Listar usuarios con rol de técnico operativo",
)
def list_technicians(
    db: DBSession,
    _: CurrentUser,
) -> list[TechnicianOptionRead]:
    """Retorna la lista de técnicos habilitados para formularios y selectores de asignación."""
    reader = SqlModelAssignmentSummaryReader(db)
    technicians = reader.list_technicians()
    return [
        TechnicianOptionRead(
            id=t.id,
            name=t.name,
            email=t.email,
            image=t.image,
        )
        for t in technicians
    ]


@router.get(
    "/assignments/{assignment_id}",
    response_model=AssignmentDetailRead,
    summary="Obtener detalle integral de una asignación de ruta (Admin y Técnico asignado)",
)
def get_assignment_detail(
    assignment_id: UUID,
    db: DBSession,
    current_user: CurrentUser,
) -> AssignmentDetailRead:
    """Retorna la cabecera, perfil del técnico, paradas ordenadas y geometrías de tramos viales."""
    if current_user.role not in (Role.ADMIN, Role.TECHNICIAN):
        raise APIHTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            code="AUTH_FORBIDDEN",
            message="No tienes permisos para acceder a este recurso.",
        )

    reader = SqlModelAssignmentDetailReader(db)
    handler = GetAssignmentDetailQueryHandler(reader)

    query = GetAssignmentDetailQuery(assignment_id=assignment_id)
    result = handler.execute(query)

    if current_user.role == Role.TECHNICIAN and result.technician_id != current_user.id:
        raise APIHTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            code="AUTH_FORBIDDEN",
            message="No tienes permisos para visualizar esta asignación.",
        )

    return AssignmentDetailRead(
        id=result.id,
        technician_name=result.technician_name,
        technician_image=result.technician_image,
        scheduled_date=result.scheduled_date,
        started_at=result.started_at,
        completed_at=result.completed_at,
        status=result.status,
        assignment_type=result.assignment_type,
        total_stops=result.total_stops,
        total_distance_km=result.total_distance_km,
        start_latitude=result.start_latitude,
        start_longitude=result.start_longitude,
        completed_stops=result.completed_stops,
        stops=[
            AssignmentStopDetailRead(
                id=s.id,
                codigo_fijo_id=s.codigo_fijo_id,
                fixed_code=s.fixed_code,
                name=s.name,
                latitude=s.latitude,
                longitude=s.longitude,
                order_index=s.order_index,
                status=s.status,
                in_transit_at=s.in_transit_at,
                arrived_at=s.arrived_at,
                completed_at=s.completed_at,
                route_geometry=s.route_geometry,
                meter_reading=s.meter_reading,
                evidence_photo_url=s.evidence_photo_url,
                observation=s.observation,
            )
            for s in result.stops
        ],
    )


@router.get(
    "/my-assignments",
    response_model=list[TechnicianAssignmentRead],
    summary="Obtener asignaciones del técnico autenticado",
)
def get_my_assignments(
    db: DBSession,
    current_user: TechnicianUser,
) -> list[TechnicianAssignmentRead]:
    """Retorna todas las asignaciones no eliminadas correspondientes al técnico autenticado."""
    reader = SqlModelTechnicianAssignmentsReader(db)
    handler = ListTechnicianAssignmentsQueryHandler(reader)

    query = ListTechnicianAssignmentsQuery(technician_id=current_user.id)
    dtos = handler.execute(query)

    return [
        TechnicianAssignmentRead(
            id=dto.id,
            assignment_type=dto.assignment_type,
            status=dto.status,
            scheduled_date=dto.scheduled_date,
            total_stops=dto.total_stops,
            total_distance_km=dto.total_distance_km,
            started_at=dto.started_at,
            completed_at=dto.completed_at,
            created_date=dto.created_date,
        )
        for dto in dtos
    ]



