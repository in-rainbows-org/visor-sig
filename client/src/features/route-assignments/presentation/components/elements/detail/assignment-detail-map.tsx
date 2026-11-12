"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CircleAlert } from "lucide-react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";
import type {
  AssignmentDetailStatus,
  AssignmentStopDetail,
} from "@/features/route-assignments/domain/entities/assignment-detail.entity";
import type { TechnicianLocation } from "@/features/route-assignments/domain/entities/realtime-tracking.entity";
import type { TrackingSignal } from "@/features/route-assignments/domain/entities/vehicle-motion.entity";
import { cn } from "@/lib/utils";
import { routeAssignmentRepository } from "@/features/route-assignments/infrastructure/repositories/route-assignment.repository-impl";
import { RouteCreationZoomControls } from "../create/route-creation-zoom-controls";
import {
  getDetailStartingPinIcon,
  getDetailStopPinIcon,
  getTechnicianVehicleIcon,
} from "./assignment-detail-markers";
import { AssignmentRouteProgress } from "./assignment-route-progress";

const SANTA_CRUZ_DEFAULT_CENTER: [number, number] = [-17.7833, -63.1821];
const SANTA_CRUZ_DEFAULT_ZOOM = 13;

type MapControllerProps = {
  allCoordinates: [number, number][];
  selectedStop: AssignmentStopDetail | null;
  isStartingPointSelected?: boolean;
  startLatitude?: number;
  startLongitude?: number;
  onRegisterZoom: (zoomIn: () => void, zoomOut: () => void) => void;
};

/**
 * Calcula un centro geográfico compensado en píxeles para que el elemento enfocado
 * aparezca en la parte visible a la derecha de la tarjeta flotante (sin quedar tapado).
 */
function getOffsetCenter(
  map: L.Map,
  lat: number,
  lng: number,
  targetZoom: number,
  pixelOffsetX: number,
  pixelOffsetY: number = 0
): [number, number] {
  if (pixelOffsetX === 0 && pixelOffsetY === 0) return [lat, lng];
  const point = map.project([lat, lng], targetZoom);
  const offsetPoint = L.point(point.x - pixelOffsetX, point.y + pixelOffsetY);
  const unprojected = map.unproject(offsetPoint, targetZoom);
  return [unprojected.lat, unprojected.lng];
}

function MapController({
  allCoordinates,
  selectedStop,
  isStartingPointSelected,
  startLatitude,
  startLongitude,
  onRegisterZoom,
}: MapControllerProps) {
  const map = useMap();
  const hasFittedRef = useRef(false);

  // Invalida tamaño en montaje para erradicar tiles grises en Next.js
  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [map]);

  useEffect(() => {
    onRegisterZoom(
      () => map.zoomIn(),
      () => map.zoomOut()
    );
  }, [map, onRegisterZoom]);

  // Auto-encuadre inicial: alineado hacia la derecha para despejar la tarjeta izquierda (+10% zoom más cerca)
  useEffect(() => {
    if (!allCoordinates || allCoordinates.length === 0 || hasFittedRef.current) return;

    try {
      const bounds = L.latLngBounds(allCoordinates);
      const isDesktop = typeof window !== "undefined" && window.innerWidth >= 1024;
      // 530px a la izquierda reserva el espacio de la tarjeta lateral y da un encuadre 10% más cercano
      const paddingLeft = isDesktop ? 530 : 40;

      map.fitBounds(bounds, {
        paddingTopLeft: [paddingLeft, 44],
        paddingBottomRight: [44, 44],
        animate: true,
        maxZoom: 16.0,
      });

      hasFittedRef.current = true;
    } catch {
      // Ignorar si las coordenadas no forman un bounding box válido
    }
  }, [allCoordinates, map]);

  // Enfocar punto de partida cuando es seleccionado con compensación lateral (desktop) o vertical (móvil)
  useEffect(() => {
    if (!isStartingPointSelected || !startLatitude || !startLongitude) return;

    const isDesktop = typeof window !== "undefined" && window.innerWidth >= 1024;
    const pixelOffsetX = isDesktop ? 240 : 0;
    const mapHeight =
      map.getSize()?.y || (typeof window !== "undefined" ? window.innerHeight : 600);
    const pixelOffsetY = isDesktop ? 0 : Math.round(mapHeight * 0.20);
    const targetZoom = 17;

    try {
      const center = getOffsetCenter(
        map,
        startLatitude,
        startLongitude,
        targetZoom,
        pixelOffsetX,
        pixelOffsetY
      );
      map.flyTo(center, targetZoom, {
        animate: true,
        duration: 0.8,
      });
    } catch {
      map.flyTo([startLatitude, startLongitude], targetZoom, {
        animate: true,
        duration: 0.8,
      });
    }
  }, [isStartingPointSelected, startLatitude, startLongitude, map]);

  // Enfocar parada seleccionada al hacer clic con compensación lateral en escritorio
  // o compensación 20% hacia arriba en móviles para no quedar tapada por el card inferior
  useEffect(() => {
    if (!selectedStop?.latitude || !selectedStop?.longitude) return;

    const isDesktop = typeof window !== "undefined" && window.innerWidth >= 1024;
    const pixelOffsetX = isDesktop ? 240 : 0;
    const mapHeight =
      map.getSize()?.y || (typeof window !== "undefined" ? window.innerHeight : 600);
    const pixelOffsetY = isDesktop ? 0 : Math.round(mapHeight * 0.20);
    const targetZoom = 17;

    try {
      const center = getOffsetCenter(
        map,
        selectedStop.latitude,
        selectedStop.longitude,
        targetZoom,
        pixelOffsetX,
        pixelOffsetY
      );
      map.flyTo(center, targetZoom, {
        animate: true,
        duration: 0.8,
      });
    } catch {
      map.flyTo([selectedStop.latitude, selectedStop.longitude], targetZoom, {
        animate: true,
        duration: 0.8,
      });
    }
  }, [selectedStop, map]);

  return null;
}

