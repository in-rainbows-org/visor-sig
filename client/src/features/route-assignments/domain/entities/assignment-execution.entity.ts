import type { AssignmentStopDetail } from "./assignment-detail.entity";

/**
 * Fases operativas derivadas para el card inteligente del técnico
 */
export type ActiveStopPhase =
  | "READY_FOR_NEXT"  // No hay parada activa; hay una siguiente parada pendiente disponible
  | "IN_TRANSIT"     // Parada activa en traslado (acciones: Navegar + Ya llegué)
  | "ARRIVED"        // Parada activa arribada en predio (acción: Finalizar)
  | "ALL_COMPLETED"; // 100% de paradas concluidas (mensaje de felicitación)

/**
 * Modelo de presentación para el card flotante inteligente
 */
export interface ActiveStopCardModel {
  readonly phase: ActiveStopPhase;
  readonly stop: AssignmentStopDetail | null;
  readonly orderIndex: number | null;
  readonly fixedCode: number | null;
  readonly clientName: string | null;
  readonly latitude: number | null;
  readonly longitude: number | null;
  readonly statusImage: string;
  readonly eyebrow: string;
  readonly actions: {
    readonly canStartTransit: boolean;
    readonly canNavigate: boolean;
    readonly canArrive: boolean;
    readonly canFinalize: boolean;
  };
}

/**
 * Pestañas de filtrado para el drawer de paradas
 */
export type StopsFilterOption = "PENDING" | "FAILED" | "COMPLETED";

/**
 * Selección de resultado de visita técnica
 */
export type StopCompletionChoice = "SUCCESS" | "FAILED";

/**
 * Payload de entrada para la conclusión de la parada
 */
export interface CompleteStopInput {
  readonly status: StopCompletionChoice;
  readonly observation?: string | null;
  readonly meterReading?: string | null;
}

/**
 * Función selectora pura para determinar la parada activa y la fase operativa
 */
export function deriveActiveStopState(
  stops: readonly AssignmentStopDetail[]
): ActiveStopCardModel {
  if (!stops || stops.length === 0) {
    return {
      phase: "ALL_COMPLETED",
      stop: null,
      orderIndex: null,
      fixedCode: null,
      clientName: null,
      latitude: null,
      longitude: null,
      statusImage: "/stop-status/completed.webp",
      eyebrow: "Asignación completada",
      actions: {
        canStartTransit: false,
        canNavigate: false,
        canArrive: false,
        canFinalize: false,
      },
    };
  }

  // 1. Buscar si existe alguna parada activa en tránsito o arribada
  const activeInTransit = stops.find((s) => s.status === "IN_TRANSIT");
  if (activeInTransit) {
    return {
      phase: "IN_TRANSIT",
      stop: activeInTransit,
      orderIndex: activeInTransit.orderIndex,
      fixedCode: activeInTransit.fixedCode,
      clientName: activeInTransit.name,
      latitude: activeInTransit.latitude,
      longitude: activeInTransit.longitude,
      statusImage: "/stop-status/in_transit.gif",
      eyebrow: "Parada en tránsito",
      actions: {
        canStartTransit: false,
        canNavigate: true,
        canArrive: true,
        canFinalize: false,
      },
    };
  }

  const activeArrived = stops.find((s) => s.status === "ARRIVED");
  if (activeArrived) {
    return {
      phase: "ARRIVED",
      stop: activeArrived,
      orderIndex: activeArrived.orderIndex,
      fixedCode: activeArrived.fixedCode,
      clientName: activeArrived.name,
      latitude: activeArrived.latitude,
      longitude: activeArrived.longitude,
      statusImage: "/stop-status/in_process.webp",
      eyebrow: "En el domicilio",
      actions: {
        canStartTransit: false,
        canNavigate: false,
        canArrive: false,
        canFinalize: true,
      },
    };
  }

  // 2. Si no hay paradas en curso, buscar la primera parada pendiente (orderIndex asc)
  const pendingStops = stops
    .filter((s) => s.status === "PENDING")
    .slice()
    .sort((a, b) => a.orderIndex - b.orderIndex);

  if (pendingStops.length > 0) {
    const nextStop = pendingStops[0];
    return {
      phase: "READY_FOR_NEXT",
      stop: nextStop,
      orderIndex: nextStop.orderIndex,
      fixedCode: nextStop.fixedCode,
      clientName: nextStop.name,
      latitude: nextStop.latitude,
      longitude: nextStop.longitude,
      statusImage: "/stop-status/pending.webp",
      eyebrow: "Siguiente parada",
      actions: {
        canStartTransit: true,
        canNavigate: false,
        canArrive: false,
        canFinalize: false,
      },
    };
  }

  // 3. Si no hay pendientes, ni en tránsito, ni arribadas -> Asignación completada
  return {
    phase: "ALL_COMPLETED",
    stop: null,
    orderIndex: null,
    fixedCode: null,
    clientName: null,
    latitude: null,
    longitude: null,
    statusImage: "/stop-status/completed.webp",
    eyebrow: "Asignación completada exitosamente",
    actions: {
      canStartTransit: false,
      canNavigate: false,
      canArrive: false,
      canFinalize: false,
    },
  };
}
