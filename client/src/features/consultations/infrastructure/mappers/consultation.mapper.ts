import type { z } from "zod";
import type {
  CodigoFijoConsultation,
  CodigoFijoDetail,
  LoteConsultation,
  ManzanaConsultation,
  PaginatedConsultationResult,
  ViaConsultation,
} from "../../domain/entities/consultation.entity";
import type {
  CodigoFijoDetailResponse,
  PaginatedCodigoFijoResponseSchema,
  PaginatedLoteResponseSchema,
  PaginatedManzanaResponseSchema,
  PaginatedViaResponseSchema,
} from "../schemas/consultation.schemas";

export const consultationMapper = {
  // ── Mapeo de Manzanas (snake_case -> camelCase) ──────────────────────────
  toManzanaResult(
    raw: z.infer<typeof PaginatedManzanaResponseSchema>
  ): PaginatedConsultationResult<ManzanaConsultation> {
    return {
      items: raw.items.map((item) => ({
        id: item.id,
        uvBlockCode: item.uv_block_code ?? null,
        uv: item.uv ?? null,
        blockNumber: item.block_number ?? null,
      })),
      total: raw.total,
      page: raw.page,
      pageSize: raw.page_size,
      totalPages: raw.total_pages,
    };
  },

  // ── Mapeo de Vías (snake_case -> camelCase) ──────────────────────────────
  toViaResult(
    raw: z.infer<typeof PaginatedViaResponseSchema>
  ): PaginatedConsultationResult<ViaConsultation> {
    return {
      items: raw.items.map((item) => ({
        id: item.id,
        name: item.name ?? null,
        reference: item.reference ?? null,
        roadType: item.road_type ?? null,
      })),
      total: raw.total,
      page: raw.page,
      pageSize: raw.page_size,
      totalPages: raw.total_pages,
    };
  },

  // ── Mapeo de Lotes (snake_case -> camelCase) ─────────────────────────────
  toLoteResult(
    raw: z.infer<typeof PaginatedLoteResponseSchema>
  ): PaginatedConsultationResult<LoteConsultation> {
    return {
      items: raw.items.map((item) => ({
        id: item.id,
        lotNumber: item.lot_number ?? null,
        manzanaUvBlockCode: item.manzana_uv_block_code ?? null,
      })),
      total: raw.total,
      page: raw.page,
      pageSize: raw.page_size,
      totalPages: raw.total_pages,
    };
  },

  // ── Mapeo de Códigos Fijos (snake_case -> camelCase) ────────────────────
  toCodigoFijoResult(
    raw: z.infer<typeof PaginatedCodigoFijoResponseSchema>
  ): PaginatedConsultationResult<CodigoFijoConsultation> {
    return {
      items: raw.items.map((item) => ({
        id: item.id,
        label: item.label ?? null,
        fixedCode: item.fixed_code ?? null,
        name: item.name ?? null,
        status: item.status,
        lotNumber: item.lot_number ?? null,
      })),
      total: raw.total,
      page: raw.page,
      pageSize: raw.page_size,
      totalPages: raw.total_pages,
    };
  },

  // ── Mapeo de Detalle de Código Fijo (snake_case -> camelCase) ───────────
  toCodigoFijoDetail(raw: CodigoFijoDetailResponse): CodigoFijoDetail {
    return {
      id: raw.id,
      label: raw.label ?? null,
      fixedCode: raw.fixed_code ?? null,
      name: raw.name ?? null,
      status: raw.status,
      latitude: raw.latitude,
      longitude: raw.longitude,
      lotNumber: raw.lot_number ?? null,
      uv: raw.uv ?? null,
      blockNumber: raw.block_number ?? null,
      uvBlockCode: raw.uv_block_code ?? null,
    };
  },
};

