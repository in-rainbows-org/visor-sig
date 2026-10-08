"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Spinner } from "@/components/ui/spinner";
import { MapLegendCard } from "../elements/map-legend-card";
import { MapMobileHeader } from "../elements/map-mobile-header";
import { MapSearchBar } from "../elements/map-search-bar";
import { MapViewSegmentToggle } from "../elements/map-view-segment-toggle";
import { useConsultationHighlight } from "../../hooks/use-consultation-highlight";
import { useMacroLayers } from "../../hooks/use-macro-layers";
import type { HighlightedMapEntity } from "@/features/map/domain/entities/highlighted-entity.entity";
import { useMapView } from "../../state/map-view-store";

// Carga exclusiva en cliente para Leaflet (evitar SSR / window is not defined)
const MapLeafletDynamic = dynamic(
  () => import("../elements/map-leaflet").then((mod) => mod.MapLeaflet),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-white flex flex-col items-center justify-center gap-3">
        <Spinner className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="text-xs text-slate-500 font-medium">
          Cargando visor cartográfico...
        </span>
      </div>
    ),
  }
);

export function MapView() {
  const { state, setInitialLoading } = useMapView();
  useMacroLayers();
  const {
    highlightedEntity,
    clearHighlight,
    focusEntityById,
  } = useConsultationHighlight();

  // Safety timer para asegurar que isLoadingInitial nunca se quede bloqueado
  React.useEffect(() => {
    if (!state.isLoadingInitial) return;
    const safetyTimer = setTimeout(() => {
      setInitialLoading(false);
    }, 2500);
    return () => clearTimeout(safetyTimer);
  }, [state.isLoadingInitial, setInitialLoading]);

  const handleClear = React.useCallback(() => {
    clearHighlight();
  }, [clearHighlight]);

  const handleSelectEntity = React.useCallback(
    (entity: HighlightedMapEntity) => {
      if (entity.id && !entity.id.startsWith("cf-mock")) {
        focusEntityById(entity.id);
      }
    },
    [focusEntityById]
  );

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* 0. Pantalla blanca inicial accesible durante la primera carga */}
      {state.isLoadingInitial && (
        <div className="absolute inset-0 z-50 bg-white flex flex-col items-center justify-center gap-3 animate-in fade-in-0 duration-200">
          <Spinner className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="text-xs text-slate-600 font-semibold tracking-wide">
            Cargando visor cartográfico y capas activas...
          </span>
        </div>
      )}

      {/* 1. Contenedor de Mapa de Pantalla Completa (fijo e inalterado por overlays) */}
      <div className="absolute inset-0 w-full h-full z-0">
        <MapLeafletDynamic
          highlightedEntity={highlightedEntity}
          onClearHighlight={handleClear}
          onSelectEntity={handleSelectEntity}
        />

        {/* 2. Controles Superiores Izquierdos (Desktop >= 1024px) */}
        <div className="hidden lg:flex absolute top-4 left-4 z-[1000] flex-col gap-3 pointer-events-auto">
          <MapViewSegmentToggle />
        </div>

        {/* 3. Barra de Búsqueda Superior Derecha (Solo Desktop >= 1024px) */}
        <MapSearchBar
          highlightedEntity={highlightedEntity}
          onSelectEntity={handleSelectEntity}
          onClear={handleClear}
          className="hidden lg:flex pointer-events-auto"
        />

        {/* 4. Controles Inferiores Derechos (Leyenda y Fondo Cartográfico) */}
        <MapLegendCard className="pointer-events-auto" />
      </div>

      {/* 5. Cabecera móvil flotante overlay (solo en viewports < 1024px) */}
      <MapMobileHeader
        highlightedEntity={highlightedEntity}
        onSelectEntity={handleSelectEntity}
        onClear={handleClear}
        className="absolute top-0 left-0 right-0 z-[500] pointer-events-none lg:hidden"
      />
    </div>
  );
}
