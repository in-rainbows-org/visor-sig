from app.modules.audit_logs.domain.entities.audit_log import AuditLog
from app.modules.audit_logs.domain.enums import ActionType
from app.modules.audit_logs.infrastructure.persistence.models.audit_log_model import (
    AuditLogModel,
)


class AuditLogMapper:
    """Mapeador bidireccional entre la entidad de dominio AuditLog y el modelo AuditLogModel."""

    @staticmethod
    def to_domain(model: AuditLogModel) -> AuditLog:
        return AuditLog(
            user_id=model.user_id,
            action=ActionType(model.action),
            description=model.description,
        )

    @staticmethod
    def to_model(entity: AuditLog, existing_model: AuditLogModel | None = None) -> AuditLogModel:
        model = existing_model or AuditLogModel(
            user_id=entity.user_id,
            action=entity.action.value if hasattr(entity.action, "value") else str(entity.action),
            description=entity.description,
        )
        model.user_id = entity.user_id
        model.action = entity.action.value if hasattr(entity.action, "value") else str(entity.action)
        model.description = entity.description
        return model
