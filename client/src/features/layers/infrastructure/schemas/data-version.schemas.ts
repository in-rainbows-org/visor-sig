import { z } from "zod";

export const dataVersionStatusSchema = z.enum([
  "PROCESSING",
  "READY",
  "FAILED",
]);

// Read Schema (Backend response in snake_case)
export const dataVersionReadSchema = z.object({
  id: z.string().uuid(),
  layer_id: z.string().uuid(),
  version_number: z.number().int().positive(),
  status: dataVersionStatusSchema,
  source_filename: z.string().max(255),
  feature_count: z.number().int().nonnegative(),
  error_message: z.string().nullable().optional(),
  is_active: z.boolean(),
  created_at: z.string(),
});

export const dataVersionListReadSchema = z.object({
  items: z.array(dataVersionReadSchema),
});

export type DataVersionReadDto = z.infer<typeof dataVersionReadSchema>;
export type DataVersionListReadDto = z.infer<typeof dataVersionListReadSchema>;

// Command Schemas (Frontend input in camelCase)
export const activateDataVersionCommandSchema = z.object({
  layerId: z.string().uuid("Identificador de capa inválido."),
  versionId: z.string().uuid("Identificador de versión inválido."),
});

export type ActivateDataVersionCommand = z.infer<
  typeof activateDataVersionCommandSchema
>;
