import { z } from "zod";

export const codigoFijoReadSchema = z.object({
  id: z.string().uuid(),
  data_version_id: z.string().uuid().nullable().optional().default(null),
  fixed_code: z.number().int(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  status: z.number().int(),
  status_changed_at: z.string(),
  sql_code: z.number().int().nullable().optional().default(null),
  sig_code: z.string().nullable().optional().default(null),
  lote_id: z.string().uuid().nullable().optional().default(null),
});

export type CodigoFijoReadDto = z.infer<typeof codigoFijoReadSchema>;

export const createCodigoFijoSchema = z.object({
  fixedCode: z
    .number()
    .int("Debe ser un número entero")
    .positive("El código fijo debe ser un número entero positivo"),
  name: z
    .string()
    .trim()
    .min(1, "El nombre del titular es obligatorio")
    .max(120, "El nombre no puede exceder 120 caracteres"),
  latitude: z
    .number()
    .min(-90, "Latitud inválida")
    .max(90, "Latitud inválida"),
  longitude: z
    .number()
    .min(-180, "Longitud inválida")
    .max(180, "Longitud inválida"),
  status: z.number().int().min(1).max(5).default(1),
});

export type CreateCodigoFijoSchemaInput = z.infer<typeof createCodigoFijoSchema>;
