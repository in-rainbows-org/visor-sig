from abc import ABC, abstractmethod

from app.modules.audit_logs.domain.entities.audit_log import AuditLog


class AuditLogRepository(ABC):
    """
    Contrato del repositorio de dominio para bitácora de auditoría (sin prefijo I).
    """

    @abstractmethod
    def save(self, audit_log: AuditLog) -> AuditLog:
        """Persiste una nueva entrada en la bitácora."""
        ...
