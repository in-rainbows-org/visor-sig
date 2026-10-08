"use client";

import { useEffect, useRef, useState } from "react";
import type {
  LayerKind,
  MapGeoJsonFeatureCollection,
  MapLayerFeatures,
} from "../../domain/entities/map.entity";
import { mapRepositoryImpl } from "../../infrastructure/repositories/map.repository-impl";
import { useMapView } from "../state/map-view-store";

const DEBOUNCE_MS = 150;
const DYNAMIC_LAYER_KINDS = ["CODIGOS_FIJOS", "LOTES"] as const;
type DynamicLayerKind = (typeof DYNAMIC_LAYER_KINDS)[number];

const MIN_ZOOMS: Record<DynamicLayerKind, number> = {
  CODIGOS_FIJOS: 13,
  LOTES: 14,
};

export type UseMapFeaturesReturn = {
  featuresByKind: Partial<Record<LayerKind, MapGeoJsonFeatureCollection>>;
  layerMetadataByKind: Partial<Record<LayerKind, MapLayerFeatures>>;
  isLoading: boolean;
  revision: number;
};

export function useMapFeatures(): UseMapFeaturesReturn {
  const { state, setLayerLoadStatus, setInitialLoading } = useMapView();
  const { viewport, visibleLayerKinds } = state;

  const [featuresByKind, setFeaturesByKind] = useState<
    Partial<Record<LayerKind, MapGeoJsonFeatureCollection>>
  >({});
  const [layerMetadataByKind, setLayerMetadataByKind] = useState<
    Partial<Record<LayerKind, MapLayerFeatures>>
  >({});

  const [isLoading, setIsLoading] = useState(false);
  const [revision, setRevision] = useState(0);

  // Cache en memoria por cuadrante y zoom: key -> MapLayerFeatures
  const cacheRef = useRef<Map<string, MapLayerFeatures>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      // 1. Filtrar únicamente las capas dinámicas visibles
      const activeDynamicKinds = DYNAMIC_LAYER_KINDS.filter((k): k is DynamicLayerKind =>
        visibleLayerKinds.has(k)
      );

      if (activeDynamicKinds.length === 0) {
        setFeaturesByKind((prev) => {
          const next = { ...prev };
          delete next.CODIGOS_FIJOS;
          delete next.LOTES;
          return next;
        });
        setInitialLoading(false);
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const layersToFetch: LayerKind[] = [];
      const nextFeatures: Partial<Record<LayerKind, MapGeoJsonFeatureCollection>> = {};
      const nextMetadata: Partial<Record<LayerKind, MapLayerFeatures>> = {};

      const roundCoord = (n: number) => Math.round(n * 1000) / 1000;
      const bboxGrid = `${roundCoord(viewport.west)},${roundCoord(viewport.south)},${roundCoord(viewport.east)},${roundCoord(viewport.north)}`;

      // Limpiar capas dinámicas que ya no son visibles
      for (const kind of DYNAMIC_LAYER_KINDS) {
        if (!visibleLayerKinds.has(kind)) {
          nextFeatures[kind] = { type: "FeatureCollection", features: [] };
        }
      }

      // 2. Evaluar umbrales de zoom y caché local
      for (const kind of activeDynamicKinds) {
        const minRequiredZoom = MIN_ZOOMS[kind];
        if (viewport.zoom < minRequiredZoom) {
          setLayerLoadStatus(kind, "ZOOM_REQUIRED", 0, minRequiredZoom, null, null);
          nextFeatures[kind] = { type: "FeatureCollection", features: [] };
          continue;
        }

        const cacheKey = `${kind}:${viewport.zoom}:${bboxGrid}`;
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

      // Si no hay capas para consultar en red
      if (layersToFetch.length === 0) {
        setFeaturesByKind((prev) => ({ ...prev, ...nextFeatures }));
        setLayerMetadataByKind((prev) => ({ ...prev, ...nextMetadata }));
        setRevision((r) => r + 1);
        setInitialLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const result = await mapRepositoryImpl.getActiveMapFeatures({
          layerKinds: layersToFetch,
          viewport,
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        if (result.ok) {
          const fetchedLayers = result.data.layers;
          for (const layer of fetchedLayers) {
            nextFeatures[layer.kind] = layer.features;
            nextMetadata[layer.kind] = layer;

            const cacheKey = `${layer.kind}:${viewport.zoom}:${bboxGrid}`;
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
          console.warn("[useMapFeatures] Falló la obtención de capas dinámicas:", result.errors);
          for (const kind of layersToFetch) {
            setLayerLoadStatus(
              kind,
              "READY",
              0,
              MIN_ZOOMS[kind as "CODIGOS_FIJOS" | "LOTES"] ?? null,
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
  }, [viewport, visibleLayerKinds, setLayerLoadStatus, setInitialLoading]);

  return {
    featuresByKind,
    layerMetadataByKind,
    isLoading,
    revision,
  };
}
