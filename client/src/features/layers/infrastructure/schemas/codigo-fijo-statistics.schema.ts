import { z } from "zod";

/**
 * Esquema Zod para validar la respuesta del endpoint GET /api/layers/codigos-fijos/statistics
 */
export const codigoFijoStatisticsReadSchema = z.object({
  total: z.number().int().nonnegative(),
  normal: z.number().int().nonnegative(),
  para_corte: z.number().int().nonnegative(),
  cortado: z.number().int().nonnegative(),
  baja_parcial: z.number().int().nonnegative(),
  baja_total: z.number().int().nonnegative(),
});

export type CodigoFijoStatisticsDTO = z.infer<typeof codigoFijoStatisticsReadSchema>;
