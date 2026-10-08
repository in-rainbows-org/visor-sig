from dataclasses import dataclass

from app.modules.audit_logs.domain.entities.audit_log import AuditLog
from app.modules.audit_logs.domain.enums import ActionType
from app.modules.audit_logs.domain.repositories.audit_log_repository import (
    AuditLogRepository,
)
from app.shared.application.ports import UnitOfWork


@dataclass(frozen=True, slots=True)
class RecordAuditLogCommand:
    user_id: str
    action: ActionType
    description: str


class RecordAuditLogUseCase:
    """Caso de uso para registrar de manera transaccional una acción en la bitácora."""

    def __init__(self, audit_log_repo: AuditLogRepository, uow: UnitOfWork) -> None:
        self.audit_log_repo = audit_log_repo
        self.uow = uow

    def execute(self, command: RecordAuditLogCommand) -> AuditLog:
        audit_log = AuditLog.create(
            user_id=command.user_id,
            action=command.action,
            description=command.description,
        )
        saved = self.audit_log_repo.save(audit_log)
        self.uow.commit()
        return saved
