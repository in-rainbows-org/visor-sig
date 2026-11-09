import { AssignmentStopStatus } from "./assignment-detail.entity";

/**
 * Discriminador de eventos del protocolo de WebSocket para monitoreo en vivo
 */
export type RealtimeEventType =
  | "CONNECTION_ACK"
  | "LOCATION_PING"
  | "TECHNICIAN_LOCATION"
  | "STOP_STATUS_UPDATED"
  | "ASSIGNMENT_COMPLETED";

/**
 * Estados posibles del cliente en su ciclo de vida de conexión WebSocket
 */
export type RealtimeConnectionStatus =
  | "DISCONNECTED"
  | "CONNECTING"
  | "CONNECTED"
  | "RECONNECTING";

/**
 * Envoltorio crudo de mensaje WebSocket proveniente del servidor
 */
export interface RawAssignmentRealtimeEnvelope<T = unknown> {
  readonly type: RealtimeEventType;
  readonly assignment_id?: string;
  readonly assignmentId?: string;
  readonly payload: T;
  readonly timestamp: string;
}

/**
 * Carga útil recibida con la posición geográfica del técnico
 */
export interface RawTechnicianLocationPayload {
  readonly latitude: number;
  readonly longitude: number;
  readonly heading?: number | null;
  readonly speed?: number | null;
  readonly timestamp: string;
}

/**
 * Carga útil recibida cuando una parada transiciona de estado operativo
 */
export interface RawStopStatusUpdatedPayload {
  readonly stop_id: string;
  readonly order_index: number;
  readonly status: AssignmentStopStatus;
  readonly in_transit_at?: string | null;
  readonly arrived_at?: string | null;
  readonly completed_at?: string | null;
  readonly meter_reading?: string | null;
  readonly observation?: string | null;
  readonly evidence_photo_url?: string | null;
  readonly completed_stops_count: number;
  readonly total_stops: number;
  readonly is_assignment_completed: boolean;
}

/**
 * Carga útil recibida cuando toda la asignación concluye exitosamente
 */
export interface RawAssignmentCompletedPayload {
  readonly assignment_id: string;
  readonly completed_at: string;
  readonly total_stops: number;
  readonly completed_stops: number;
}

/**
 * Entidad de dominio pura para representar la ubicación del técnico en el mapa
 */
export interface TechnicianLocation {
  readonly latitude: number;
  readonly longitude: number;
  readonly heading?: number | null;
  readonly speed?: number | null;
  readonly timestamp: string;
}

/**
 * Evento de dominio de actualización de parada
 */
export interface StopStatusUpdatedEvent {
  readonly stopId: string;
  readonly orderIndex: number;
  readonly status: AssignmentStopStatus;
  readonly inTransitAt: Date | null;
  readonly arrivedAt: Date | null;
  readonly completedAt: Date | null;
  readonly meterReading: string | null;
  readonly observation: string | null;
  readonly evidencePhotoUrl: string | null;
  readonly completedStopsCount: number;
  readonly totalStops: number;
  readonly isAssignmentCompleted: boolean;
}

/**
 * Evento de dominio de asignación concluida
 */
export interface AssignmentCompletedEvent {
  readonly assignmentId: string;
  readonly completedAt: Date;
  readonly totalStops: number;
  readonly completedStops: number;
}

/**
 * Estado general del hook de seguimiento en tiempo real
 */
export interface RealtimeTrackingState {
  readonly connectionStatus: RealtimeConnectionStatus;
  readonly lastHeartbeat: Date | null;
  readonly technicianLocation: TechnicianLocation | null;
  readonly isCompleted: boolean;
}