/**
 * Subcomponente de polilínea animada con avance progresivo y silueta vial
 * Idéntico al renderizado de cálculo de rutas en route-creation-map.tsx
 */
function AnimatedRoutePolyline({
  coordinates,
  isInTransit = false,
}: {
  coordinates: [number, number][];
  isInTransit?: boolean;
}) {
  const [animatedCoords, setAnimatedCoords] = useState<[number, number][]>([]);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!coordinates || coordinates.length < 2) {
      animFrameRef.current = requestAnimationFrame(() => {
        setAnimatedCoords(coordinates || []);
      });
      return () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      };
    }

    startTimeRef.current = null;
    const totalPoints = coordinates.length;
    const durationMs = Math.min(2500, Math.max(1650, totalPoints * 17));

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
        setAnimatedCoords([coordinates[0], coordinates[0]]);
        animFrameRef.current = requestAnimationFrame(animate);
        return;
      }
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(1, elapsed / durationMs);

      const ease =
        progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      const floatIndex = ease * (totalPoints - 1);
      const baseIndex = Math.floor(floatIndex);
      const fraction = floatIndex - baseIndex;

      if (baseIndex >= totalPoints - 1) {
        setAnimatedCoords(coordinates);
        return;
      }

      const p1 = coordinates[baseIndex];
      const p2 = coordinates[baseIndex + 1];

      const currentHead: [number, number] = [
        p1[0] + (p2[0] - p1[0]) * fraction,
        p1[1] + (p2[1] - p1[1]) * fraction,
      ];

      const currentSegment = [...coordinates.slice(0, baseIndex + 1), currentHead];
      setAnimatedCoords(currentSegment);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [coordinates]);

  if (!coordinates || coordinates.length < 2) return null;

  // Morado vibrante (#9333ea / #7c3aed) para ruta en curso IN_TRANSIT, azul corporativo (#0e4dcb) para pendientes
  const glowColor = isInTransit ? "#7c3aed" : "#0e4dcb";
  const mainColor = isInTransit ? "#9333ea" : "#0e4dcb";
  const glowWeight = isInTransit ? 8 : 4;
  const mainWeight = isInTransit ? 6 : 4.5;
  const glowOpacity = isInTransit ? 0.35 : 0.18;
  const mainOpacity = isInTransit ? 1.0 : 0.85;

  return (
    <>
      {/* 1. Silueta tenue de fondo para mostrar el corredor vial completo */}
      <Polyline
        positions={coordinates}
        pathOptions={{
          color: glowColor,
          weight: glowWeight,
          opacity: glowOpacity,
          lineCap: "round",
          lineJoin: "round",
        }}
      />
      {/* 2. Trazado vial activo en avance progresivo */}
      {animatedCoords.length >= 2 && (
        <Polyline
          positions={animatedCoords}
          pathOptions={{
            color: mainColor,
            weight: mainWeight,
            opacity: mainOpacity,
            lineCap: "round",
            lineJoin: "round",
          }}
        />
      )}
    </>
  );
}

