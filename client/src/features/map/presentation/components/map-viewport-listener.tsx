"use client";

import { useCallback, useEffect, useRef } from "react";
import { useMapEvents } from "react-leaflet";
import type { MapViewport } from "../../domain/models/map.types";

export type MapViewportListenerProps = {
  onViewportChange: (viewport: MapViewport) => void;
};

export function MapViewportListener({ onViewportChange }: MapViewportListenerProps) {
  const onViewportChangeRef = useRef(onViewportChange);
  useEffect(() => {
    onViewportChangeRef.current = onViewportChange;
  });

  const lastEmittedRef = useRef<MapViewport | null>(null);

  const emitViewport = useCallback(
    (mapInstance: typeof map) => {
      const bounds = mapInstance.getBounds();
      const zoom = mapInstance.getZoom();
      const next: MapViewport = {
        west: bounds.getWest(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        north: bounds.getNorth(),
        zoom,
      };

      const prev = lastEmittedRef.current;
      if (
        prev &&
        prev.zoom === next.zoom &&
        Math.abs(prev.west - next.west) < 1e-6 &&
        Math.abs(prev.south - next.south) < 1e-6 &&
        Math.abs(prev.east - next.east) < 1e-6 &&
        Math.abs(prev.north - next.north) < 1e-6
      ) {
        return;
      }

      lastEmittedRef.current = next;
      onViewportChangeRef.current(next);
    },
    []
  );

  const map = useMapEvents({
    moveend: () => {
      emitViewport(map);
    },
    zoomend: () => {
      emitViewport(map);
    },
  });

  // Notificar viewport inicial y forzar cálculo de dimensiones tras montar el mapa
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    emitViewport(map);

    return () => clearTimeout(timer);
  }, [map, emitViewport]);

  return null;
}
