import { z } from "zod";

/**
 * Esquema de respuesta para un candidato de código fijo con coordenadas.
 */
export const FixedCodeCandidateResponseSchema = z.object({
  id: z.string().uuid(),
  fixed_code: z.number().nullable(),
  name: z.string().nullable(),
  status: z.number().int(),
  latitude: z.number(),
  longitude: z.number(),
});

export const FixedCodeCandidateListResponseSchema = z.array(
  FixedCodeCandidateResponseSchema
);

export type FixedCodeCandidateResponse = z.infer<
  typeof FixedCodeCandidateResponseSchema
>;
