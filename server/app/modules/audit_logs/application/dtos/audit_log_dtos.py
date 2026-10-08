from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass(frozen=True)
class AuditLogItemDTO:
    """Proyección de lectura de una fila de bitácora."""

    id: UUID
    user_id: str
    user_name: str | None
    user_image: str | None
    user_email: str | None
    action: str
    description: str
    created_date: datetime


@dataclass(frozen=True)
class PaginatedAuditLogsDTO:
    """Resultado paginado de la bitácora."""

    items: list[AuditLogItemDTO]
    total: int
    page: int
    page_size: int
    total_pages: int
