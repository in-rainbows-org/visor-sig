import { z } from "zod";

// ==========================================
// ESQUEMAS DE LECTURA (Backend snake_case 1:1)
// ==========================================

export const ManzanaConsultationItemSchema = z.object({
  id: z.string().uuid(),
  uv_block_code: z.string().nullable().optional(),
  uv: z.string().nullable().optional(),
  block_number: z.string().nullable().optional(),
});

export const ViaConsultationItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().nullable().optional(),
  reference: z.string().nullable().optional(),
  road_type: z.string().nullable().optional(),
});

export const LoteConsultationItemSchema = z.object({
  id: z.string().uuid(),
  lot_number: z.string().nullable().optional(),
  manzana_uv_block_code: z.string().nullable().optional(),
});

export const CodigoFijoConsultationItemSchema = z.object({
  id: z.string().uuid(),
  label: z.string().nullable().optional(),
  fixed_code: z.number().nullable().optional(),
  name: z.string().nullable().optional(),
  status: z.number(),
  lot_number: z.string().nullable().optional(),
});

export const CodigoFijoDetailResponseSchema = z.object({
  id: z.string().uuid(),
  label: z.string().nullable().optional(),
  fixed_code: z.number().nullable().optional(),
  name: z.string().nullable().optional(),
  status: z.number(),
  latitude: z.number(),
  longitude: z.number(),
  lot_number: z.string().nullable().optional(),
  uv: z.string().nullable().optional(),
  block_number: z.string().nullable().optional(),
  uv_block_code: z.string().nullable().optional(),
});

export type CodigoFijoDetailResponse = z.infer<typeof CodigoFijoDetailResponseSchema>;


export function createPaginatedResponseSchema<T extends z.ZodTypeAny>(itemSchema: T) {
  return z.object({
    items: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    page_size: z.number(),
    total_pages: z.number(),
  });
}

export const PaginatedManzanaResponseSchema = createPaginatedResponseSchema(ManzanaConsultationItemSchema);
export const PaginatedViaResponseSchema = createPaginatedResponseSchema(ViaConsultationItemSchema);
export const PaginatedLoteResponseSchema = createPaginatedResponseSchema(LoteConsultationItemSchema);
export const PaginatedCodigoFijoResponseSchema = createPaginatedResponseSchema(CodigoFijoConsultationItemSchema);
