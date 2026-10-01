from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
from uuid import UUID


@dataclass(frozen=True)
class FieldMetadataDTO:
    key: str
    label: str
    type: str = "string"


@dataclass(frozen=True)
class LayerMetadataDTO:
    id: UUID
    kind: str
    name: str
    geometry_type: str
    color: str
    has_active_version: bool
    fields: List[FieldMetadataDTO]


@dataclass(frozen=True)
class ConsultationRecordDTO:
    id: UUID
    layer_kind: str
    code: str
    manzana: Optional[str] = None
    surface: Optional[str] = None
    status: str = "Registrado"
    status_color: str = "emerald"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    attributes: Dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class PaginatedConsultationResponseDTO:
    items: List[ConsultationRecordDTO]
    total: int
    page: int
    page_size: int
    total_pages: int
    layer_name: str
