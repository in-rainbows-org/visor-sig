import type { GeometryType, LayerColor } from "@/features/layers/domain/entities/layer.entity";
import type { FixedCodeStatusValue } from "./fixed-code-status.types";

export type LayerKind = "CODIGOS_FIJOS" | "LOTES" | "MANZANAS" | "VIAS";

export type MapLayerLoadStatus =
  | "READY"
  | "NO_ACTIVE_VERSION"
  | "ZOOM_REQUIRED"
  | "FEATURE_LIMIT_REACHED";

export type MapViewport = {
  west: number;
  south: number;
  east: number;
  north: number;
  zoom: number;
};

export type GeoJsonGeometry = {
  type: string;
  coordinates: unknown;
};

export type MapFeatureProperties = {
  id: string;
  status?: FixedCodeStatusValue;
  fixedCode?: number;
  label?: string;
  lotNumber?: string;
  uv?: string;
  blockNumber?: string;
  uvBlockCode?: string;
  name?: string;
  roadType?: string;
};

export type MapGeoJsonFeature = {
  type: "Feature";
  id: string;
  geometry: GeoJsonGeometry;
  properties: MapFeatureProperties;
};

export type MapGeoJsonFeatureCollection = {
  type: "FeatureCollection";
  features: MapGeoJsonFeature[];
};

export type MapLayerFeatures = {
  layerId: string;
  kind: LayerKind;
  name: string;
  color: LayerColor;
  geometryType: GeometryType;
  activeDataVersionId: string | null;
  loadStatus: MapLayerLoadStatus;
  minZoom: number | null;
  featureCount: number;
  features: MapGeoJsonFeatureCollection;
};

export type MapFeaturesResponse = {
  viewport: MapViewport;
  layers: MapLayerFeatures[];
};

export type ViewSegmentOption = "layers" | "status";
export type MobileSearchFilterType = "codigo" | "nombre";
export type MobileSubHeaderTab = "capas" | "estado" | null;

/**
 * Constantes por defecto del Visor Cartográfico (San Ignacio de Velasco).
 */
export const DEFAULT_MAP_CENTER: [number, number] = [-16.382, -60.957];
export const DEFAULT_MAP_ZOOM = 14;
export const DEFAULT_VISIBLE_LAYER_KINDS: LayerKind[] = [
  "CODIGOS_FIJOS",
  "MANZANAS",
  "VIAS",
];

export type SearchResultItem = {
  id?: string;
  code: string;
  name: string;
  zone: string;
  lat: number;
  lng: number;
  actionTag: string;
  tagColor: string;
  score: number;
  uv?: string;
  mz?: string;
  lote?: string;
  statusVal?: number;
};

export const DEFAULT_SEARCH_RESULTS: SearchResultItem[] = [];