type RouteLegSegment = {
  key: string;
  coordinates: [number, number][];
  isInTransit: boolean;
};

export type AssignmentDetailMapProps = {
  assignmentId: string;
  assignmentStatus?: AssignmentDetailStatus;
  startLatitude: number;
  startLongitude: number;
  stops: readonly AssignmentStopDetail[];
  selectedStop: AssignmentStopDetail | null;
  technicianLocation?: TechnicianLocation | null;
  isStartingPointSelected?: boolean;
  hideZoomControls?: boolean;
  onSelectStop?: (stop: AssignmentStopDetail) => void;
  onSelectStartingPoint?: () => void;
  className?: string;
};

export function AssignmentDetailMap({
  assignmentId,
  assignmentStatus,
  startLatitude,
  startLongitude,
  stops,
  selectedStop,
  technicianLocation,
  isStartingPointSelected = false,
  hideZoomControls = false,
  onSelectStop,
  onSelectStartingPoint,
  className = "w-full h-full",
}: AssignmentDetailMapProps) {
  const zoomInRef = useRef<() => void>(() => {});
  const zoomOutRef = useRef<() => void>(() => {});
  const [trackingSignalState, setTrackingSignalState] = useState<{
    assignmentId: string;
    signal: TrackingSignal;
  }>({ assignmentId, signal: "waiting" });
  const trackingSignal = trackingSignalState.assignmentId === assignmentId
    ? trackingSignalState.signal
    : "waiting";

  const handleTrackingSignal = useCallback((signal: TrackingSignal) => {
    setTrackingSignalState({ assignmentId, signal });
  }, [assignmentId]);

  const handleRegisterZoom = (zIn: () => void, zOut: () => void) => {
    zoomInRef.current = zIn;
    zoomOutRef.current = zOut;
  };

  // 1. Trazados viales visibles según el estado de la asignación y de cada parada:
  // - Si assignmentStatus === "IN_PROGRESS": únicamente paradas con status "PENDING" o "IN_TRANSIT"
  //   muestran su trazado geométrico. Paradas con "COMPLETED", "FAILED" o "ARRIVED" no muestran ruta.
  // - Si assignmentStatus !== "IN_PROGRESS" (ej. "ASSIGNED", etc.): se muestran todas las rutas.
  // - Si una parada está "IN_TRANSIT", su trazado se separa y se colorea de morado (#9333ea / #7c3aed),
  //   mientras que las paradas pendientes permanecen en azul corporativo (#0e4dcb).
  const routeSegments = useMemo<RouteLegSegment[]>(() => {
    const isAssignmentInProgress = assignmentStatus === "IN_PROGRESS";
    const segments: RouteLegSegment[] = [];

    const hasLegGeometries = stops.some(
      (s) => s.coordinates && s.coordinates.length > 0
    );

    if (!hasLegGeometries) {
      return segments;
    }

    let currentSegment: [number, number][] = [];
    let currentIsInTransit: boolean | null = null;
    let currentKeyPrefix = "";

    const flushCurrentSegment = () => {
      if (currentSegment.length >= 2 && currentIsInTransit !== null) {
        segments.push({
          key: `${currentKeyPrefix}-${currentIsInTransit ? "transit" : "pending"}-${currentSegment.length}`,
          coordinates: currentSegment,
          isInTransit: currentIsInTransit,
        });
      }
      currentSegment = [];
      currentIsInTransit = null;
    };

    for (let i = 0; i < stops.length; i++) {
      const stop = stops[i];
      const shouldRenderRoute =
        !isAssignmentInProgress ||
        stop.status === "PENDING" ||
        stop.status === "IN_TRANSIT";

      if (shouldRenderRoute && stop.coordinates && stop.coordinates.length > 0) {
        const stopIsInTransit = stop.status === "IN_TRANSIT";

        if (stopIsInTransit) {
          flushCurrentSegment();
          if (stop.coordinates.length >= 2) {
            segments.push({
              key: `seg-${stop.id}-transit-${stop.coordinates.length}`,
              coordinates: [...stop.coordinates],
              isInTransit: true,
            });
          }
          continue;
        }

        // Si cambia el tipo de segmento (ej. de IN_TRANSIT a PENDING), volcamos el tramo anterior
        if (currentIsInTransit !== null && currentIsInTransit !== stopIsInTransit) {
          flushCurrentSegment();
        }

        if (currentSegment.length === 0) {
          currentSegment = [...stop.coordinates];
          currentIsInTransit = stopIsInTransit;
          currentKeyPrefix = `seg-${stop.id}`;
        } else {
          const lastPoint = currentSegment[currentSegment.length - 1];
          const firstNewPoint = stop.coordinates[0];
          const isSamePoint =
            Math.abs(lastPoint[0] - firstNewPoint[0]) < 1e-6 &&
            Math.abs(lastPoint[1] - firstNewPoint[1]) < 1e-6;

          const pointsToAdd = isSamePoint
            ? stop.coordinates.slice(1)
            : stop.coordinates;

          currentSegment.push(...pointsToAdd);
        }
      } else {
        flushCurrentSegment();
      }
    }

    flushCurrentSegment();

    return segments;
  }, [stops, assignmentStatus]);

  // 2. Fallback resiliente: si las paradas no tenían geometrías viales guardadas,
  // calcular la ruta vial con OSRM para no trazar líneas rectas que crucen cuadras
  const [clientRouteCoords, setClientRouteCoords] = useState<[number, number][]>([]);

  useEffect(() => {
    if (routeSegments.length > 0) return;
    if (!startLatitude || !startLongitude || stops.length === 0) return;

    const targetStops =
      assignmentStatus === "IN_PROGRESS"
        ? stops.filter((s) => s.status === "PENDING" || s.status === "IN_TRANSIT")
        : stops;

    if (targetStops.length === 0) {
      return;
    }

    let isMounted = true;
    routeAssignmentRepository
      .calculateRoute({
        startLatitude,
        startLongitude,
        optimizeWaypointOrder: false,
        waypoints: targetStops.map((s) => ({
          codigoFijoId: s.codigoFijoId,
          latitude: s.latitude,
          longitude: s.longitude,
        })),
      })
      .then((res) => {
        if (isMounted && res.ok && res.data?.coordinates) {
          setClientRouteCoords(res.data.coordinates);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [routeSegments.length, startLatitude, startLongitude, stops, assignmentStatus]);

  const activeSegments = useMemo<RouteLegSegment[]>(() => {
    if (routeSegments.length > 0) {
      // Ordenar para que el segmento IN_TRANSIT quede al final y Leaflet lo dibuje encima del resto
      return [...routeSegments].sort((a, b) => {
        if (a.isInTransit && !b.isInTransit) return 1;
        if (!a.isInTransit && b.isInTransit) return -1;
        return 0;
      });
    }
    if (clientRouteCoords.length >= 2) {
      const hasInTransit = stops.some((s) => s.status === "IN_TRANSIT");
      return [
        {
          key: `fallback-osrm-${hasInTransit ? "in-transit" : "normal"}`,
          coordinates: clientRouteCoords,
          isInTransit: hasInTransit,
        },
      ];
    }
    return [];
  }, [routeSegments, clientRouteCoords, stops]);

  const activeTransitStop = useMemo(
    () => assignmentStatus === "IN_PROGRESS"
      ? [...stops]
        .filter((stop) => stop.status === "IN_TRANSIT")
        .sort((first, second) => first.orderIndex - second.orderIndex)[0] ?? null
      : null,
    [assignmentStatus, stops]
  );

  const allCoordinates = useMemo(() => {
    const list: [number, number][] = [];
    if (startLatitude && startLongitude) {
      list.push([startLatitude, startLongitude]);
    }
    stops.forEach((stop) => {
      if (stop.latitude && stop.longitude) {
        list.push([stop.latitude, stop.longitude]);
      }
    });
    activeSegments.forEach((segment) => {
      segment.coordinates.forEach((pt) => list.push(pt));
    });
    return list;
  }, [activeSegments, startLatitude, startLongitude, stops]);

  const center: [number, number] = useMemo(() => {
    if (startLatitude && startLongitude) {
      return [startLatitude, startLongitude];
    }
    if (stops.length > 0 && stops[0].latitude && stops[0].longitude) {
      return [stops[0].latitude, stops[0].longitude];
    }
    return SANTA_CRUZ_DEFAULT_CENTER;
  }, [startLatitude, startLongitude, stops]);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <MapContainer
        center={center}
        zoom={SANTA_CRUZ_DEFAULT_ZOOM}
        className="w-full h-full z-0"
        zoomControl={false}
        attributionControl={false}
        preferCanvas={true}
        zoomSnap={0.25}
        zoomDelta={0.25}
      >
        {/* Capa Base Oficial: OpenStreetMap (idéntico a route-creation-map) */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          subdomains={["a", "b", "c"]}
          attribution="&copy; OpenStreetMap contributors"
        />

        <MapController
          allCoordinates={allCoordinates}
          selectedStop={selectedStop}
          isStartingPointSelected={isStartingPointSelected}
          startLatitude={startLatitude}
          startLongitude={startLongitude}
          onRegisterZoom={handleRegisterZoom}
        />

        {/* 1. Trazados Viales Animados con Avance Progresivo siguiendo calles reales (morado para IN_TRANSIT, azul para pendientes) */}
        {activeSegments.map((segment) => {
          const activeTransitKeyPrefix = activeTransitStop && activeTransitStop.coordinates.length >= 2
            ? `seg-${activeTransitStop.id}-transit-`
            : null;
          const isTrackedStopLeg = Boolean(
            activeTransitKeyPrefix && segment.isInTransit &&
            segment.key.startsWith(activeTransitKeyPrefix)
          );
          if (isTrackedStopLeg) return null;
          return (
            <AnimatedRoutePolyline
              key={segment.key}
              coordinates={segment.coordinates}
              isInTransit={segment.isInTransit}
            />
          );
        })}

        {assignmentStatus === "IN_PROGRESS" &&
          (technicianLocation || activeTransitStop) && (
            <AssignmentRouteProgress
              key={assignmentId}
              assignmentId={assignmentId}
              activeStopId={activeTransitStop?.id ?? null}
              activeStopOrderIndex={activeTransitStop?.orderIndex ?? null}
              routeCoordinates={activeTransitStop?.coordinates ?? null}
              technicianLocation={technicianLocation ?? null}
              onSignalChange={handleTrackingSignal}
            />
          )}

        {/* 2. Marcador del Punto de Partida interactivo */}
        {startLatitude && startLongitude && (
          <Marker
            position={[startLatitude, startLongitude]}
            icon={getDetailStartingPinIcon(isStartingPointSelected)}
            eventHandlers={{
              click: () => onSelectStartingPoint?.(),
            }}
          />
        )}

        {/* 3. Marcadores de las Paradas con iconos dinámicos según estado */}
        {stops.map((stop) => {
          if (!stop.latitude || !stop.longitude) return null;
          const isSelected = selectedStop?.id === stop.id;

          return (
            <Marker
              key={stop.id}
              position={[stop.latitude, stop.longitude]}
              icon={getDetailStopPinIcon(stop.orderIndex, stop.status, isSelected)}
              eventHandlers={{
                click: () => onSelectStop?.(stop),
              }}
            />
          );
        })}

        {/* 4. Marcador del Vehículo del Técnico en tiempo real */}
        {assignmentStatus !== "IN_PROGRESS" && technicianLocation &&
          typeof technicianLocation.latitude === "number" &&
          typeof technicianLocation.longitude === "number" && (
            <Marker
              position={[technicianLocation.latitude, technicianLocation.longitude]}
              icon={getTechnicianVehicleIcon(technicianLocation.heading)}
              zIndexOffset={1000}
            />
          )}
      </MapContainer>

      {assignmentStatus === "IN_PROGRESS" &&
        (trackingSignal === "stale" || trackingSignal === "off-route") && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none absolute top-3 left-1/2 z-[1000] flex -translate-x-1/2 items-center gap-2 rounded-full border border-amber-200 bg-white/95 px-3 py-2 text-xs font-medium text-amber-900 shadow-md backdrop-blur-sm"
        >
          <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
          <span>
            {trackingSignal === "stale"
              ? "Ubicación desactualizada"
              : "Ubicación fuera de la ruta planificada"}
          </span>
        </div>
      )}

      {/* Controles Flotantes de Zoom (+ y -): se ocultan automáticamente cuando el card inferior de parada está abierto */}
      <div
        className={cn(
          "absolute bottom-20 sm:bottom-24 lg:bottom-6 lg:right-6 right-4 z-[1000] transition-all duration-300 ease-out",
          selectedStop || hideZoomControls
            ? "opacity-0 pointer-events-none scale-90 translate-y-2"
            : "opacity-100 pointer-events-auto scale-100 translate-y-0"
        )}
      >
        <RouteCreationZoomControls
          onZoomIn={() => zoomInRef.current()}
          onZoomOut={() => zoomOutRef.current()}
        />
      </div>
    </div>
  );
}

export default AssignmentDetailMap;
