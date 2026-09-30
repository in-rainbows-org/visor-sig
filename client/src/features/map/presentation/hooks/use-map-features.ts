"use client";

import { useEffect, useRef, useState } from "react";
import type {
  LayerKind,
  MapGeoJsonFeatureCollection,
  MapLayerFeatures,
} from "../../domain/models/map.types";
import { httpMapRepository } from "../../infrastructure/repositories/http-map.repository";
import { useMapView } from "../state/map-view-store";

const DEBOUNCE_MS = 150;

export type UseMapFeaturesReturn = {
  featuresByKind: Partial<Record<LayerKind, MapGeoJsonFeatureCollection>>;
  layerMetadataByKind: Partial<Record<LayerKind, MapLayerFeatures>>;
  isLoading: boolean;
  revision: number;
};

export function useMapFeatures() {
  const { state, setLayerLoadStatus, setInitialLoading } = useMapView();
  const { viewport, visibleLayerKinds, visibleFixedCodeStatuses } = state;

  const [featuresByKind, setFeaturesByKind] = useState<
    Partial<Record<LayerKind, MapGeoJsonFeatureCollection>>
  >({});
  const [layerMetadataByKind, setLayerMetadataByKind] = useState<
    Partial<Record<LayerKind, MapLayerFeatures>>
  >({});

  const [isLoading, setIsLoading] = useState(false);
  const [revision, setRevision] = useState(0);

  // Cache en memoria: key -> MapLayerFeatures
  const cacheRef = useRef<Map<string, MapLayerFeatures>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      if (visibleLayerKinds.size === 0) {
        setFeaturesByKind({});
        setInitialLoading(false);
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const layerKindsArray = Array.from(visibleLayerKinds);
      const fixedCodeStatusesArray = Array.from(visibleFixedCodeStatuses);

      // Verificamos si podemos resolver capas desde caché
      const layersToFetch: LayerKind[] = [];
      const nextFeatures: Partial<Record<LayerKind, MapGeoJsonFeatureCollection>> = {};
      const nextMetadata: Partial<Record<LayerKind, MapLayerFeatures>> = {};

      const roundCoord = (n: number) => Math.round(n * 1000) / 1000;
      const bboxGrid = `${roundCoord(viewport.west)},${roundCoord(viewport.south)},${roundCoord(viewport.east)},${roundCoord(viewport.north)}`;

      for (const kind of layerKindsArray) {
        const statusesKey = kind === "CODIGOS_FIJOS" ? fixedCodeStatusesArray.sort().join(",") : "";
        const cacheKey = `${kind}:${viewport.zoom}:${bboxGrid}:${statusesKey}`;

        const cached = cacheRef.current.get(cacheKey);
        if (cached) {
          nextFeatures[kind] = cached.features;
          nextMetadata[kind] = cached;
          setLayerLoadStatus(
            kind,
            cached.loadStatus,
            cached.featureCount,
            cached.minZoom,
            cached.activeDataVersionId,
            null
          );
        } else {
          layersToFetch.push(kind);
        }
      }

      if (layersToFetch.length === 0) {
        setFeaturesByKind(nextFeatures);
        setLayerMetadataByKind(nextMetadata);
        setRevision((r) => r + 1);
        setInitialLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const result = await httpMapRepository.getActiveMapFeatures({
          layerKinds: layersToFetch,
          viewport,
          fixedCodeStatuses: fixedCodeStatusesArray,
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        if (result.ok) {
          const fetchedLayers = result.data.layers;
          for (const layer of fetchedLayers) {
            nextFeatures[layer.kind] = layer.features;
            nextMetadata[layer.kind] = layer;

            const statusesKey =
              layer.kind === "CODIGOS_FIJOS" ? fixedCodeStatusesArray.sort().join(",") : "";
            const cacheKey = `${layer.kind}:${viewport.zoom}:${bboxGrid}:${statusesKey}`;
            cacheRef.current.set(cacheKey, layer);

            setLayerLoadStatus(
              layer.kind,
              layer.loadStatus,
              layer.featureCount,
              layer.minZoom,
              layer.activeDataVersionId,
              null
            );
          }

          setFeaturesByKind((prev) => ({ ...prev, ...nextFeatures }));
          setLayerMetadataByKind((prev) => ({ ...prev, ...nextMetadata }));
          setRevision((r) => r + 1);
        } else {
          console.warn("[useMapFeatures] Falló la obtención de capas del visor:", result.errors);
          for (const kind of layersToFetch) {
            setLayerLoadStatus(
              kind,
              "READY",
              0,
              null,
              null,
              result.errors?.[0] ?? "Error al cargar datos"
            );
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
          setInitialLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [viewport, visibleLayerKinds, visibleFixedCodeStatuses, setLayerLoadStatus, setInitialLoading]);

  return {
    featuresByKind,
    layerMetadataByKind,
    isLoading,
    revision,
  };
}
