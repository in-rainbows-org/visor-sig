import type {
  ApiActionResult,
  ApiResult,
} from "@/features/shared/domain/types/api-results";
import type { PaginatedAuditLogs } from "../entities/audit-log.entity";

export interface AuditLogFilters {
  page?: number;
  pageSize?: number;
}

export interface RecordAuthActionInput {
  action: "LOGIN" | "LOGOUT";
  description: string;
}

export interface AuditLogRepository {
  /**
   * Obtiene la lista paginada de registros de bitácora del sistema.
   * Requiere rol ADMIN.
   */
  getAuditLogs(filters?: AuditLogFilters): Promise<ApiResult<PaginatedAuditLogs>>;

  /**
   * Registra una acción de autenticación (LOGIN o LOGOUT) en el servidor.
   */
  recordAuthAction(input: RecordAuthActionInput): Promise<ApiActionResult>;
}
