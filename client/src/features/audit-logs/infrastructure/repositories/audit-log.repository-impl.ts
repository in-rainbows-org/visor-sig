import { API_BASE_URL } from "@/features/shared/config/api.config";
import type {
  ApiActionResult,
  ApiResult,
} from "@/features/shared/domain/types/api-results";
import {
  apiRequestData,
  apiRequestStatus,
} from "@/features/shared/infrastructure/http/api-client";
import type { PaginatedAuditLogs } from "../../domain/entities/audit-log.entity";
import type {
  AuditLogFilters,
  AuditLogRepository,
  RecordAuthActionInput,
} from "../../domain/repositories/audit-log.repository";
import { auditLogMapper } from "../mappers/audit-log.mapper";
import { PaginatedAuditLogsResponseSchema } from "../schemas/audit-log.schemas";

export class AuditLogRepositoryImpl implements AuditLogRepository {
  private readonly baseUrl = `${API_BASE_URL}/api/audit-logs`;

  async getAuditLogs(
    filters?: AuditLogFilters
  ): Promise<ApiResult<PaginatedAuditLogs>> {
    const url = new URL(this.baseUrl);
    url.searchParams.set("page", String(filters?.page ?? 1));
    url.searchParams.set("page_size", String(filters?.pageSize ?? 10));

    return apiRequestData({
      url: url.toString(),
      method: "GET",
      responseSchema: PaginatedAuditLogsResponseSchema,
      fallbackMessage: "No se pudieron obtener los registros de la bitácora.",
      mapData: (data) => auditLogMapper.toDomainPaginated(data),
    });
  }

  async recordAuthAction(
    input: RecordAuthActionInput
  ): Promise<ApiActionResult> {
    return apiRequestStatus({
      url: this.baseUrl,
      method: "POST",
      body: {
        action: input.action,
        description: input.description,
      },
      fallbackMessage: "No se pudo registrar la acción de auditoría.",
    });
  }
}

export const auditLogRepositoryImpl = new AuditLogRepositoryImpl();
