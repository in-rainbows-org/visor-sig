import type {
  AssignmentSummaryReadDTO,
  CalculateRouteReadDTO,
  PaginatedAssignmentsReadDTO,
  TechnicianOptionReadDTO,
} from "../schemas/route-assignment.schemas";
import type {
  AssignmentStatus,
  AssignmentType,
  PaginatedRouteAssignments,
  RouteAssignmentSummary,
} from "../../domain/entities/route-assignment.entity";
import type { RouteTechnicianOption } from "../../domain/entities/route-technician.entity";
import type {
  CalculatedRoute,
  OptimizedStop,
} from "../../domain/entities/route-wizard.entity";
import type {
  CalculateRouteRequestParams,
  CreateAssignmentRequestParams,
} from "../../domain/repositories/route-assignment.repository";
import { decodePolyline } from "../utils/polyline-decoder";

export const routeAssignmentMapper = {
  toTechnicianOption(dto: TechnicianOptionReadDTO): RouteTechnicianOption {
    return {
      id: dto.id,
      name: dto.name,
      email: dto.email ?? null,
      image: dto.image ?? null,
    };
  },

  toTechniciansList(dtos: TechnicianOptionReadDTO[]): RouteTechnicianOption[] {
    return dtos.map(this.toTechnicianOption);
  },

  toAssignmentSummary(dto: AssignmentSummaryReadDTO): RouteAssignmentSummary {
    const technicianName = dto.technician_name ?? "Técnico sin nombre";
    const technicianEmail = dto.technician_email ?? "";
    const routeCode = `ASG-${dto.id.substring(0, 8).toUpperCase()}`;

    const rawType = (dto.assignment_type || "").toUpperCase();
    const isCut = rawType === "CUT" || rawType === "CORTE";
    const assignmentType: AssignmentType = isCut ? "CUT" : "RECONNECTION";
    const routeName = isCut ? "Ruta de Corte" : "Ruta de Reconexión";

    const rawStatus = (dto.status || "").toUpperCase();
    const status: AssignmentStatus =
      rawStatus === "IN_PROGRESS"
        ? "IN_PROGRESS"
        : rawStatus === "COMPLETED"
        ? "COMPLETED"
        : rawStatus === "CANCELLED"
        ? "CANCELLED"
        : rawStatus === "PENDING"
        ? "PENDING"
        : "ASSIGNED";

    return {
      id: dto.id,
      technicianId: dto.technician_id,
      technicianName,
      technicianEmail,
      technicianImage: dto.technician_image ?? null,
      totalStops: dto.total_stops,
      scheduledDate: dto.scheduled_date,
      status,
      createdDate: dto.created_date,
      assignmentType,

      // Campos de compatibilidad con UI existente
      workerId: dto.technician_id,
      workerName: technicianName,
      workerEmail: technicianEmail,
      workerAvatar: dto.technician_image ?? null,
      routeCode,
      routeName,
    };
  },

  toPaginatedAssignments(dto: PaginatedAssignmentsReadDTO): PaginatedRouteAssignments {
    return {
      items: dto.items.map((item) => this.toAssignmentSummary(item)),
      total: dto.total,
      page: dto.page,
      pageSize: dto.page_size,
      totalPages: dto.total_pages,
    };
  },

  toCalculatedRoute(dto: CalculateRouteReadDTO): CalculatedRoute {
    const coordinates = decodePolyline(dto.encoded_polyline);

    const orderedStops: OptimizedStop[] = dto.ordered_stops.map((s) => ({
      codigoFijoId: s.codigo_fijo_id,
      orderIndex: s.order_index,
      latitude: s.latitude,
      longitude: s.longitude,
      legDistanceKm: s.leg_distance_km,
      legDurationSeconds: s.leg_duration_seconds,
      legGeometry: s.leg_geometry ?? null,
    }));

    return {
      totalDistanceKm: dto.total_distance_km,
      totalDurationSeconds: dto.total_duration_seconds,
      encodedPolyline: dto.encoded_polyline ?? null,
      coordinates,
      orderedStops,
    };
  },

  toCalculateApiRequest(params: CalculateRouteRequestParams) {
    return {
      start_latitude: params.startLatitude,
      start_longitude: params.startLongitude,
      optimize_waypoint_order: params.optimizeWaypointOrder ?? true,
      waypoints: params.waypoints.map((w) => ({
        codigo_fijo_id: w.codigoFijoId,
        latitude: w.latitude,
        longitude: w.longitude,
      })),
    };
  },

  toCreateAssignmentApiRequest(params: CreateAssignmentRequestParams) {
    return {
      technician_id: params.technicianId,
      assignment_type: params.assignmentType,
      scheduled_date: params.scheduledDate,
      start_latitude: params.startLatitude,
      start_longitude: params.startLongitude,
      total_distance_km: params.totalDistanceKm,
      stops: params.stops.map((s) => ({
        codigo_fijo_id: s.codigoFijoId,
        order_index: s.orderIndex,
        target_status: s.targetStatus,
        current_status: s.currentStatus,
        route_geometry: {},
      })),
    };
  },
};
