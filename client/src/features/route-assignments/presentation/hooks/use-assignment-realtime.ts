"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "@/features/shared/config/api.config";
import type {
  AssignmentCompletedEvent,
  RawAssignmentCompletedPayload,
  RawAssignmentRealtimeEnvelope,
  RawStopStatusUpdatedPayload,
  RawTechnicianLocationPayload,
  RealtimeConnectionStatus,
  StopStatusUpdatedEvent,
  TechnicianLocation,
} from "../../domain/entities/realtime-tracking.entity";
import type { AssignmentStopStatus } from "../../domain/entities/assignment-detail.entity";

export interface UseAssignmentRealtimeOptions {
  assignmentId: string;
  assignmentStatus?: string | null;
  role?: "ADMIN" | "TECHNICIAN";
  enabled?: boolean;
  onLocationUpdated?: (location: TechnicianLocation) => void;
  onStopStatusUpdated?: (event: StopStatusUpdatedEvent) => void;
  onAssignmentCompleted?: (event: AssignmentCompletedEvent) => void;
}

export interface UseAssignmentRealtimeResult {
  connectionStatus: RealtimeConnectionStatus;
  technicianLocation: TechnicianLocation | null;
  isCompleted: boolean;
  sendLocationPing: (location: {
    latitude: number;
    longitude: number;
    heading?: number | null;
    speed?: number | null;
  }) => void;
}

/**
 * Resuelve la URL absoluta del WebSocket a partir de la configuración del sistema
 */
function resolveWebSocketUrl(assignmentId: string, role: string): string {
  let base = API_BASE_URL;
  if (!base || base.startsWith("/")) {
    if (typeof window !== "undefined") {
      const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
      base = `${proto}//${window.location.host}`;
    } else {
      base = "ws://localhost:8000";
    }
  } else {
    base = base.replace(/^http:/, "ws:").replace(/^https:/, "wss:");
  }
  base = base.replace(/\/+$/, "");
  return `${base}/api/route-assignments/assignments/${assignmentId}/ws?role=${encodeURIComponent(role)}`;
}

