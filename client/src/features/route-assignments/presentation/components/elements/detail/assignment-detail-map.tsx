"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
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
import { routeAssignmentRepository } from "@/features/route-assignments/infrastructure/repositories/route-assignment.repository-impl";
import { RouteCreationZoomControls } from "../create/route-creation-zoom-controls";
import {
  getDetailStartingPinIcon,
  getDetailStopPinIcon,
} from "./assignment-detail-markers";

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
  pixelOffsetLeft: number
): [number, number] {
  if (pixelOffsetLeft === 0) return [lat, lng];
  const point = map.project([lat, lng], targetZoom);
  const offsetPoint = L.point(point.x - pixelOffsetLeft, point.y);
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

  // Enfocar punto de partida cuando es seleccionado con compensación lateral hacia la derecha
  useEffect(() => {
    if (!isStartingPointSelected || !startLatitude || !startLongitude) return;

    const isDesktop = typeof window !== "undefined" && window.innerWidth >= 1024;
    const pixelOffset = isDesktop ? 240 : 0;
    const targetZoom = 17;

    try {
      const center = getOffsetCenter(
        map,
        startLatitude,
        startLongitude,
        targetZoom,
        pixelOffset
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

  // Enfocar parada seleccionada al hacer clic con compensación lateral hacia la derecha
  useEffect(() => {
    if (!selectedStop?.latitude || !selectedStop?.longitude) return;

    const isDesktop = typeof window !== "undefined" && window.innerWidth >= 1024;
    const pixelOffset = isDesktop ? 240 : 0;
    const targetZoom = 17;

    try {
      const center = getOffsetCenter(
        map,
        selectedStop.latitude,
        selectedStop.longitude,
        targetZoom,
        pixelOffset
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
}: {
  coordinates: [number, number][];
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

  return (
    <>
      {/* 1. Silueta tenue de fondo para mostrar el corredor vial completo */}
      <Polyline
        positions={coordinates}
        pathOptions={{
          color: "#0e4dcb",
          weight: 4,
          opacity: 0.18,
          lineCap: "round",
          lineJoin: "round",
        }}
      />
      {/* 2. Trazado vial activo en avance progresivo con azul vibrante */}
      {animatedCoords.length >= 2 && (
        <Polyline
          positions={animatedCoords}
          pathOptions={{
            color: "#0e4dcb",
            weight: 5,
            opacity: 0.9,
            lineCap: "round",
            lineJoin: "round",
          }}
        />
      )}
    </>
  );
}

export type AssignmentDetailMapProps = {
  assignmentStatus?: AssignmentDetailStatus;
  startLatitude: number;
  startLongitude: number;
  stops: readonly AssignmentStopDetail[];
  selectedStop: AssignmentStopDetail | null;
  isStartingPointSelected?: boolean;
  onSelectStop?: (stop: AssignmentStopDetail) => void;
  onSelectStartingPoint?: () => void;
  className?: string;
};

export function AssignmentDetailMap({
  assignmentStatus,
  startLatitude,
  startLongitude,
  stops,
  selectedStop,
  isStartingPointSelected = false,
  onSelectStop,
  onSelectStartingPoint,
  className = "w-full h-full",
}: AssignmentDetailMapProps) {
  const zoomInRef = useRef<() => void>(() => {});
  const zoomOutRef = useRef<() => void>(() => {});

  const handleRegisterZoom = (zIn: () => void, zOut: () => void) => {
    zoomInRef.current = zIn;
    zoomOutRef.current = zOut;
  };

  // 1. Trazados viales visibles según el estado de la asignación y de cada parada:
  // - Si assignmentStatus === "IN_PROGRESS": únicamente paradas con status "PENDING" o "IN_TRANSIT"
  //   muestran su trazado geométrico. Paradas con "COMPLETED", "FAILED" o "ARRIVED" no muestran ruta.
  // - Si assignmentStatus !== "IN_PROGRESS" (ej. "ASSIGNED", etc.): se muestran todas las rutas.
  // Agrupamos tramos contiguos para evitar unir saltos discontinuos con líneas rectas erróneas.
  const routeSegments = useMemo(() => {
    const isAssignmentInProgress = assignmentStatus === "IN_PROGRESS";
    const segments: [number, number][][] = [];
    let currentSegment: [number, number][] = [];

    const hasLegGeometries = stops.some(
      (s) => s.coordinates && s.coordinates.length > 0
    );

    if (!hasLegGeometries) {
      return segments;
    }

    for (let i = 0; i < stops.length; i++) {
      const stop = stops[i];
      const shouldRenderRoute =
        !isAssignmentInProgress ||
        stop.status === "PENDING" ||
        stop.status === "IN_TRANSIT";

      if (shouldRenderRoute && stop.coordinates && stop.coordinates.length > 0) {
        if (currentSegment.length === 0) {
          currentSegment = [...stop.coordinates];
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
        if (currentSegment.length >= 2) {
          segments.push(currentSegment);
        }
        currentSegment = [];
      }
    }

    if (currentSegment.length >= 2) {
      segments.push(currentSegment);
    }

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

  const activeSegments = useMemo<[number, number][][]>(() => {
    if (routeSegments.length > 0) {
      return routeSegments;
    }
    if (clientRouteCoords.length >= 2) {
      return [clientRouteCoords];
    }
    return [];
  }, [routeSegments, clientRouteCoords]);

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
      segment.forEach((pt) => list.push(pt));
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

        {/* 1. Trazados Viales Animados con Avance Progresivo siguiendo calles reales */}
        {activeSegments.map((segment, idx) => (
          <AnimatedRoutePolyline
            key={`route-seg-${idx}-${segment.length}`}
            coordinates={segment}
          />
        ))}

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
      </MapContainer>

      {/* Controles Flotantes de Zoom (+ y -) idénticos al mapa de nueva asignación */}
      <div className="absolute bottom-20 sm:bottom-24 lg:bottom-6 lg:right-6 right-4 z-[1000] pointer-events-auto">
        <RouteCreationZoomControls
          onZoomIn={() => zoomInRef.current()}
          onZoomOut={() => zoomOutRef.current()}
        />
      </div>
    </div>
  );
}

export default AssignmentDetailMap;
