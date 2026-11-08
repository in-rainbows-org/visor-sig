"use client";

import React from "react";
import dynamic from "next/dynamic";
import { X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { MapLegendCard } from "../elements/map-legend-card";
import { MapMobileHeader } from "../elements/map-mobile-header";
import { MapSearchBar } from "../elements/map-search-bar";
import { MapViewSegmentToggle } from "../elements/map-view-segment-toggle";
import { CreateFixedCodeModal } from "../forms/create-fixed-code-modal";
import { useConsultationHighlight } from "../../hooks/use-consultation-highlight";
import { useMacroLayers } from "../../hooks/use-macro-layers";
import type { HighlightedMapEntity } from "@/features/map/domain/entities/highlighted-entity.entity";
import { DEFAULT_MAP_CENTER } from "@/features/map/domain/entities/map.entity";
import { useMapView } from "../../state/map-view-store";
import { authClient } from "@/lib/auth-client";

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
  const {
    state,
    setInitialLoading,
    toggleSelectingFixedCodeLocation,
    cancelSelectingFixedCodeLocation,
    setSelectedFixedCodeCoordinates,
  } = useMapView();
  useMacroLayers();
  const {
    highlightedEntity,
    clearHighlight,
    focusEntityById,
  } = useConsultationHighlight();

  const { data: session } = authClient.useSession();
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);

  // Safety timer para asegurar que isLoadingInitial nunca se quede bloqueado
  React.useEffect(() => {
    if (!state.isLoadingInitial) return;
    const safetyTimer = setTimeout(() => {
      setInitialLoading(false);
    }, 2500);
    return () => clearTimeout(safetyTimer);
  }, [state.isLoadingInitial, setInitialLoading]);

  // Cálculo del centro actual del viewport del visor cartográfico
  const currentCenter = React.useMemo(() => {
    if (
      state.viewport.south !== 0 ||
      state.viewport.north !== 0 ||
      state.viewport.west !== 0 ||
      state.viewport.east !== 0
    ) {
      return {
        latitude: (state.viewport.south + state.viewport.north) / 2,
        longitude: (state.viewport.west + state.viewport.east) / 2,
      };
    }
    return {
      latitude: DEFAULT_MAP_CENTER[0],
      longitude: DEFAULT_MAP_CENTER[1],
    };
  }, [state.viewport]);

  // Atajo silencioso de teclado 'C' / 'c' en escritorio para administradores (FR-001, FR-002)
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Restricción: exclusivo para escritorio (>= 1024px)
      if (window.innerWidth < 1024) return;

      // Restricción: solo rol administrador si la sesión está cargada
      if (session && session.user.role !== "ADMIN") return;

      // Si el modo de selección está activo y no hay modal abierto, Escape cancela la selección
      if (
        event.key === "Escape" &&
        state.isSelectingFixedCodeLocation &&
        !isCreateModalOpen
      ) {
        cancelSelectingFixedCodeLocation();
        return;
      }

      // Restricción: tecla 'c' o 'C'
      if (event.key.toLowerCase() !== "c") return;

      // Ignorar si el usuario está interactuando con un campo editable
      const activeEl = document.activeElement;
      if (activeEl) {
        const tagName = activeEl.tagName.toLowerCase();
        if (
          tagName === "input" ||
          tagName === "textarea" ||
          tagName === "select" ||
          (activeEl as HTMLElement).isContentEditable
        ) {
          return;
        }
      }

      // Si el modal ya está abierto, no alternar
      if (isCreateModalOpen) return;

      // Alternar modo de selección de coordenadas en el store
      toggleSelectingFixedCodeLocation();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    session,
    state.isSelectingFixedCodeLocation,
    isCreateModalOpen,
    cancelSelectingFixedCodeLocation,
    toggleSelectingFixedCodeLocation,
  ]);

  const handleLocationSelected = React.useCallback(
    (coords: { latitude: number; longitude: number }) => {
      setSelectedFixedCodeCoordinates(coords);
      setIsCreateModalOpen(true);
    },
    [setSelectedFixedCodeCoordinates]
  );

  const handleModalOpenChange = React.useCallback(
    (open: boolean) => {
      setIsCreateModalOpen(open);
      if (!open) {
        cancelSelectingFixedCodeLocation();
      }
    },
    [cancelSelectingFixedCodeLocation]
  );

  const handleClear = React.useCallback(() => {
    clearHighlight();
  }, [clearHighlight]);

  const handleSelectEntity = React.useCallback(
    (entity: HighlightedMapEntity) => {
      if (state.isSelectingFixedCodeLocation) {
        handleLocationSelected({ latitude: entity.lat, longitude: entity.lng });
        return;
      }
      if (entity.id && !entity.id.startsWith("cf-mock")) {
        focusEntityById(entity.id);
      }
    },
    [state.isSelectingFixedCodeLocation, handleLocationSelected, focusEntityById]
  );

  return (
    <div className="relative w-full h-full overflow-hidden select-none touch-none overscroll-none">
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
          onSelectLocation={handleLocationSelected}
        />

        {/* Indicador flotante superior de modo de selección de código fijo (Desktop >= 1024px) */}
        {state.isSelectingFixedCodeLocation && !isCreateModalOpen && (
          <div className="hidden lg:flex absolute top-[93px] left-1/2 -translate-x-1/2 z-[1000] items-center gap-2.5 px-4 py-2 bg-blue-600 text-white shadow-xl rounded-full text-xs font-semibold animate-in fade-in-0 duration-200 border border-blue-400/40 pointer-events-auto select-none">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-200" />
            </span>
            <span>Haz clic en el mapa para ubicar el código fijo</span>
            <button
              type="button"
              onClick={cancelSelectingFixedCodeLocation}
              className="ml-1.5 hover:bg-blue-700 rounded-full p-1 transition-colors flex items-center justify-center"
              title="Cancelar selección (ESC)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* 2. Controles Superiores Izquierdos (Desktop >= 1024px) */}
        <div className="hidden lg:flex absolute lg:top-[93px] lg:left-[91px] z-[1000] flex-col gap-3 pointer-events-auto">
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

      {/* 6. Modal de Creación de Código Fijo (Admin Desktop) */}
      <CreateFixedCodeModal
        open={isCreateModalOpen}
        onOpenChange={handleModalOpenChange}
        latitude={
          state.selectedFixedCodeCoordinates?.latitude ?? currentCenter.latitude
        }
        longitude={
          state.selectedFixedCodeCoordinates?.longitude ?? currentCenter.longitude
        }
      />
    </div>
  );
}
