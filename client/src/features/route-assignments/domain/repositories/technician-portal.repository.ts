import type { ApiResult } from "@/features/shared/domain/types/api-results";
import type { TechnicianAssignmentItem } from "../entities/technician-dashboard.entity";

/**
 * Puerto de dominio para acceder a las asignaciones del técnico autenticado.
 */
export interface TechnicianPortalRepository {
  getMyAssignments(): Promise<ApiResult<TechnicianAssignmentItem[]>>;
}
