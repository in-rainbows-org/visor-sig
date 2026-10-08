import type { FixedCodeStatusValue } from "../../domain/entities/fixed-code-status.entity";
import type {
  GeoJsonGeometry,
  MapFeatureProperties,
  MapFeatures,
  MapGeoJsonFeature,
  MapGeoJsonFeatureCollection,
  MapLayerFeatures,
  MapMacroLayers,
  MapViewport,
} from "../../domain/entities/map.entity";
import type {
  MapFeaturesResponseDto,
  MapLayerFeaturesDto,
  MapMacroLayersResponseDto,
} from "../schemas/map.schemas";

export const mapMapper = {
  toFeatures(dto: MapFeaturesResponseDto): MapFeatures {
    return {
      viewport: this.toViewport(dto.viewport),
      layers: dto.layers.map((l) => this.toLayerFeatures(l)),
    };
  },

  toMacroLayers(dto: MapMacroLayersResponseDto): MapMacroLayers {
    return {
      layers: dto.layers.map((l) => this.toLayerFeatures(l)),
    };
  },

  toViewport(dto: MapFeaturesResponseDto["viewport"]): MapViewport {
    return {
      west: dto.west,
      south: dto.south,
      east: dto.east,
      north: dto.north,
      zoom: dto.zoom,
    };
  },

  toLayerFeatures(dto: MapLayerFeaturesDto): MapLayerFeatures {
    return {
      layerId: dto.layer_id,
      kind: dto.kind,
      name: dto.name,
      color: dto.color,
      geometryType: dto.geometry_type,
      activeDataVersionId: dto.active_data_version_id ?? null,
      loadStatus: dto.load_status,
      minZoom: dto.min_zoom ?? null,
      featureCount: dto.feature_count,
      features: this.toFeatureCollection(dto.features),
    };
  },

  toFeatureCollection(
    dto: MapLayerFeaturesDto["features"]
  ): MapGeoJsonFeatureCollection {
    return {
      type: "FeatureCollection",
      features: dto.features.map((f) => this.toFeature(f)),
    };
  },

  toFeature(
    dto: MapLayerFeaturesDto["features"]["features"][number]
  ): MapGeoJsonFeature {
    return {
      type: "Feature",
      id: dto.id,
      geometry: {
        type: dto.geometry.type,
        coordinates: dto.geometry.coordinates,
      } as GeoJsonGeometry,
      properties: {
        id: dto.properties.id,
        status: (dto.properties.status as FixedCodeStatusValue) ?? undefined,
        fixedCode: dto.properties.fixed_code,
        label: dto.properties.label ?? undefined,
        lotNumber: dto.properties.lot_number ?? undefined,
        uv: dto.properties.uv ?? undefined,
        blockNumber: dto.properties.block_number ?? undefined,
        uvBlockCode: dto.properties.uv_block_code ?? undefined,
        name: dto.properties.name ?? undefined,
        roadType: dto.properties.road_type ?? undefined,
      } as MapFeatureProperties,
    };
  },

  // Aliases transicionales
  toDomain(dto: MapFeaturesResponseDto): MapFeatures {
    return this.toFeatures(dto);
  },

  macroLayersToDomain(dto: MapMacroLayersResponseDto): MapMacroLayers {
    return this.toMacroLayers(dto);
  },
};

export const MapMapper = mapMapper;
