import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

from app.modules.layers.domain.enums import GeometryType, LayerColor, LayerKind


class ChangeLayerColorRequest(BaseModel):
    """Esquema de solicitud estricto para cambiar el color de una capa."""

    model_config = ConfigDict(extra="forbid")

    color: LayerColor = Field(..., description="Nuevo color de la simbología")


class LayerResponse(BaseModel):
    """Esquema de respuesta que representa una capa fija del catálogo."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    kind: LayerKind
    name: str
    geometry_type: GeometryType
    color: LayerColor
    active_data_version_id: Optional[uuid.UUID] = None
    updated_at: datetime


class LayerListResponse(BaseModel):
    """Esquema de respuesta para la colección de capas fijas."""

    items: list[LayerResponse]
