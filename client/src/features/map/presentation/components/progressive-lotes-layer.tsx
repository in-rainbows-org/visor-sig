"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { useMap } from "react-leaflet";
import type { LayerColor } from "@/features/layers/domain/entities/layer.entity";
import { LAYER_COLOR_MAP } from "@/features/layers/presentation/components/layer-theme-helper";
import type { MapGeoJsonFeature } from "../../domain/models/map.types";

export type ProgressiveLotesLayerProps = {
  features: MapGeoJsonFeature[];
  color?: LayerColor;
  versionId?: string | null;
  revision?: number;
};

function getLoteCentroid(feature: MapGeoJsonFeature): [number, number] {
  const coords = feature.geometry.coordinates;
  if (!Array.isArray(coords) || coords.length === 0) return [0, 0];

  // Identificar el primer anillo de coordenadas (Polygon o MultiPolygon)
  let ring: unknown = coords[0];
  if (Array.isArray(ring) && Array.isArray(ring[0]) && Array.isArray(ring[0][0])) {
    ring = ring[0]; // MultiPolygon
  }

  if (!Array.isArray(ring) || ring.length === 0) return [0, 0];

  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  for (const pt of ring) {
    if (Array.isArray(pt) && pt.length >= 2) {
      const lng = Number(pt[0]);
      const lat = Number(pt[1]);
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    }
  }

  if (minLat === Infinity) return [0, 0];

  return [(minLat + maxLat) / 2, (minLng + maxLng) / 2];
}

export function ProgressiveLotesLayer({
  features,
  color = "GREEN",
  versionId,
  revision = 0,
}: ProgressiveLotesLayerProps) {
  const map = useMap();
  const lotesLayerRef = useRef<L.GeoJSON | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isDraggingRef = useRef(false);
  const targetFeaturesRef = useRef<MapGeoJsonFeature[]>([]);
  const currentIndexRef = useRef(0);

  useEffect(() => {
    const hex = LAYER_COLOR_MAP[color]?.hex ?? "#059669";

    const lotesLayer = L.geoJSON(undefined, {
      style: () => ({
        color: hex,
        weight: 1.5,
        fillColor: hex,
        fillOpacity: 0.25,
        opacity: 0.9,
      }),
    }).addTo(map);

    lotesLayerRef.current = lotesLayer;

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (map.hasLayer(lotesLayer)) {
        map.removeLayer(lotesLayer);
      }
      lotesLayer.clearLayers();
    };
  }, [map, color]);

  useEffect(() => {
    const handleMoveStart = () => {
      isDraggingRef.current = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const handleMoveEnd = () => {
      isDraggingRef.current = false;
      // Reanudar renderizado de chunks pendientes si quedaron a medias durante el arrastre
      const lotesLayer = lotesLayerRef.current;
      if (
        lotesLayer &&
        currentIndexRef.current < targetFeaturesRef.current.length &&
        !timeoutRef.current
      ) {
        renderNextChunk();
      }
    };

    const renderNextChunk = () => {
      const lotesLayer = lotesLayerRef.current;
      if (!lotesLayer) return;
      if (isDraggingRef.current) return;

      const targetFeatures = targetFeaturesRef.current;
      const CHUNK_SIZE = 500;
      const chunk = targetFeatures.slice(
        currentIndexRef.current,
        currentIndexRef.current + CHUNK_SIZE
      );

      if (chunk.length > 0) {
        lotesLayer.addData({
          type: "FeatureCollection",
          features: chunk,
        } as unknown as GeoJSON.GeoJsonObject);
      }

      currentIndexRef.current += CHUNK_SIZE;

      if (
        currentIndexRef.current < targetFeatures.length &&
        !isDraggingRef.current
      ) {
        timeoutRef.current = setTimeout(renderNextChunk, 20);
      }
    };

    map.on("movestart", handleMoveStart);
    map.on("moveend", handleMoveEnd);
    map.on("zoomstart", handleMoveStart);
    map.on("zoomend", handleMoveEnd);

    return () => {
      map.off("movestart", handleMoveStart);
      map.off("moveend", handleMoveEnd);
      map.off("zoomstart", handleMoveStart);
      map.off("zoomend", handleMoveEnd);
    };
  }, [map]);

  useEffect(() => {
    const lotesLayer = lotesLayerRef.current;
    if (!lotesLayer) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (!features || features.length === 0) {
      targetFeaturesRef.current = [];
      currentIndexRef.current = 0;
      lotesLayer.clearLayers();
      return;
    }

    const center = map.getCenter();

    // 1. Calcular distancia radial al centro actual del mapa
    const withDistance = features.map((f) => {
      const [lat, lng] = getLoteCentroid(f);
      const distSq = (lat - center.lat) ** 2 + (lng - center.lng) ** 2;
      return { feature: f, distSq };
    });

    // 2. Ordenar secuencialmente de adentro hacia afuera (menor distancia a mayor)
    withDistance.sort((a, b) => a.distSq - b.distSq);

    // 3. Preparar lista ordenada de lotes
    const targetFeatures = withDistance.map((item) => item.feature);
    targetFeaturesRef.current = targetFeatures;
    currentIndexRef.current = 0;

    // Reemplazo limpio: limpiar los lotes anteriores justo antes de añadir el primer lote nuevo
    lotesLayer.clearLayers();

    // 4. Renderizado progresivo secuencial por lotes (chunks de 500)
    const CHUNK_SIZE = 500;

    const renderNextChunk = () => {
      if (isDraggingRef.current) return;

      const chunk = targetFeatures.slice(
        currentIndexRef.current,
        currentIndexRef.current + CHUNK_SIZE
      );

      if (chunk.length > 0) {
        lotesLayer.addData({
          type: "FeatureCollection",
          features: chunk,
        } as unknown as GeoJSON.GeoJsonObject);
      }

      currentIndexRef.current += CHUNK_SIZE;

      if (
        currentIndexRef.current < targetFeatures.length &&
        !isDraggingRef.current
      ) {
        timeoutRef.current = setTimeout(renderNextChunk, 20);
      }
    };

    // Ejecutar el primer lote de inmediato (0ms de retraso en el centro)
    renderNextChunk();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [map, features, versionId, revision]);

  return null;
}
