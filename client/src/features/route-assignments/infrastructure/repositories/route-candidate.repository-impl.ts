import { API_BASE_URL } from "@/features/shared/config/api.config";
import type { ApiResult } from "@/features/shared/domain/types/api-results";
import { apiRequestData } from "@/features/shared/infrastructure/http/api-client";
import type { FixedCodeCandidate } from "../../domain/entities/fixed-code-candidate.entity";
import type { RouteCandidateRepository } from "../../domain/repositories/route-candidate.repository";
import { fixedCodeCandidateMapper } from "../mappers/fixed-code-candidate.mapper";
import { FixedCodeCandidateListResponseSchema } from "../schemas/fixed-code-candidate.schemas";

export class RouteCandidateRepositoryImpl implements RouteCandidateRepository {
  private readonly baseUrl = `${API_BASE_URL}/api/consultations/codigos-fijos/for-assignment`;

  async searchCodigosFijosForAssignment(
    fixedCode: number,
    limit: number = 10,
    serviceType?: string
  ): Promise<ApiResult<FixedCodeCandidate[]>> {
    const url = new URL(this.baseUrl);
    url.searchParams.set("fixed_code", String(fixedCode));
    url.searchParams.set("limit", String(limit));
    if (serviceType) {
      url.searchParams.set("service_type", serviceType);
    }

    return apiRequestData({
      url: url.toString(),
      method: "GET",
      responseSchema: FixedCodeCandidateListResponseSchema,
      fallbackMessage: "No se pudieron obtener los códigos fijos para asignación.",
      mapData: fixedCodeCandidateMapper.toDomainList,
    });
  }
}

export const routeCandidateRepository = new RouteCandidateRepositoryImpl();
