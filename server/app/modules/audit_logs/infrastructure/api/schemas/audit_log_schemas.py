from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class AuditLogItemRead(BaseModel):
    """Esquema de salida para un registro individual de bitácora."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: str
    user_name: str | None = None
    user_image: str | None = None
    user_email: str | None = None
    action: str
    description: str
    created_date: datetime


class PaginatedAuditLogsResponse(BaseModel):
    """Esquema de salida para la lista paginada de bitácora."""

    items: list[AuditLogItemRead]
    total: int = Field(ge=0, description="Total de registros existentes")
    page: int = Field(ge=1, description="Página actual")
    page_size: int = Field(ge=1, le=100, description="Tamaño de página")
    total_pages: int = Field(ge=0, description="Total de páginas calculadas")


class RecordAuditLogRequest(BaseModel):
    """Esquema de entrada para que el cliente registre eventos de login/logout."""

    action: str = Field(..., pattern="^(LOGIN|LOGOUT)$", description="Acción auditable (LOGIN o LOGOUT)")
    description: str = Field(..., min_length=1, max_length=500, description="Descripción del evento")


class AuditLogCreatedResponse(BaseModel):
    """Esquema de confirmación tras registrar un log de auditoría."""

    id: UUID
    user_id: str
    action: str
    description: str
    created_date: datetime
