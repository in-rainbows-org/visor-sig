from typing import Any
from uuid import UUID

from app.modules.layers.domain.enums import GeometryType, LayerColor, LayerKind
from app.modules.map.domain.enums import MapLayerLoadStatus
from pydantic import BaseModel, ConfigDict, Field


class MapViewportRead(BaseModel):
    """Representación pública del bounding box y nivel de zoom del visor."""

    model_config = ConfigDict(from_attributes=True)

    west: float
    south: float
    east: float
    north: float
    zoom: int


class GeoJsonGeometryRead(BaseModel):
    """Representación pública de la geometría GeoJSON."""

    model_config = ConfigDict(from_attributes=True)

    type: str
    coordinates: Any


class MapFeaturePropertiesRead(BaseModel):
    """Propiedades semánticas y alfanuméricas de un elemento cartográfico."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    status: int | None = None
    fixed_code: int | None = None
    label: str | None = None
    lot_number: str | None = None
    uv: str | None = None
    block_number: str | None = None
    uv_block_code: str | None = None
    name: str | None = None
    road_type: str | None = None


class GeoJsonFeatureRead(BaseModel):
    """Elemento individual GeoJSON con identificación, geometría y propiedades."""

    model_config = ConfigDict(from_attributes=True)

    type: str = "Feature"
    id: UUID
    geometry: GeoJsonGeometryRead
    properties: MapFeaturePropertiesRead


class GeoJsonFeatureCollectionRead(BaseModel):
    """Colección estándar GeoJSON de elementos cartográficos."""

    model_config = ConfigDict(from_attributes=True)

    type: str = "FeatureCollection"
    features: list[GeoJsonFeatureRead] = Field(default_factory=list)


class MapLayerFeaturesRead(BaseModel):
    """Capa cartográfica activa con sus metadatos y colección de geometrías GeoJSON."""

    model_config = ConfigDict(from_attributes=True)

    layer_id: UUID
    kind: LayerKind
    name: str
    color: LayerColor
    geometry_type: GeometryType
    active_data_version_id: UUID | None = None
    load_status: MapLayerLoadStatus
    min_zoom: int | None = None
    feature_count: int
    features: GeoJsonFeatureCollectionRead


class MapFeaturesRead(BaseModel):
    """Respuesta para la consulta de capas por viewport geográfico."""

    model_config = ConfigDict(from_attributes=True)

    viewport: MapViewportRead
    layers: list[MapLayerFeaturesRead]


class MapMacroLayersRead(BaseModel):
    """Respuesta para la consulta completa de capas macro (Manzanas y Vías)."""

    model_config = ConfigDict(from_attributes=True)

    layers: list[MapLayerFeaturesRead]
