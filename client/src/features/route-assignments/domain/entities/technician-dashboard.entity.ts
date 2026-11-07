/**
 * Entidades y tipos de dominio para el Dashboard y Portal del Técnico.
 * Sigue la constitución de frontend y DDD.
 */

export type TechnicianServiceType = "CUT" | "RECONNECTION";

export type TechnicianAssignmentStatus =
  | "PENDING"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

/**
 * Representa la asignación actualmente en progreso por el técnico (Card Hero superior).
 */
export interface ActiveAssignmentProgress {
  id: string;
  routeCode: string;
  serviceType: TechnicianServiceType;
  startedAt: string;
  completedStops: number;
  totalStops: number;
  status: "IN_PROGRESS";
  targetUrl?: string;
}

/**
 * Resumen cuantitativo de asignaciones pendientes (Card inferior de sección 1).
 */
export interface PendingAssignmentsSummary {
  totalPending: number;
  todayCount: number;
}

/**
 * Punto de datos para el gráfico de barras apiladas de rendimiento del técnico.
 */
export interface TechnicianPerformanceBar {
  id: string;
  routeCode: string;
  scheduledDate: string;
  dateFormatted?: string;
  completedStops: number;
  pendingStops: number;
  failedStops: number;
}

/**
 * Item individual en el feed categorizado ("Asignadas" vs "Completadas").
 */
export interface TechnicianFeedItem {
  id: string;
  routeCode: string;
  serviceType: TechnicianServiceType;
  scheduledDate: string;
  completedAt?: string;
  totalStops: number;
  distanceKm: number;
  status: "ASSIGNED" | "COMPLETED";
}
