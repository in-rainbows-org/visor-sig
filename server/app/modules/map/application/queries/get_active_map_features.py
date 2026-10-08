from dataclasses import dataclass, field
from typing import Any
from uuid import UUID

from app.modules.layers.domain.enums import GeometryType, LayerColor, LayerKind
from app.modules.map.application.ports.readers.active_map_features_reader import (
    ActiveMapFeaturesReader,
)
from app.modules.map.domain.enums import MapLayerLoadStatus


@dataclass(frozen=True, slots=True)
class MapViewportDTO:
    """DTO representativo de las coordenadas y nivel de zoom del viewport."""

    west: float
    south: float
    east: float
    north: float
    zoom: int


@dataclass(frozen=True, slots=True)
class GeoJsonGeometryDTO:
    """DTO para la geometría GeoJSON pura (tipo y coordenadas)."""

    type: str
    coordinates: Any


@dataclass(frozen=True, slots=True)
class MapFeaturePropertiesDTO:
    """DTO con las propiedades semánticas y catastrales asociadas a cada entidad geográfica."""

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


@dataclass(frozen=True, slots=True)
class GeoJsonFeatureDTO:
    """DTO para un elemento GeoJSON individual (Feature)."""

    id: UUID
    geometry: GeoJsonGeometryDTO
    properties: MapFeaturePropertiesDTO
    type: str = "Feature"


@dataclass(frozen=True, slots=True)
class GeoJsonFeatureCollectionDTO:
    """DTO para una colección de elementos GeoJSON (FeatureCollection)."""

    features: list[GeoJsonFeatureDTO] = field(default_factory=list)
    type: str = "FeatureCollection"


@dataclass(frozen=True, slots=True)
class MapLayerFeaturesDTO:
    """DTO que agrupa los metadatos de capa y su colección de geometrías cargadas."""

    layer_id: UUID
    kind: LayerKind
    name: str
    color: LayerColor
    geometry_type: GeometryType
    active_data_version_id: UUID | None
    load_status: MapLayerLoadStatus
    min_zoom: int | None
    feature_count: int
    features: GeoJsonFeatureCollectionDTO


@dataclass(frozen=True, slots=True)
class MapFeaturesDTO:
    """DTO de salida para la consulta de capas por viewport."""

    viewport: MapViewportDTO
    layers: list[MapLayerFeaturesDTO]


@dataclass(frozen=True, slots=True)
class GetActiveMapFeaturesQuery:
    """Parámetros de consulta de geometrías por viewport y capas."""

    layer_kinds: list[LayerKind]
    west: float
    south: float
    east: float
    north: float
    zoom: int
    fixed_code_statuses: list[int] | None = None


class GetActiveMapFeaturesQueryHandler:
    """Manejador para consultar las geometrías activas filtradas por bounding box."""

    def __init__(self, reader: ActiveMapFeaturesReader) -> None:
        self.reader = reader

    def execute(self, query: GetActiveMapFeaturesQuery) -> MapFeaturesDTO:
        return self.reader.get_features_by_viewport(
            layer_kinds=query.layer_kinds,
            west=query.west,
            south=query.south,
            east=query.east,
            north=query.north,
            zoom=query.zoom,
            fixed_code_statuses=query.fixed_code_statuses,
        )
