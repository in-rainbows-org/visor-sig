from app.core.dependencies import AdminUser, CurrentUser, DBSession, UoWDep
from app.modules.audit_logs.application.queries.get_audit_logs import (
    GetAuditLogsQuery,
    GetAuditLogsQueryHandler,
)
from app.modules.audit_logs.application.use_cases.record_audit_log import (
    RecordAuditLogCommand,
    RecordAuditLogUseCase,
)
from app.modules.audit_logs.domain.enums import ActionType
from app.modules.audit_logs.infrastructure.api.schemas.audit_log_schemas import (
    AuditLogItemRead,
    PaginatedAuditLogsResponse,
    RecordAuditLogRequest,
)
from app.modules.audit_logs.infrastructure.persistence.models.audit_log_model import (
    AuditLogModel,
)
from app.modules.audit_logs.infrastructure.persistence.readers.sqlmodel_audit_log_reader import (
    SqlModelAuditLogReader,
)
from app.modules.audit_logs.infrastructure.persistence.repositories.sqlmodel_audit_log_repository import (
    SqlModelAuditLogRepository,
)
from fastapi import APIRouter, Query, status

router = APIRouter(prefix="/audit-logs", tags=["AuditLogs"])


@router.get(
    "",
    response_model=PaginatedAuditLogsResponse,
    status_code=status.HTTP_200_OK,
    summary="Listar registros de la bitácora del sistema (Solo Administrador)",
)
def get_audit_logs(
    db: DBSession,
    _: AdminUser,
    page: int = Query(1, ge=1, description="Número de página (1-indexed)"),
    page_size: int = Query(10, ge=1, le=100, description="Cantidad de registros por página"),
) -> PaginatedAuditLogsResponse:
    reader = SqlModelAuditLogReader(db)
    handler = GetAuditLogsQueryHandler(reader)
    result = handler.execute(GetAuditLogsQuery(page=page, page_size=page_size))

    return PaginatedAuditLogsResponse(
        items=[
            AuditLogItemRead(
                id=item.id,
                user_id=item.user_id,
                user_name=item.user_name,
                user_image=item.user_image,
                user_email=item.user_email,
                action=item.action,
                description=item.description,
                created_date=item.created_date,
            )
            for item in result.items
        ],
        total=result.total,
        page=result.page,
        page_size=result.page_size,
        total_pages=result.total_pages,
    )


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    summary="Registrar una acción de autenticación en la bitácora (LOGIN / LOGOUT)",
)
def record_client_audit_log(
    payload: RecordAuditLogRequest,
    db: DBSession,
    uow: UoWDep,
    current_user: CurrentUser,
) -> dict:
    repo = SqlModelAuditLogRepository(db)
    use_case = RecordAuditLogUseCase(repo, uow)
    command = RecordAuditLogCommand(
        user_id=current_user.user_id,
        action=ActionType(payload.action),
        description=payload.description,
    )
    use_case.execute(command)

    return {"status": "ok"}
