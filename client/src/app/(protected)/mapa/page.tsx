"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { Spinner } from "@/components/ui/spinner";
import { MapLegendCard } from "@/features/map/presentation/components/elements/map-legend-card";
import { MapMobileHeader } from "@/features/map/presentation/components/elements/map-mobile-header";
import { MapSearchBar } from "@/features/map/presentation/components/elements/map-search-bar";
import { MapViewSegmentToggle } from "@/features/map/presentation/components/elements/map-view-segment-toggle";
import { useConsultationHighlight } from "@/features/map/presentation/hooks/use-consultation-highlight";
import { HighlightedMapEntity } from "@/features/map/domain/models/highlighted-entity.types";
import {
  MapViewProvider,
  useMapView,
} from "@/features/map/presentation/state/map-view-store";

// Carga exclusiva en cliente para Leaflet (evitar SSR / window is not defined)
const MapLeafletDynamic = dynamic(
  () =>
    import(
      "@/features/map/presentation/components/map-leaflet"
    ).then((mod) => mod.MapLeaflet),
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

function MapaViewContent() {
  const { state } = useMapView();
  const { highlightedEntity: urlHighlightedEntity, clearHighlight } = useConsultationHighlight();
  const [activeEntity, setActiveEntity] = React.useState<HighlightedMapEntity | null>(null);

  React.useEffect(() => {
    setActiveEntity(urlHighlightedEntity);
  }, [urlHighlightedEntity]);

  const handleClear = React.useCallback(() => {
    setActiveEntity(null);
    clearHighlight();
  }, [clearHighlight]);

  const handleSelectEntity = React.useCallback((entity: HighlightedMapEntity) => {
    setActiveEntity(entity);
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden select-none flex flex-col">
      {/* 0. Pantalla blanca inicial accesible durante la primera carga */}
      {state.isLoadingInitial && (
        <div className="absolute inset-0 z-50 bg-white flex flex-col items-center justify-center gap-3 animate-in fade-in-0 duration-200">
          <Spinner className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="text-xs text-slate-600 font-semibold tracking-wide">
            Cargando visor cartográfico y capas activas...
          </span>
        </div>
      )}

      {/* 1. Cabecera móvil colapsable (solo en viewports < 1024px) */}
      <MapMobileHeader className="relative z-[1000] shrink-0" />

      {/* 2. Contenedor de Mapa y Controles Flotantes */}
      <div className="flex-1 w-full h-full relative z-0">
        <MapLeafletDynamic
          highlightedEntity={activeEntity}
          onClearHighlight={handleClear}
          onSelectEntity={handleSelectEntity}
        />

        {/* 3. Controles Superiores Izquierdos (Desktop >= 1024px) */}
        <div className="hidden lg:flex absolute top-4 left-4 z-[1000] flex-col gap-3 pointer-events-auto">
          <MapViewSegmentToggle />
        </div>

        {/* 4. Barra de Búsqueda Superior Derecha (Desktop y Móvil) */}
        <MapSearchBar
          highlightedEntity={activeEntity}
          onSelectEntity={handleSelectEntity}
          onClear={handleClear}
          className="pointer-events-auto"
        />

        {/* 5. Controles Inferiores Derechos (Leyenda y Fondo Cartográfico) */}
        <MapLegendCard className="pointer-events-auto" />
      </div>
    </div>
  );
}

export default function MapaPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-full bg-white flex flex-col items-center justify-center gap-3">
          <Spinner className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="text-xs text-slate-500 font-medium">
            Cargando visor cartográfico...
          </span>
        </div>
      }
    >
      <MapViewProvider>
        <MapaViewContent />
      </MapViewProvider>
    </Suspense>
  );
}
