from datetime import date, datetime
from enum import Enum
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field, model_validator
from typing_extensions import Self

from app.modules.route_assignments.domain.value_objects.assignment_type import AssignmentType


class TechnicianOptionRead(BaseModel):
    """Representación de un técnico u operario para selectores y formularios."""

    id: str
    name: str
    email: str | None = None
    image: str | None = None


class CreateAssignmentStopRequest(BaseModel):
    """Petición para registrar una parada de la asignación."""

    codigo_fijo_id: UUID = Field(description="ID del código fijo asociado")
    order_index: int = Field(ge=1, description="Índice de secuencia de visita (1..N)")
    current_status: int | None = Field(
        default=None,
        description="Estado actual del código fijo (validado en backend contra BD)",
    )
    target_status: int = Field(
        description="Estado objetivo esperado (3 para CUT, 1 para RECONNECTION)"
    )
    route_geometry: dict[str, Any] = Field(
        default_factory=dict,
        description="Geometría del tramo de ruta que conduce a esta parada",
    )


class CreateAssignmentRequest(BaseModel):
    """Petición para registrar una asignación completa con sus paradas."""

    technician_id: str = Field(description="ID del usuario con rol TECHNICIAN asignado")
    assignment_type: AssignmentType = Field(description="Tipo de asignación: CUT o RECONNECTION")
    scheduled_date: date = Field(description="Fecha programada para la labor")
    start_latitude: float = Field(description="Latitud del punto de partida")
    start_longitude: float = Field(description="Longitud del punto de partida")
    total_distance_km: float = Field(ge=0.0, description="Distancia total acumulada en km")
    stops: list[CreateAssignmentStopRequest] = Field(
        min_length=1,
        max_length=10,
        description="Lista de 1 a 10 paradas ordenadas de la ruta",
    )


class AssignmentRead(BaseModel):
    """Representación pública del detalle de una asignación creada."""

    id: UUID
    technician_id: str
    status: str
    assignment_type: str
    scheduled_date: date
    start_latitude: float
    start_longitude: float
    total_stops: int
    total_distance_km: float
    started_at: datetime | None
    completed_at: datetime | None
    created_date: datetime


class AssignmentSummaryRead(BaseModel):
    """Proyección de una asignación con datos de perfil del técnico."""

    id: UUID
    technician_id: str
    technician_name: str | None
    technician_image: str | None
    technician_email: str | None
    total_stops: int
    scheduled_date: date
    assignment_type: str
    status: str
    created_date: datetime


class PaginatedAssignmentsRead(BaseModel):
    """Resultado paginado de asignaciones de ruta."""

    items: list[AssignmentSummaryRead]
    total: int
    page: int
    page_size: int
    total_pages: int


class AssignmentStopDetailRead(BaseModel):
    """Proyección de una parada para la vista de detalle de asignación."""

    id: UUID
    codigo_fijo_id: UUID
    fixed_code: int | None = None
    name: str | None = None
    latitude: float
    longitude: float
    order_index: int
    status: str
    in_transit_at: datetime | None = None
    arrived_at: datetime | None = None
    completed_at: datetime | None = None
    route_geometry: dict[str, Any] = Field(default_factory=dict)
    meter_reading: str | None = None
    evidence_photo_url: str | None = None
    observation: str | None = None


class AssignmentStopRead(BaseModel):
    """Representación pública del resultado de actualización o mutación de una parada."""

    id: UUID
    assignment_id: UUID
    codigo_fijo_id: UUID
    order_index: int
    status: str
    in_transit_at: datetime | None = None
    arrived_at: datetime | None = None
    completed_at: datetime | None = None
    meter_reading: str | None = None
    observation: str | None = None
    evidence_photo_url: str | None = None


class AssignmentDetailRead(BaseModel):
    """Detalle integral de la asignación para supervisión y monitoreo administrativo."""

    id: UUID
    technician_name: str | None = None
    technician_image: str | None = None
    scheduled_date: date
    started_at: datetime | None = None
    completed_at: datetime | None = None
    status: str
    assignment_type: str
    total_stops: int
    total_distance_km: float
    start_latitude: float
    start_longitude: float
    completed_stops: int
    stops: list[AssignmentStopDetailRead] = Field(default_factory=list)


class StopCompletionStatus(str, Enum):
    """Estados admisibles para la conclusión de la visita técnica."""

    SUCCESS = "SUCCESS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class CompleteStopRequest(BaseModel):
    """Petición para concluir la visita técnica a una parada."""

    status: StopCompletionStatus = Field(
        description="Resultado de la visita (SUCCESS, COMPLETED o FAILED)"
    )
    observation: str | None = Field(
        default=None,
        description="Observaciones técnicas (obligatorias si status es FAILED)",
    )
    meter_reading: str | None = Field(
        default=None,
        description="Lectura o número de medidor",
    )
    evidence_photo_url: str | None = Field(
        default=None,
        description="URL pública de la fotografía de evidencia de visita",
    )

    @model_validator(mode="after")
    def validate_stop_data(self) -> Self:
        if self.status == StopCompletionStatus.FAILED:
            if not self.observation or not self.observation.strip():
                raise ValueError("Debe proporcionar una observación justificativa al marcar la parada como fallida.")
        return self


