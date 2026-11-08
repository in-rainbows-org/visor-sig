import type { ApiMaybeResult, ApiResult } from "@/features/shared/domain/types/api-results";
import type { AssignmentDetail } from "../entities/assignment-detail.entity";
import type {
  PaginatedRouteAssignments,
  RouteAssignmentFilter,
} from "../entities/route-assignment.entity";
import type { RouteTechnicianOption } from "../entities/route-technician.entity";
import type { CalculatedRoute, RouteServiceType } from "../entities/route-wizard.entity";

export type CalculateRouteRequestParams = {
  startLatitude: number;
  startLongitude: number;
  optimizeWaypointOrder?: boolean;
  waypoints: {
    codigoFijoId: string;
    latitude: number;
    longitude: number;
  }[];
};

export type CreateAssignmentStopParams = {
  codigoFijoId: string;
  orderIndex: number;
  targetStatus: number;
  currentStatus: number;
  routeGeometry?: Record<string, unknown> | string | null;
};

export type CreateAssignmentRequestParams = {
  technicianId: string;
  assignmentType: RouteServiceType;
  scheduledDate: string; // YYYY-MM-DD
  startLatitude: number;
  startLongitude: number;
  totalDistanceKm: number;
  stops: CreateAssignmentStopParams[];
};

export type CreatedAssignmentResult = {
  id: string;
  technicianId: string;
  status: string;
  scheduledDate: string;
};

export interface RouteAssignmentRepository {
  /**
   * Obtiene la lista paginada de asignaciones con filtros opcionales.
   */
  getAssignments(filter?: RouteAssignmentFilter): Promise<ApiResult<PaginatedRouteAssignments>>;

  /**
   * Obtiene el listado de técnicos del sistema para selectores de asignación.
   */
  getTechnicians(): Promise<ApiResult<RouteTechnicianOption[]>>;

  /**
   * Calcula y optimiza la ruta vial a través del backend / OSRM.
   */
  calculateRoute(params: CalculateRouteRequestParams): Promise<ApiResult<CalculatedRoute>>;

  /**
   * Crea y persiste atómicamente una asignación de ruta con sus paradas.
   */
  createAssignment(params: CreateAssignmentRequestParams): Promise<ApiResult<CreatedAssignmentResult>>;

  /**
   * Obtiene el detalle integral de una asignación específica por su ID.
   */
  getAssignmentDetail(id: string): Promise<ApiMaybeResult<AssignmentDetail>>;
}
