import type { GeometryType, LayerColor } from "@/features/layers/domain/entities/layer.entity";
import type { FixedCodeStatusValue } from "./fixed-code-status.entity";

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

export type MapFeatures = {
  viewport: MapViewport;
  layers: MapLayerFeatures[];
};

export type MapMacroLayers = {
  layers: MapLayerFeatures[];
};

// Aliases para compatibilidad transicional
export type MapFeaturesResponse = MapFeatures;
export type MapMacroLayersResponse = MapMacroLayers;

export type ViewSegmentOption = "layers" | "status";
export type MobileSearchFilterType = "codigo" | "nombre";
export type MobileSubHeaderTab = "capas" | "estado" | null;

/**
 * Constantes por defecto del Visor Cartográfico (San Ignacio de Velasco).
 */
export const DEFAULT_MAP_CENTER: [number, number] = [-16.382, -60.957];
export const DEFAULT_MAP_ZOOM = 14;
export const DEFAULT_VISIBLE_LAYER_KINDS: LayerKind[] = [
  "VIAS",
  "MANZANAS",
];

export type SearchResultItem = {
  id?: string;
  code: string;
  fixedCode?: number | null;
  label?: string | null;
  name: string;
  lotNumber?: string | null;
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
  status?: number;
};

export const DEFAULT_SEARCH_RESULTS: SearchResultItem[] = [];
