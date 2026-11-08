from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field


class TechnicianAssignmentRead(BaseModel):
    """Representación de una asignación en el listado del portal del técnico."""

    id: UUID = Field(description="Identificador único de la asignación")
    assignment_type: str = Field(description="Tipo de servicio: CUT o RECONNECTION")
    status: str = Field(description="Estado de la asignación: PENDING, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED")
    scheduled_date: date = Field(description="Fecha agendada para la labor")
    total_stops: int = Field(ge=0, description="Cantidad total de paradas/casas")
    total_distance_km: float = Field(ge=0.0, description="Distancia total estimada en kilómetros")
    started_at: datetime | None = Field(default=None, description="Fecha y hora de inicio de la ruta")
    completed_at: datetime | None = Field(default=None, description="Fecha y hora de finalización de la ruta")
    created_date: datetime = Field(description="Fecha y hora de creación de la asignación")
