/**
 * Estado operativo de una asignación de ruta de inspección
 */
export type AssignmentStatus =
  | "ASSIGNED"
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

/**
 * Tipo de servicio programado en la asignación
 */
export type AssignmentType = "CUT" | "RECONNECTION";

/**
 * Entidad de dominio que representa el resumen de una asignación
 * de ruta para el historial operativo.
 */
export type RouteAssignmentSummary = {
  id: string;
  technicianId?: string;
  technicianName?: string;
  technicianEmail?: string;
  technicianImage?: string | null;
  totalStops: number;
  scheduledDate: string; // YYYY-MM-DD
  assignmentType?: AssignmentType;
  status: AssignmentStatus;
  createdDate?: string; // ISO 8601

  // Campos de compatibilidad para componentes de presentación existentes y mocks
  workerId: string;
  workerName: string;
  workerEmail?: string;
  workerAvatar?: string | null;
  routeCode: string;
  routeName: string;
  assignedDate?: string;
  completedStops?: number;
  observedStops?: number;
  failedStops?: number;
};

/**
 * Alias de compatibilidad hacia atrás
 */
export type RouteAssignment = RouteAssignmentSummary;

/**
 * Resultado paginado del historial de asignaciones
 */
export type PaginatedRouteAssignments = {
  items: RouteAssignmentSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

/**
 * Parámetros de consulta y filtrado para el historial de asignaciones
 */
export type RouteAssignmentFilter = {
  page?: number;
  pageSize?: number;
  technicianId?: string;
  scheduledDateFrom?: string; // YYYY-MM-DD
  scheduledDateTo?: string;   // YYYY-MM-DD
};
