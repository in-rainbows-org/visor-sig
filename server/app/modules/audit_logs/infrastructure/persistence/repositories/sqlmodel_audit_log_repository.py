from app.modules.audit_logs.domain.entities.audit_log import AuditLog
from app.modules.audit_logs.domain.repositories.audit_log_repository import (
    AuditLogRepository,
)
from app.modules.audit_logs.infrastructure.persistence.mappers.audit_log_mapper import (
    AuditLogMapper,
)
from sqlmodel import Session


class SqlModelAuditLogRepository(AuditLogRepository):
    """
    Implementación SQLModel del repositorio de bitácora de auditoría.
    """

    def __init__(self, session: Session) -> None:
        self.session = session

    def save(self, audit_log: AuditLog) -> AuditLog:
        model = AuditLogMapper.to_model(audit_log)
        self.session.add(model)
        self.session.flush()
        return AuditLogMapper.to_domain(model)
