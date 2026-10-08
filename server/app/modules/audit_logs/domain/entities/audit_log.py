from dataclasses import dataclass

from app.modules.audit_logs.domain.enums import ActionType
from app.modules.audit_logs.domain.exceptions import InvalidAuditLogError


@dataclass
class AuditLog:
    """
    Entidad de dominio pura que representa un registro de bitácora de auditoría.
    La fecha y el ID persistido residen en la infraestructura vía BaseModel.
    """

    user_id: str
    action: ActionType
    description: str

    @classmethod
    def create(
        cls,
        user_id: str,
        action: ActionType,
        description: str,
    ) -> "AuditLog":
        if not user_id or not user_id.strip():
            raise InvalidAuditLogError("user_id no puede estar vacío.")

        if not isinstance(action, ActionType):
            raise InvalidAuditLogError(f"Acción inválida: {action}")

        if not description or not description.strip():
            raise InvalidAuditLogError("description no puede estar vacía.")

        return cls(
            user_id=user_id.strip(),
            action=action,
            description=description.strip(),
        )
