/**
 * Estado operativo de una asignación de ruta de inspección
 */
export type AssignmentStatus = "COMPLETED" | "IN_PROGRESS" | "PENDING";

/**
 * Entidad de dominio que representa una orden de trabajo o asignación
 * de ruta asignada a un técnico de campo.
 */
export type RouteAssignment = {
  id: string;
  routeCode: string;
  routeName: string;
  workerId: string;
  workerName: string;
  workerEmail?: string;
  workerAvatar?: string;
  totalStops: number;
  completedStops: number;
  observedStops: number;
  failedStops: number;
  scheduledDate: string; // YYYY-MM-DD
  assignedDate: string;  // YYYY-MM-DD
  status: AssignmentStatus;
};
