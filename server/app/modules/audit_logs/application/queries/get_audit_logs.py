from dataclasses import dataclass

from app.modules.audit_logs.application.dtos.audit_log_dtos import (
    PaginatedAuditLogsDTO,
)
from app.modules.audit_logs.application.ports.readers.audit_log_reader import (
    AuditLogReader,
)


@dataclass(frozen=True, slots=True)
class GetAuditLogsQuery:
    page: int = 1
    page_size: int = 10


class GetAuditLogsQueryHandler:
    """Manejador de consulta para listar la bitácora del sistema de forma paginada."""

    def __init__(self, reader: AuditLogReader) -> None:
        self.reader = reader

    def execute(self, query: GetAuditLogsQuery) -> PaginatedAuditLogsDTO:
        return self.reader.get_paginated(
            page=query.page,
            page_size=query.page_size,
        )
