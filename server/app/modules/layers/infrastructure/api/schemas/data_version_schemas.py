import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.modules.layers.domain.enums import DataVersionStatus


class DataVersionResponse(BaseModel):
    """Esquema de respuesta para la información de una versión de datos geográficos."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    layer_id: uuid.UUID
    version_number: int = Field(ge=1, description="Número incremental de versión")
    status: DataVersionStatus = Field(description="Estado de la versión: PROCESSING, READY o FAILED")
    source_filename: str = Field(max_length=255, description="Nombre del archivo ZIP de origen")
    feature_count: int = Field(ge=0, description="Cantidad de registros procesados")
    error_message: Optional[str] = Field(default=None, description="Detalle del error en caso de fallo")
    is_active: bool = Field(description="Indica si esta versión es la actualmente activa en la capa")
    created_at: datetime = Field(description="Fecha y hora de importación")


class DataVersionListResponse(BaseModel):
    """Esquema de respuesta para el listado histórico de versiones de datos."""

    items: list[DataVersionResponse]
