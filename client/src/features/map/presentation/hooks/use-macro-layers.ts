"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  MapGeoJsonFeatureCollection,
  MapLayerFeatures,
} from "../../domain/entities/map.entity";
import { mapRepositoryImpl } from "../../infrastructure/repositories/map.repository-impl";
import { useMapView } from "../state/map-view-store";

export function useMacroLayers() {
  const {
    state,
    setMacroLayers,
    setMacroLayersLoading,
    setLayerLoadStatus,
    setInitialLoading,
  } = useMapView();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFetchingRef = useRef(false);

  const fetchMacroLayers = useCallback(async () => {
    // Si ya están presentes ambas capas macro en memoria, asegurar que initialLoading se desactive y salir
    if (state.macroFeaturesByKind.MANZANAS && state.macroFeaturesByKind.VIAS) {
      setInitialLoading(false);
      return;
    }

    if (isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    setIsLoading(true);
    setMacroLayersLoading(true);
    setError(null);

    try {
      const result = await mapRepositoryImpl.getActiveMacroLayers();

      if (result.ok) {
        const nextFeatures: Partial<Record<"MANZANAS" | "VIAS", MapGeoJsonFeatureCollection>> = {};
        const nextMetadata: Partial<Record<"MANZANAS" | "VIAS", MapLayerFeatures>> = {};

        for (const layer of result.data.layers) {
          if (layer.kind === "MANZANAS" || layer.kind === "VIAS") {
            nextFeatures[layer.kind] = layer.features;
            nextMetadata[layer.kind] = layer;
          }
        }

        setMacroLayers(nextFeatures, nextMetadata);
        setInitialLoading(false);
      } else {
        const errMessage = result.errors?.[0] ?? "Error al cargar capas base del visor";
        setError(errMessage);
        setLayerLoadStatus("MANZANAS", "READY", 0, null, null, errMessage);
        setLayerLoadStatus("VIAS", "READY", 0, null, null, errMessage);
        setInitialLoading(false);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error inesperado";
      setError(message);
      setInitialLoading(false);
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
      setMacroLayersLoading(false);
    }
  }, [
    state.macroFeaturesByKind.MANZANAS,
    state.macroFeaturesByKind.VIAS,
    setMacroLayers,
    setMacroLayersLoading,
    setLayerLoadStatus,
    setInitialLoading,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMacroLayers();
    }, 0);

    return () => {
      clearTimeout(timer);
    };
  }, [fetchMacroLayers]);

  return {
    isLoading,
    error,
    refreshMacroLayers: fetchMacroLayers,
  };
}
