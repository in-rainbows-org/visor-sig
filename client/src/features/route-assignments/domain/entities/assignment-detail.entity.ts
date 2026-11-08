/**
 * Estado operativo de la asignación completa
 */
export type AssignmentDetailStatus =
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

/**
 * Tipo de servicio programado
 */
export type AssignmentDetailType = "CUT" | "RECONNECTION";

/**
 * Estado operativo de una parada individual
 */
export type AssignmentStopStatus =
  | "PENDING"
  | "IN_TRANSIT"
  | "ARRIVED"
  | "COMPLETED"
  | "FAILED";

/**
 * Entidad de dominio pura que representa una parada individual en la vista de detalle
 */
export interface AssignmentStopDetail {
  readonly id: string;
  readonly codigoFijoId: string;
  readonly fixedCode: number | null;
  readonly name: string | null;
  readonly latitude: number;
  readonly longitude: number;
  readonly orderIndex: number;
  readonly status: AssignmentStopStatus;
  readonly inTransitAt: Date | null;
  readonly arrivedAt: Date | null;
  readonly completedAt: Date | null;
  readonly routeGeometry: Record<string, unknown>;
  readonly coordinates: [number, number][]; // Coordenadas [lat, lon] listas para Polyline de Leaflet
}

/**
 * Entidad de dominio pura que representa el detalle integral de una asignación de ruta
 */
export interface AssignmentDetail {
  readonly id: string;
  readonly technicianName: string | null;
  readonly technicianImage: string | null;
  readonly scheduledDate: string; // YYYY-MM-DD
  readonly startedAt: Date | null;
  readonly completedAt: Date | null;
  readonly status: AssignmentDetailStatus;
  readonly assignmentType: AssignmentDetailType;
  readonly totalStops: number;
  readonly totalDistanceKm: number;
  readonly startLatitude: number;
  readonly startLongitude: number;
  readonly completedStops: number;
  readonly stops: readonly AssignmentStopDetail[];
}
