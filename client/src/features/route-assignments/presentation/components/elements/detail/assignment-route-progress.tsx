"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { Marker, Polyline } from "react-leaflet";
import type { TechnicianLocation } from "../../../../domain/entities/realtime-tracking.entity";
import type {
  GeographicCoordinate,
  MutableCoordinate,
  TrackingSignal,
} from "../../../../domain/entities/vehicle-motion.entity";
import { getTechnicianVehicleIcon } from "./assignment-detail-markers";
import { useAnimatedTechnicianLocation } from "../../../hooks/use-animated-technician-location";

type AssignmentRouteProgressProps = {
  assignmentId: string;
  activeStopId: string | null;
  activeStopOrderIndex: number | null;
  routeCoordinates: readonly GeographicCoordinate[] | null;
  technicianLocation: TechnicianLocation | null;
  onSignalChange: (signal: TrackingSignal) => void;
};

/**
 * Capa visual única del seguimiento: Leaflet recibe cambios imperativos en el
 * marcador y en la línea, sin reconciliar React en cada fotograma.
 */
export function AssignmentRouteProgress({
  assignmentId,
  activeStopId,
  activeStopOrderIndex,
  routeCoordinates,
  technicianLocation,
  onSignalChange,
}: AssignmentRouteProgressProps) {
  const markerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const initialCoordinateFrameRef = useRef<number | null>(null);
  const [initialCoordinate, setInitialCoordinate] = useState<MutableCoordinate | null>(() =>
    technicianLocation
      ? [technicianLocation.latitude, technicianLocation.longitude]
      : null
  );
  const [initialHeading, setInitialHeading] = useState(technicianLocation?.heading ?? 0);
  const markerIcon = useMemo(() => getTechnicianVehicleIcon(initialHeading, false), [initialHeading]);
  const handleInitialCoordinate = useCallback((coordinate: MutableCoordinate, heading: number) => {
    if (initialCoordinateFrameRef.current != null) {
      cancelAnimationFrame(initialCoordinateFrameRef.current);
    }
    initialCoordinateFrameRef.current = requestAnimationFrame(() => {
      initialCoordinateFrameRef.current = null;
      setInitialCoordinate(coordinate);
      setInitialHeading(heading);
    });
  }, []);
  const routePositions = useMemo<L.LatLngTuple[]>(() =>
    (routeCoordinates ?? []).map(([latitude, longitude]) => [latitude, longitude]),
  [routeCoordinates]);

  useAnimatedTechnicianLocation({
    assignmentId,
    enabled: true,
    activeStopId,
    activeStopOrderIndex,
    routeCoordinates,
    technicianLocation,
    markerRef,
    routePolylineRef,
    onInitialCoordinate: handleInitialCoordinate,
    onSignalChange,
  });

  useEffect(() => () => {
    if (initialCoordinateFrameRef.current != null) {
      cancelAnimationFrame(initialCoordinateFrameRef.current);
      initialCoordinateFrameRef.current = null;
    }
  }, []);

  return (
    <>
      {routePositions.length >= 2 && (
        <Polyline
          ref={routePolylineRef}
          positions={routePositions}
          pathOptions={{
            color: "#9333ea",
            weight: 6,
            opacity: 0.95,
            lineCap: "round",
            lineJoin: "round",
          }}
        />
      )}
      {initialCoordinate && (
        <Marker
          ref={markerRef}
          position={initialCoordinate}
          icon={markerIcon}
          zIndexOffset={1000}
        />
      )}
    </>
  );
}
