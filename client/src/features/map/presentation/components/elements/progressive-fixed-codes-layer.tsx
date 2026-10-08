"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import { useMap } from "react-leaflet";
import type { MapGeoJsonFeature } from "@/features/map/domain/entities/map.entity";
import type { HighlightedMapEntity } from "@/features/map/domain/entities/highlighted-entity.entity";
import {
  FIXED_CODE_STATUSES,
  type FixedCodeStatusValue,
} from "@/features/map/domain/entities/fixed-code-status.entity";
import { FIXED_CODE_THEME_MAP } from "./fixed-code-theme-helper";
import { getCachedFixedCodeIcon } from "./fixed-code-marker";

export type ProgressiveFixedCodesLayerProps = {
  features: MapGeoJsonFeature[];
  visibleFixedCodeStatuses?: Set<number>;
  versionId?: string | null;
  revision?: number;
  isIsolated?: boolean;
  onSelectFixedCode?: (entity: HighlightedMapEntity) => void;
};

function getFeatureCoordinates(feature: MapGeoJsonFeature): [number, number] {
  const rawCoords = feature.geometry.coordinates;
  let lat = 0;
  let lng = 0;

  if (Array.isArray(rawCoords)) {
    if (Array.isArray(rawCoords[0])) {
      // MultiPoint: [[lng, lat]]
      lng = Number(rawCoords[0][0]);
      lat = Number(rawCoords[0][1]);
    } else {
      // Point: [lng, lat]
      lng = Number(rawCoords[0]);
      lat = Number(rawCoords[1]);
    }
  }

  return [lat, lng];
}

export function ProgressiveFixedCodesLayer({
  features,
  visibleFixedCodeStatuses,
  versionId,
  revision = 0,
  isIsolated = false,
  onSelectFixedCode,
}: ProgressiveFixedCodesLayerProps) {
  const map = useMap();
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (map.hasLayer(layerGroup)) {
        map.removeLayer(layerGroup);
      }
      layerGroup.clearLayers();
    };
  }, [map]);

  useEffect(() => {
    const handleMoveStart = () => {
      isDraggingRef.current = true;
      // Pausar cualquier lote secuencial en curso, pero CONSERVAR los marcadores ya dibujados
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    const handleMoveEnd = () => {
      isDraggingRef.current = false;
      // No ejecutamos renderizado aquí con datos antiguos;
      // el renderizado se ejecutará limpiamente una sola vez cuando useMapFeatures actualice 'revision'
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
    const layerGroup = layerGroupRef.current;
    if (!layerGroup) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (isDraggingRef.current) return;

    // Si hay un código fijo enfocado en modo aislamiento, ocultar todos los puntos normales de la capa
    if (isIsolated) {
      layerGroup.clearLayers();
      return;
    }

    const zoom = map.getZoom();
    if (zoom < 13) {
      layerGroup.clearLayers();
      return;
    }

    if (!features || features.length === 0 || (visibleFixedCodeStatuses && visibleFixedCodeStatuses.size === 0)) {
      layerGroup.clearLayers();
      return;
    }

    // Filtrar reactivamente en cliente según los estados habilitados
    const activeFeatures = visibleFixedCodeStatuses
      ? features.filter((f) => visibleFixedCodeStatuses.has(f.properties.status ?? 1))
      : features;

    if (activeFeatures.length === 0) {
      layerGroup.clearLayers();
      return;
    }

    const center = map.getCenter();

    // 1. Calcular distancia radial al centro actual del mapa
    const withDistance = activeFeatures.map((f) => {
      const [lat, lng] = getFeatureCoordinates(f);
      const distSq = (lat - center.lat) ** 2 + (lng - center.lng) ** 2;
      return { feature: f, lat, lng, distSq };
    });

    // 2. Ordenar secuencialmente de adentro hacia afuera (menor distancia a mayor)
    withDistance.sort((a, b) => a.distSq - b.distSq);

    // 3. Aplicar Nivel de Detalle (LoD) dependiente del zoom
    let maxCount = Infinity;
    if (zoom === 16) maxCount = 2000;
    else if (zoom === 15) maxCount = 1000;
    else if (zoom === 14) maxCount = 500;
    else if (zoom <= 13) maxCount = 250;

    let targetItems = withDistance;
    if (withDistance.length > maxCount && maxCount !== Infinity) {
      const step = withDistance.length / maxCount;
      targetItems = [];
      for (let i = 0; i < maxCount; i++) {
        const index = Math.floor(i * step);
        if (withDistance[index]) {
          targetItems.push(withDistance[index]);
        }
      }
    }

    // Reemplazo limpio: limpiar los marcadores anteriores justo antes de añadir el primer lote nuevo
    layerGroup.clearLayers();

    // 4. Renderizado progresivo secuencial por lotes (chunks)
    const CHUNK_SIZE = 80;
    let currentIndex = 0;

    const renderNextChunk = () => {
      if (isDraggingRef.current) return;

      const chunk = targetItems.slice(currentIndex, currentIndex + CHUNK_SIZE);
      for (const item of chunk) {
        const { feature, lat, lng } = item;
        const statusVal = (feature.properties.status ?? 1) as FixedCodeStatusValue;
        const icon = getCachedFixedCodeIcon(statusVal);
        const marker = L.marker([lat, lng], { icon });

        const displayText =
          feature.properties.label ||
          (feature.properties.fixedCode !== undefined
            ? `Código ${feature.properties.fixedCode}`
            : undefined);

        if (displayText) {
          marker.bindTooltip(displayText, {
            direction: "top",
            offset: [0, -10],
          });
        }

        marker.on("click", (e) => {
          L.DomEvent.stopPropagation(e);
          const statusDef = FIXED_CODE_STATUSES[statusVal] || FIXED_CODE_STATUSES[1];
          const theme = FIXED_CODE_THEME_MAP[statusVal] || FIXED_CODE_THEME_MAP[1];
          const codeVal =
            feature.properties.fixedCode !== undefined
              ? String(feature.properties.fixedCode)
              : String(feature.id);

          const entity: HighlightedMapEntity = {
            id: feature.properties.id ? String(feature.properties.id) : String(feature.id),
            layerKind: "CODIGOS_FIJOS",
            code: codeVal,
            fixedCodeNumber: feature.properties.fixedCode,
            name: feature.properties.name || feature.properties.label || "Predio Registrado",
            uv: feature.properties.uv ? String(feature.properties.uv) : "14",
            mz: feature.properties.blockNumber ? String(feature.properties.blockNumber) : "08",
            lote: feature.properties.lotNumber ? String(feature.properties.lotNumber) : "12",
            status: statusDef.label,
            statusVal: statusVal,
            statusColor: theme.badgeBgClass,
            lat,
            lng,
          };

          onSelectFixedCode?.(entity);
        });

        layerGroup.addLayer(marker);
      }

      currentIndex += CHUNK_SIZE;

      if (currentIndex < targetItems.length && !isDraggingRef.current) {
        timeoutRef.current = setTimeout(renderNextChunk, 25);
      }
    };

    // Ejecutar el primer lote de inmediato en el centro
    renderNextChunk();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [map, features, visibleFixedCodeStatuses, versionId, revision, isIsolated, onSelectFixedCode]);

  return null;
}
