import { API_BASE_URL } from "@/features/shared/config/api.config";
import type { ApiResult } from "@/features/shared/domain/types/api-results";
import { apiRequestData } from "@/features/shared/infrastructure/http/api-client";
import type {
  CodigoFijoConsultation,
  CodigoFijoDetail,
  LoteConsultation,
  ManzanaConsultation,
  PaginatedConsultationResult,
  ViaConsultation,
} from "../../domain/entities/consultation.entity";
import type {
  CodigoFijoFilters,
  ConsultationRepository,
  LoteFilters,
  ManzanaFilters,
  ViaFilters,
} from "../../domain/repositories/consultation.repository";
import { consultationMapper } from "../mappers/consultation.mapper";
import {
  CodigoFijoDetailResponseSchema,
  PaginatedCodigoFijoResponseSchema,
  PaginatedLoteResponseSchema,
  PaginatedManzanaResponseSchema,
  PaginatedViaResponseSchema,
} from "../schemas/consultation.schemas";

export class ConsultationRepositoryImpl implements ConsultationRepository {
  private readonly baseUrl = `${API_BASE_URL}/api/consultations`;

  async getCodigosFijos(
    filters?: CodigoFijoFilters
  ): Promise<ApiResult<PaginatedConsultationResult<CodigoFijoConsultation>>> {
    const url = new URL(`${this.baseUrl}/codigos-fijos`);
    if (filters?.fixedCode !== undefined) {
      url.searchParams.set("fixed_code", String(filters.fixedCode));
    }
    if (filters?.name?.trim()) {
      url.searchParams.set("name", filters.name.trim());
    }
    url.searchParams.set("page", String(filters?.page ?? 1));
    url.searchParams.set("page_size", String(filters?.pageSize ?? 10));

    return apiRequestData({
      url: url.toString(),
      method: "GET",
      responseSchema: PaginatedCodigoFijoResponseSchema,
      fallbackMessage: "No se pudieron obtener los códigos fijos.",
      mapData: consultationMapper.toCodigoFijoResult,
    });
  }

  async getCodigoFijoById(id: string): Promise<ApiResult<CodigoFijoDetail>> {
    const url = `${this.baseUrl}/codigos-fijos/${id}`;

    return apiRequestData({
      url,
      method: "GET",
      responseSchema: CodigoFijoDetailResponseSchema,
      fallbackMessage: "No se pudo obtener el detalle del código fijo.",
      mapData: consultationMapper.toCodigoFijoDetail,
    });
  }

  async getLotes(
    filters?: LoteFilters
  ): Promise<ApiResult<PaginatedConsultationResult<LoteConsultation>>> {
    const url = new URL(`${this.baseUrl}/lotes`);
    if (filters?.lotNumber?.trim()) {
      url.searchParams.set("lot_number", filters.lotNumber.trim());
    }
    url.searchParams.set("page", String(filters?.page ?? 1));
    url.searchParams.set("page_size", String(filters?.pageSize ?? 10));

    return apiRequestData({
      url: url.toString(),
      method: "GET",
      responseSchema: PaginatedLoteResponseSchema,
      fallbackMessage: "No se pudieron obtener los lotes.",
      mapData: consultationMapper.toLoteResult,
    });
  }

  async getManzanas(
    filters?: ManzanaFilters
  ): Promise<ApiResult<PaginatedConsultationResult<ManzanaConsultation>>> {
    const url = new URL(`${this.baseUrl}/manzanas`);
    if (filters?.uvBlockCode?.trim()) {
      url.searchParams.set("uv_block_code", filters.uvBlockCode.trim());
    }
    if (filters?.uv?.trim()) {
      url.searchParams.set("uv", filters.uv.trim());
    }
    if (filters?.blockNumber?.trim()) {
      url.searchParams.set("block_number", filters.blockNumber.trim());
    }
    url.searchParams.set("page", String(filters?.page ?? 1));
    url.searchParams.set("page_size", String(filters?.pageSize ?? 10));

    return apiRequestData({
      url: url.toString(),
      method: "GET",
      responseSchema: PaginatedManzanaResponseSchema,
      fallbackMessage: "No se pudieron obtener las manzanas.",
      mapData: consultationMapper.toManzanaResult,
    });
  }

  async getVias(
    filters?: ViaFilters
  ): Promise<ApiResult<PaginatedConsultationResult<ViaConsultation>>> {
    const url = new URL(`${this.baseUrl}/vias`);
    if (filters?.roadType?.trim()) {
      url.searchParams.set("road_type", filters.roadType.trim());
    }
    if (filters?.name?.trim()) {
      url.searchParams.set("name", filters.name.trim());
    }
    url.searchParams.set("page", String(filters?.page ?? 1));
    url.searchParams.set("page_size", String(filters?.pageSize ?? 10));

    return apiRequestData({
      url: url.toString(),
      method: "GET",
      responseSchema: PaginatedViaResponseSchema,
      fallbackMessage: "No se pudieron obtener las vías.",
      mapData: consultationMapper.toViaResult,
    });
  }
}

export const consultationRepositoryImpl = new ConsultationRepositoryImpl();
