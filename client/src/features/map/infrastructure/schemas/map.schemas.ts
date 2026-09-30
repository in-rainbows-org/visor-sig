import { z } from "zod";

export const layerKindSchema = z.enum(["CODIGOS_FIJOS", "LOTES", "MANZANAS", "VIAS"]);

export const geometryTypeSchema = z.enum(["POINT", "POLYGON", "LINE"]);

export const layerColorSchema = z.enum([
  "BLUE",
  "ORANGE",
  "GREEN",
  "VIOLET",
  "RED",
  "LIGHT_BLUE",
  "YELLOW",
]);

export const mapLayerLoadStatusSchema = z.enum([
  "READY",
  "NO_ACTIVE_VERSION",
  "ZOOM_REQUIRED",
  "FEATURE_LIMIT_REACHED",
]);

export const mapViewportSchema = z.object({
  west: z.number(),
  south: z.number(),
  east: z.number(),
  north: z.number(),
  zoom: z.number().int(),
});

export const geoJsonGeometrySchema = z.object({
  type: z.string(),
  coordinates: z.unknown(),
});

export const mapFeaturePropertiesSchema = z
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

export const geoJsonFeatureSchema = z.object({
  type: z.literal("Feature"),
  id: z.string(),
  geometry: geoJsonGeometrySchema,
  properties: mapFeaturePropertiesSchema,
});

export const geoJsonFeatureCollectionSchema = z.object({
  type: z.literal("FeatureCollection"),
  features: z.array(geoJsonFeatureSchema),
});

export const mapLayerFeaturesSchema = z.object({
  layer_id: z.string(),
  kind: layerKindSchema,
  name: z.string(),
  color: layerColorSchema,
  geometry_type: geometryTypeSchema,
  active_data_version_id: z.string().nullish(),
  load_status: mapLayerLoadStatusSchema,
  min_zoom: z.number().int().nullish(),
  feature_count: z.number().int().nonnegative(),
  features: geoJsonFeatureCollectionSchema,
});

export const mapFeaturesResponseSchema = z.object({
  viewport: mapViewportSchema,
  layers: z.array(mapLayerFeaturesSchema),
});

export type MapFeaturesResponseDto = z.infer<typeof mapFeaturesResponseSchema>;
export type MapLayerFeaturesDto = z.infer<typeof mapLayerFeaturesSchema>;
