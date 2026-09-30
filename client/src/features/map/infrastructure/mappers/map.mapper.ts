import type { FixedCodeStatusValue } from "../../domain/models/fixed-code-status.types";
import type {
  GeoJsonGeometry,
  MapFeatureProperties,
  MapFeaturesResponse,
  MapGeoJsonFeature,
  MapGeoJsonFeatureCollection,
  MapLayerFeatures,
  MapViewport,
} from "../../domain/models/map.types";
import type { MapFeaturesResponseDto, MapLayerFeaturesDto } from "../schemas/map.schemas";

export class MapMapper {
  static toDomain(dto: MapFeaturesResponseDto): MapFeaturesResponse {
    return {
      viewport: this.mapViewportToDomain(dto.viewport),
      layers: dto.layers.map((l) => this.mapLayerFeaturesToDomain(l)),
    };
  }

  static mapViewportToDomain(dto: MapFeaturesResponseDto["viewport"]): MapViewport {
    return {
      west: dto.west,
      south: dto.south,
      east: dto.east,
      north: dto.north,
      zoom: dto.zoom,
    };
  }

  static mapLayerFeaturesToDomain(dto: MapLayerFeaturesDto): MapLayerFeatures {
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
      features: this.mapFeatureCollectionToDomain(dto.features),
    };
  }

  static mapFeatureCollectionToDomain(
    dto: MapLayerFeaturesDto["features"]
  ): MapGeoJsonFeatureCollection {
    return {
      type: "FeatureCollection",
      features: dto.features.map((f) => this.mapFeatureToDomain(f)),
    };
  }

  static mapFeatureToDomain(
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
  }
}

export const mapMapper = MapMapper;