export function useAssignmentRealtime({
  assignmentId,
  assignmentStatus,
  role = "ADMIN",
  enabled = true,
  onLocationUpdated,
  onStopStatusUpdated,
  onAssignmentCompleted,
}: UseAssignmentRealtimeOptions): UseAssignmentRealtimeResult {
  const [connectionStatus, setConnectionStatus] = useState<RealtimeConnectionStatus>("DISCONNECTED");
  const [technicianLocation, setTechnicianLocation] = useState<TechnicianLocation | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectDelayRef = useRef<number>(1000);
  const isManuallyClosedRef = useRef<boolean>(false);
  const geoWatchIdRef = useRef<number | null>(null);
  const geoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastLocationEmitTimeRef = useRef<number>(0);

  // Mantener referencias estables para callbacks y evitar reconexiones cíclicas
  const callbacksRef = useRef({
    onLocationUpdated,
    onStopStatusUpdated,
    onAssignmentCompleted,
  });
  useEffect(() => {
    callbacksRef.current = {
      onLocationUpdated,
      onStopStatusUpdated,
      onAssignmentCompleted,
    };
  }, [onLocationUpdated, onStopStatusUpdated, onAssignmentCompleted]);

  const sendLocationPing = useCallback(
    (loc: {
      latitude: number;
      longitude: number;
      heading?: number | null;
      speed?: number | null;
    }) => {
      const now = Date.now();
      // Regular la emisión a máximo 1 ping cada 3.5 segundos para no saturar
      if (now - lastLocationEmitTimeRef.current < 3500) {
        return;
      }
      lastLocationEmitTimeRef.current = now;

      const techLoc: TechnicianLocation = {
        latitude: loc.latitude,
        longitude: loc.longitude,
        heading: loc.heading ?? null,
        speed: loc.speed ?? null,
        timestamp: new Date().toISOString(),
      };

      // Actualizar posición localmente de inmediato para fluidez del técnico
      setTechnicianLocation(techLoc);
      callbacksRef.current.onLocationUpdated?.(techLoc);

      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        const pingMessage = {
          type: "LOCATION_PING",
          payload: {
            latitude: loc.latitude,
            longitude: loc.longitude,
            heading: loc.heading ?? null,
            speed: loc.speed ?? null,
            timestamp: techLoc.timestamp,
          },
        };
        try {
          socketRef.current.send(JSON.stringify(pingMessage));
        } catch (err) {
          console.warn("[RealtimeWS] Error al enviar LOCATION_PING:", err);
        }
      }
    },
    []
  );

  useEffect(() => {
    // Solo conectarse si está habilitado, la asignación está en progreso y estamos en el navegador
    const isEligible =
      enabled &&
      assignmentStatus === "IN_PROGRESS" &&
      !isCompleted &&
      Boolean(assignmentId) &&
      typeof window !== "undefined";

    if (!isEligible) {
      if (socketRef.current) {
        isManuallyClosedRef.current = true;
        socketRef.current.close(1000, "Not in progress or disabled");
        socketRef.current = null;
      }
      setConnectionStatus("DISCONNECTED");
      return;
    }

    isManuallyClosedRef.current = false;

    const connect = () => {
      if (isManuallyClosedRef.current) return;

      const url = resolveWebSocketUrl(assignmentId, role);
      setConnectionStatus((prev) => (prev === "DISCONNECTED" ? "CONNECTING" : "RECONNECTING"));

      try {
        const ws = new WebSocket(url);
        socketRef.current = ws;

        ws.onopen = () => {
          if (socketRef.current !== ws) return;
          setConnectionStatus("CONNECTED");
          reconnectDelayRef.current = 1000; // Resetear backoff
        };

        ws.onmessage = (event) => {
          try {
            const data: RawAssignmentRealtimeEnvelope = JSON.parse(event.data);

            if (data.type === "CONNECTION_ACK") {
              // Conexión ratificada por el servidor
            } else if (data.type === "TECHNICIAN_LOCATION") {
              const payload = data.payload as RawTechnicianLocationPayload;
              if (payload && typeof payload.latitude === "number" && typeof payload.longitude === "number") {
                const loc: TechnicianLocation = {
                  latitude: payload.latitude,
                  longitude: payload.longitude,
                  heading: payload.heading ?? null,
                  speed: payload.speed ?? null,
                  timestamp: payload.timestamp || data.timestamp,
                };
                setTechnicianLocation(loc);
                callbacksRef.current.onLocationUpdated?.(loc);
              }
            } else if (data.type === "STOP_STATUS_UPDATED") {
              const p = data.payload as RawStopStatusUpdatedPayload;
              if (p) {
                const stopEvent: StopStatusUpdatedEvent = {
                  stopId: p.stop_id,
                  orderIndex: p.order_index,
                  status: p.status as AssignmentStopStatus,
                  inTransitAt: p.in_transit_at ? new Date(p.in_transit_at) : null,
                  arrivedAt: p.arrived_at ? new Date(p.arrived_at) : null,
                  completedAt: p.completed_at ? new Date(p.completed_at) : null,
                  meterReading: p.meter_reading ?? null,
                  observation: p.observation ?? null,
                  completedStopsCount: p.completed_stops_count,
                  totalStops: p.total_stops,
                  isAssignmentCompleted: Boolean(p.is_assignment_completed),
                };
                callbacksRef.current.onStopStatusUpdated?.(stopEvent);

                if (stopEvent.isAssignmentCompleted) {
                  setIsCompleted(true);
                  if (socketRef.current) {
                    isManuallyClosedRef.current = true;
                    socketRef.current.close(1000, "Assignment completed");
                  }
                  setConnectionStatus("DISCONNECTED");
                }
              }
            } else if (data.type === "ASSIGNMENT_COMPLETED") {
              const p = data.payload as RawAssignmentCompletedPayload;
              setIsCompleted(true);
              if (p) {
                const completedEvt: AssignmentCompletedEvent = {
                  assignmentId: p.assignment_id || assignmentId,
                  completedAt: p.completed_at ? new Date(p.completed_at) : new Date(),
                  totalStops: p.total_stops,
                  completedStops: p.completed_stops,
                };
                callbacksRef.current.onAssignmentCompleted?.(completedEvt);
              }
              if (socketRef.current) {
                isManuallyClosedRef.current = true;
                socketRef.current.close(1000, "Assignment completed");
              }
              setConnectionStatus("DISCONNECTED");
            }
          } catch (err) {
            console.warn("[RealtimeWS] Error al procesar mensaje entrante:", err);
          }
        };

        ws.onerror = (err) => {
          console.debug("[RealtimeWS] Evento de error en WebSocket:", err);
        };

        ws.onclose = (event) => {
          if (socketRef.current !== ws) return;
          socketRef.current = null;

          if (isManuallyClosedRef.current || event.code === 1000 || event.code === 1008) {
            setConnectionStatus("DISCONNECTED");
            return;
          }

          // Retroceso exponencial entre 1s y 10s
          const nextDelay = reconnectDelayRef.current;
          reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 1.5, 10000);

          setConnectionStatus("RECONNECTING");
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, nextDelay);
        };
      } catch (err) {
        console.warn("[RealtimeWS] Error al instanciar WebSocket:", err);
        setConnectionStatus("DISCONNECTED");
      }
    };

    connect();

    // Si el rol es TECHNICIAN, activar muestreo de geolocalización cada ~5 segundos
    if (role === "TECHNICIAN" && typeof navigator !== "undefined" && "geolocation" in navigator) {
      const emitCurrentPos = () => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            sendLocationPing({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              heading: pos.coords.heading ?? null,
              speed: pos.coords.speed ?? null,
            });
          },
          (err) => {
            console.debug("[RealtimeWS] Lectura de geolocalización no disponible:", err.message);
          },
          {
            enableHighAccuracy: true,
            maximumAge: 4000,
            timeout: 5000,
          }
        );
      };

      // Disparar lectura inmediata
      emitCurrentPos();

      // Muestreo regulado cada 5 segundos
      geoIntervalRef.current = setInterval(emitCurrentPos, 5000);

      // Suscripción reactiva ante movimiento
      try {
        geoWatchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            sendLocationPing({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              heading: pos.coords.heading ?? null,
              speed: pos.coords.speed ?? null,
            });
          },
          () => {},
          {
            enableHighAccuracy: true,
            maximumAge: 4000,
            timeout: 5000,
          }
        );
      } catch {
        // Ignorar si el navegador no permite watchPosition
      }
    }

    return () => {
      isManuallyClosedRef.current = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (geoIntervalRef.current) {
        clearInterval(geoIntervalRef.current);
        geoIntervalRef.current = null;
      }
      if (geoWatchIdRef.current !== null && typeof navigator !== "undefined" && "geolocation" in navigator) {
        navigator.geolocation.clearWatch(geoWatchIdRef.current);
        geoWatchIdRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.close(1000, "Unmounting hook");
        socketRef.current = null;
      }
    };
  }, [assignmentId, assignmentStatus, role, enabled, isCompleted, sendLocationPing]);

  return {
    connectionStatus,
    technicianLocation,
    isCompleted,
    sendLocationPing,
  };
}
