import { API_BASE_URL } from "@/features/shared/config/api.config";
import type { ApiResult } from "@/features/shared/domain/types/api-results";
import { apiRequestData } from "@/features/shared/infrastructure/http/api-client";
import type { TechnicianAssignmentItem } from "../../domain/entities/technician-dashboard.entity";
import type { TechnicianPortalRepository } from "../../domain/repositories/technician-portal.repository";
import { TechnicianAssignmentMapper } from "../mappers/technician-assignment.mapper";
import { technicianAssignmentsListReadSchema } from "../schemas/technician-assignment.schemas";

export class TechnicianPortalRepositoryImpl implements TechnicianPortalRepository {
  private readonly baseUrl = `${API_BASE_URL}/api/route-assignments`;

  async getMyAssignments(): Promise<ApiResult<TechnicianAssignmentItem[]>> {
    const url = `${this.baseUrl}/my-assignments`;

    return apiRequestData({
      url,
      method: "GET",
      responseSchema: technicianAssignmentsListReadSchema,
      fallbackMessage: "No se pudieron obtener las asignaciones del técnico.",
      mapData: (data) => TechnicianAssignmentMapper.toDomainList(data),
    });
  }
}

export const technicianPortalRepository = new TechnicianPortalRepositoryImpl();
