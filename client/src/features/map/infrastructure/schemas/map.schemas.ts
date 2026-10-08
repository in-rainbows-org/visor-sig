import { z } from "zod";

export const LayerKindSchema = z.enum(["CODIGOS_FIJOS", "LOTES", "MANZANAS", "VIAS"]);

export const GeometryTypeSchema = z.enum(["POINT", "POLYGON", "LINE"]);

export const LayerColorSchema = z.enum([
  "BLUE",
  "ORANGE",
  "GREEN",
  "VIOLET",
  "RED",
  "LIGHT_BLUE",
  "YELLOW",
]);

export const MapLayerLoadStatusSchema = z.enum([
  "READY",
  "NO_ACTIVE_VERSION",
  "ZOOM_REQUIRED",
  "FEATURE_LIMIT_REACHED",
]);

export const MapViewportSchema = z.object({
  west: z.number(),
  south: z.number(),
  east: z.number(),
  north: z.number(),
  zoom: z.number().int(),
});

export const GeoJsonGeometrySchema = z.object({
  type: z.string(),
  coordinates: z.unknown(),
});

export const MapFeaturePropertiesSchema = z
  .object({
    id: z.string(),
    status: z
      .union([
        z.literal(1),
        z.literal(2),
        z.literal(3),
        z.literal(4),
        z.literal(5),
      ])
      .nullish(),
    fixed_code: z.number().int().nullish(),
    label: z.string().nullish(),
    lot_number: z.string().nullish(),
    uv: z.string().nullish(),
    block_number: z.string().nullish(),
    uv_block_code: z.string().nullish(),
    name: z.string().nullish(),
    road_type: z.string().nullish(),
  })
  .passthrough();

export const GeoJsonFeatureSchema = z.object({
  type: z.literal("Feature"),
  id: z.string(),
  geometry: GeoJsonGeometrySchema,
  properties: MapFeaturePropertiesSchema,
});

export const GeoJsonFeatureCollectionSchema = z.object({
  type: z.literal("FeatureCollection"),
  features: z.array(GeoJsonFeatureSchema),
});

export const MapLayerFeaturesResponseSchema = z.object({
  layer_id: z.string(),
  kind: LayerKindSchema,
  name: z.string(),
  color: LayerColorSchema,
  geometry_type: GeometryTypeSchema,
  active_data_version_id: z.string().nullish(),
  load_status: MapLayerLoadStatusSchema,
  min_zoom: z.number().int().nullish(),
  feature_count: z.number().int().nonnegative(),
  features: GeoJsonFeatureCollectionSchema,
});

export const MapFeaturesResponseSchema = z.object({
  viewport: MapViewportSchema,
  layers: z.array(MapLayerFeaturesResponseSchema),
});

export const MapMacroLayersResponseSchema = z.object({
  layers: z.array(MapLayerFeaturesResponseSchema),
});

// Inferencias de tipos DTO
export type MapFeaturesResponseDto = z.infer<typeof MapFeaturesResponseSchema>;
export type MapMacroLayersResponseDto = z.infer<typeof MapMacroLayersResponseSchema>;
export type MapLayerFeaturesDto = z.infer<typeof MapLayerFeaturesResponseSchema>;

// Aliases para compatibilidad transicional
export const mapFeaturesResponseSchema = MapFeaturesResponseSchema;
export const mapMacroLayersResponseSchema = MapMacroLayersResponseSchema;
export const mapLayerFeaturesSchema = MapLayerFeaturesResponseSchema;
