from typing import Any, Dict, List, Optional
from uuid import UUID
from pydantic import BaseModel, Field


class FieldMetadataSchema(BaseModel):
    key: str = Field(..., description="Identificador del campo en base de datos")
    label: str = Field(..., description="Nombre amigable para la interfaz")
    type: str = Field("string", description="Tipo de dato del campo")


class LayerMetadataSchema(BaseModel):
    id: UUID = Field(..., description="Identificador único de la capa")
    kind: str = Field(..., description="Tipo de capa (LOTES, MANZANAS, etc.)")
    name: str = Field(..., description="Nombre de la capa")
    geometry_type: str = Field(..., description="Tipo de geometría")
    color: str = Field(..., description="Color representativo")
    has_active_version: bool = Field(..., description="Indica si posee versión activa")
    fields: List[FieldMetadataSchema] = Field(default_factory=list, description="Campos consultables")


class ConsultationRecordSchema(BaseModel):
    id: UUID = Field(..., description="ID de la entidad")
    layer_kind: str = Field(..., description="Tipo de capa")
    code: str = Field(..., description="Código de la entidad")
    manzana: Optional[str] = Field(None, description="Manzana o unidad asociada")
    surface: Optional[str] = Field(None, description="Superficie calculada o longitud")
    status: str = Field("Registrado", description="Estado del registro")
    status_color: str = Field("emerald", description="Color representativo del estado")
    latitude: Optional[float] = Field(None, description="Latitud para visualización")
    longitude: Optional[float] = Field(None, description="Longitud para visualización")
    attributes: Dict[str, Any] = Field(default_factory=dict, description="Atributos adicionales")


class PaginatedConsultationResponseSchema(BaseModel):
    items: List[ConsultationRecordSchema] = Field(default_factory=list, description="Lista de registros")
    total: int = Field(..., description="Total de registros que coinciden con el filtro")
    page: int = Field(..., description="Página actual")
    page_size: int = Field(..., description="Cantidad de registros por página")
    total_pages: int = Field(..., description="Total de páginas disponibles")
    layer_name: str = Field(..., description="Nombre de la capa consultada")
