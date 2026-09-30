import { z } from "zod";

export const layerKindSchema = z.enum([
  "CODIGOS_FIJOS",
  "LOTES",
  "MANZANAS",
  "VIAS",
]);

export const geometryTypeSchema = z.enum(["POINT", "LINE", "POLYGON"]);

export const layerColorSchema = z.enum([
  "BLUE",
  "ORANGE",
  "GREEN",
  "VIOLET",
  "RED",
  "LIGHT_BLUE",
  "YELLOW",
]);

// Read Schema (Backend response in snake_case)
export const layerReadSchema = z.object({
  id: z.string().uuid(),
  kind: layerKindSchema,
  name: z.string().min(1).max(120),
  geometry_type: geometryTypeSchema,
  color: layerColorSchema,
  active_data_version_id: z.string().uuid().nullable(),
  updated_at: z.string(),
});

export const layerListReadSchema = z.object({
  items: z.array(layerReadSchema),
});

export type LayerReadDto = z.infer<typeof layerReadSchema>;
export type LayerListReadDto = z.infer<typeof layerListReadSchema>;

// Command Schema for changing color exclusively
export const changeLayerColorCommandSchema = z.object({
  color: layerColorSchema,
});

export type ChangeLayerColorCommand = z.infer<typeof changeLayerColorCommandSchema>;
