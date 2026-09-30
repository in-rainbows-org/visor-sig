from typing import Any, List, Optional
from uuid import UUID
from pydantic import BaseModel, Field

from app.modules.map.application.queries.map_feature_dtos import MapLayerLoadStatus
from app.modules.layers.domain.enums import GeometryType, LayerColor, LayerKind


class MapViewportSchema(BaseModel):
    west: float
    south: float
    east: float
    north: float
    zoom: int


class GeoJsonGeometrySchema(BaseModel):
    type: str
    coordinates: Any


class MapFeaturePropertiesSchema(BaseModel):
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


class GeoJsonFeatureSchema(BaseModel):
    type: str = "Feature"
    id: UUID
    geometry: GeoJsonGeometrySchema
    properties: MapFeaturePropertiesSchema


class GeoJsonFeatureCollectionSchema(BaseModel):
    type: str = "FeatureCollection"
    features: List[GeoJsonFeatureSchema] = Field(default_factory=list)


class MapLayerFeaturesSchema(BaseModel):
    layer_id: UUID
    kind: LayerKind
    name: str
    color: LayerColor
    geometry_type: GeometryType
    active_data_version_id: Optional[UUID] = None
    load_status: MapLayerLoadStatus
    min_zoom: Optional[int] = None
    feature_count: int
    features: GeoJsonFeatureCollectionSchema


class MapFeaturesResponseSchema(BaseModel):
    viewport: MapViewportSchema
    layers: List[MapLayerFeaturesSchema]
