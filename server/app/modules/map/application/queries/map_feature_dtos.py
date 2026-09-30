from enum import Enum
from typing import Any, List, Optional
from uuid import UUID
from pydantic import BaseModel, Field

from app.modules.layers.domain.enums import GeometryType, LayerColor, LayerKind


class MapLayerLoadStatus(str, Enum):
    READY = "READY"
    NO_ACTIVE_VERSION = "NO_ACTIVE_VERSION"
    ZOOM_REQUIRED = "ZOOM_REQUIRED"
    FEATURE_LIMIT_REACHED = "FEATURE_LIMIT_REACHED"


class MapViewportDTO(BaseModel):
    west: float
    south: float
    east: float
    north: float
    zoom: int


class GeoJsonGeometryDTO(BaseModel):
    type: str
    coordinates: Any


class MapFeaturePropertiesDTO(BaseModel):
    id: UUID
    status: Optional[int] = None
    fixed_code: Optional[int] = None
    label: Optional[str] = None
    lot_number: Optional[str] = None
    uv: Optional[str] = None
    block_number: Optional[str] = None
    uv_block_code: Optional[str] = None
    name: Optional[str] = None
    road_type: Optional[str] = None


class GeoJsonFeatureDTO(BaseModel):
    type: str = "Feature"
    id: UUID
    geometry: GeoJsonGeometryDTO
    properties: MapFeaturePropertiesDTO


class GeoJsonFeatureCollectionDTO(BaseModel):
    type: str = "FeatureCollection"
    features: List[GeoJsonFeatureDTO] = Field(default_factory=list)


class MapLayerFeaturesDTO(BaseModel):
    layer_id: UUID
    kind: LayerKind
    name: str
    color: LayerColor
    geometry_type: GeometryType
    active_data_version_id: Optional[UUID] = None
    load_status: MapLayerLoadStatus
    min_zoom: Optional[int] = None
    feature_count: int
    features: GeoJsonFeatureCollectionDTO


class MapFeaturesResponseDTO(BaseModel):
    viewport: MapViewportDTO
    layers: List[MapLayerFeaturesDTO]
