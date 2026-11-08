import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class CodigoFijoStatisticsRead(BaseModel):
    """
    Esquema de salida de la API para el resumen estadístico de códigos fijos activos.
    """

    model_config = ConfigDict(from_attributes=True)

    total: int = Field(
        ...,
        ge=0,
        description="Total general de códigos fijos registrados en la versión activa",
        examples=[12500],
    )
    normal: int = Field(
        ...,
        ge=0,
        description="Cantidad de suministros con estado Normal (1)",
        examples=[9800],
    )
    para_corte: int = Field(
        ...,
        ge=0,
        description="Cantidad de suministros con estado Para corte (2)",
        examples=[1200],
    )
    cortado: int = Field(
        ...,
        ge=0,
        description="Cantidad de suministros con estado Cortado (3)",
        examples=[800],
    )
    baja_parcial: int = Field(
        ...,
        ge=0,
        description="Cantidad de suministros con estado Baja parcial (4)",
        examples=[450],
    )
    baja_total: int = Field(
        ...,
        ge=0,
        description="Cantidad de suministros con estado Baja total (5)",
        examples=[250],
    )


class CreateCodigoFijoRequest(BaseModel):
    """Esquema de entrada para registrar un código fijo."""

    fixed_code: int = Field(
        ...,
        gt=0,
        description="Código identificador numérico único del suministro",
        examples=[104523],
    )
    name: str = Field(
        ...,
        min_length=1,
        max_length=120,
        description="Nombre completo del abonado o titular",
        examples=["JUAN PEREZ FLORES"],
    )
    latitude: float = Field(
        ...,
        ge=-90.0,
        le=90.0,
        description="Coordenada de latitud WGS84",
        examples=[-17.783321],
    )
    longitude: float = Field(
        ...,
        ge=-180.0,
        le=180.0,
        description="Coordenada de longitud WGS84",
        examples=[-63.182134],
    )
    status: int = Field(
        default=1,
        ge=1,
        le=5,
        description="Estado operativo del servicio (1 a 5)",
        examples=[1],
    )


class CodigoFijoRead(BaseModel):
    """Esquema de salida para un código fijo registrado."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID = Field(..., description="Identificador único UUID")
    data_version_id: uuid.UUID | None = Field(None, description="Versión de datos asociada")
    fixed_code: int = Field(..., description="Código fijo")
    name: str = Field(..., description="Nombre del titular")
    latitude: float = Field(..., description="Latitud")
    longitude: float = Field(..., description="Longitud")
    status: int = Field(..., description="Estado numérico (1 a 5)")
    status_changed_at: datetime = Field(..., description="Fecha de último cambio de estado")
    sql_code: int | None = Field(None, description="Código SQL de exportación")
    sig_code: str | None = Field(None, description="Código SIG")
    lote_id: uuid.UUID | None = Field(None, description="ID del lote relacionado")
