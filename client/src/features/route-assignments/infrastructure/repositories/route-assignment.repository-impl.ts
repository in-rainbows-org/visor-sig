import { API_BASE_URL } from "@/features/shared/config/api.config";
import type { ApiResult } from "@/features/shared/domain/types/api-results";
import { apiRequestData } from "@/features/shared/infrastructure/http/api-client";
import type {
  PaginatedRouteAssignments,
  RouteAssignmentFilter,
} from "../../domain/entities/route-assignment.entity";
import type { RouteTechnicianOption } from "../../domain/entities/route-technician.entity";
import type { CalculatedRoute } from "../../domain/entities/route-wizard.entity";
import type {
  CalculateRouteRequestParams,
  CreateAssignmentRequestParams,
  CreatedAssignmentResult,
  RouteAssignmentRepository,
} from "../../domain/repositories/route-assignment.repository";
import { routeAssignmentMapper } from "../mappers/route-assignment.mapper";
import {
  calculateRouteReadSchema,
  createdAssignmentReadSchema,
  paginatedAssignmentsReadSchema,
  techniciansListReadSchema,
} from "../schemas/route-assignment.schemas";

export class RouteAssignmentRepositoryImpl implements RouteAssignmentRepository {
  private readonly baseUrl = `${API_BASE_URL}/api/route-assignments`;

  async getAssignments(
    filter?: RouteAssignmentFilter
  ): Promise<ApiResult<PaginatedRouteAssignments>> {
    const url = new URL(`${this.baseUrl}/assignments`);
    url.searchParams.set("page", String(filter?.page ?? 1));
    url.searchParams.set("page_size", String(filter?.pageSize ?? 10));

    if (filter?.technicianId && filter.technicianId.trim().length > 0) {
      url.searchParams.set("technician_id", filter.technicianId.trim());
    }
    if (filter?.scheduledDateFrom && filter.scheduledDateFrom.trim().length > 0) {
      url.searchParams.set("scheduled_date_from", filter.scheduledDateFrom.trim());
    }
    if (filter?.scheduledDateTo && filter.scheduledDateTo.trim().length > 0) {
      url.searchParams.set("scheduled_date_to", filter.scheduledDateTo.trim());
    }

    return apiRequestData({
      url: url.toString(),
      method: "GET",
      responseSchema: paginatedAssignmentsReadSchema,
      fallbackMessage: "No se pudieron obtener las asignaciones de rutas.",
      mapData: (data) => routeAssignmentMapper.toPaginatedAssignments(data),
    });
  }

  async getTechnicians(): Promise<ApiResult<RouteTechnicianOption[]>> {
    const url = `${this.baseUrl}/technicians`;

    return apiRequestData({
      url,
      method: "GET",
      responseSchema: techniciansListReadSchema,
      fallbackMessage: "No se pudo obtener el listado de técnicos.",
      mapData: (data) => routeAssignmentMapper.toTechniciansList(data),
    });
  }

  async calculateRoute(
    params: CalculateRouteRequestParams
  ): Promise<ApiResult<CalculatedRoute>> {
    const url = `${this.baseUrl}/routes/calculate`;
    const payload = routeAssignmentMapper.toCalculateApiRequest(params);

    return apiRequestData({
      url,
      method: "POST",
      body: payload,
      responseSchema: calculateRouteReadSchema,
      fallbackMessage: "No se pudo calcular la ruta con el proveedor de navegación.",
      mapData: (data) => routeAssignmentMapper.toCalculatedRoute(data),
    });
  }

  async createAssignment(
    params: CreateAssignmentRequestParams
  ): Promise<ApiResult<CreatedAssignmentResult>> {
    const url = `${this.baseUrl}/assignments`;
    const payload = routeAssignmentMapper.toCreateAssignmentApiRequest(params);

    return apiRequestData({
      url,
      method: "POST",
      body: payload,
      responseSchema: createdAssignmentReadSchema,
      fallbackMessage: "No se pudo registrar la asignación de ruta.",
      mapData: (data) => ({
        id: data.id,
        technicianId: data.technician_id,
        status: data.status,
        scheduledDate: data.scheduled_date,
      }),
    });
  }
}

export const routeAssignmentRepository = new RouteAssignmentRepositoryImpl();
