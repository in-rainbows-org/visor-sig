import { API_BASE_URL } from "@/features/shared/config/api.config";
import type {
  ApiActionResult,
  ApiMaybeResult,
  ApiResult,
} from "@/features/shared/domain/types/api-results";
import {
  apiRequestData,
  apiRequestMaybeData,
  apiRequestStatus,
} from "@/features/shared/infrastructure/http/api-client";
import type { AssignmentDetail } from "../../domain/entities/assignment-detail.entity";
import type { CompleteStopInput } from "../../domain/entities/assignment-execution.entity";
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
import { AssignmentDetailMapper } from "../mappers/assignment-detail.mapper";
import { routeAssignmentMapper } from "../mappers/route-assignment.mapper";
import { assignmentDetailReadSchema } from "../schemas/assignment-detail.schemas";
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

  async getAssignmentDetail(id: string): Promise<ApiMaybeResult<AssignmentDetail>> {
    const url = `${this.baseUrl}/assignments/${encodeURIComponent(id)}`;

    return apiRequestMaybeData({
      url,
      method: "GET",
      responseSchema: assignmentDetailReadSchema,
      fallbackMessage: "No se pudo obtener el detalle de la asignación.",
      mapData: (data) => AssignmentDetailMapper.toDomain(data),
    });
  }

  async startAssignment(assignmentId: string): Promise<ApiActionResult> {
    const url = `${this.baseUrl}/assignments/${encodeURIComponent(assignmentId)}/start`;
    return apiRequestStatus({
      url,
      method: "POST",
      fallbackMessage: "No se pudo iniciar la asignación de ruta.",
    });
  }

  async startStopTransit(assignmentId: string, stopId: string): Promise<ApiActionResult> {
    const url = `${this.baseUrl}/assignments/${encodeURIComponent(assignmentId)}/stops/${encodeURIComponent(stopId)}/transit`;
    return apiRequestStatus({
      url,
      method: "POST",
      fallbackMessage: "No se pudo iniciar el traslado hacia la parada.",
    });
  }

  async arriveAtStop(assignmentId: string, stopId: string): Promise<ApiActionResult> {
    const url = `${this.baseUrl}/assignments/${encodeURIComponent(assignmentId)}/stops/${encodeURIComponent(stopId)}/arrive`;
    return apiRequestStatus({
      url,
      method: "POST",
      fallbackMessage: "No se pudo registrar el arribo a la parada.",
    });
  }

  async completeStop(
    assignmentId: string,
    stopId: string,
    data: CompleteStopInput
  ): Promise<ApiActionResult> {
    const url = `${this.baseUrl}/assignments/${encodeURIComponent(assignmentId)}/stops/${encodeURIComponent(stopId)}/complete`;
    return apiRequestStatus({
      url,
      method: "POST",
      body: {
        status: data.status,
        observation: data.observation ?? null,
        meter_reading: data.meterReading ?? null,
      },
      fallbackMessage: "No se pudo concluir la visita a la parada.",
    });
  }
}

export const routeAssignmentRepository = new RouteAssignmentRepositoryImpl();
