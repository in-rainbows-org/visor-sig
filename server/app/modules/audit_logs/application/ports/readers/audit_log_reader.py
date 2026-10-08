from abc import ABC, abstractmethod

from app.modules.audit_logs.application.dtos.audit_log_dtos import (
    PaginatedAuditLogsDTO,
)


class AuditLogReader(ABC):
    """Puerto de lectura optimizada para la bitácora de auditoría (sin prefijo I)."""

    @abstractmethod
    def get_paginated(
        self,
        page: int,
        page_size: int,
    ) -> PaginatedAuditLogsDTO:
        """Obtiene un conjunto paginado de registros de bitácora ordenados por created_date DESC."""
        ...
