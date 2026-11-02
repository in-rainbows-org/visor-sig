"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Spinner } from "@/components/ui/spinner";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import { RouteCreationSearchBar } from "../elements/create/route-creation-search-bar";
import { RouteCreationWizardCard } from "../elements/create/route-creation-wizard-card";
import {
  RouteCreationMobileTrigger,
  RouteCreationMobileWizard,
  RouteCreationMobileHeader,
  RouteCreationMobileResultsSheet,
} from "../elements/create/mobile";
import {
  RouteCreationWizardProvider,
  useRouteCreationWizard,
} from "@/features/route-assignments/presentation/state/route-creation-wizard-store";
import { RouteWizardStep } from "@/features/route-assignments/domain/entities/route-wizard.entity";
import { useRouteCreationSearch } from "../../hooks/use-route-creation-search";

// Carga dinámica exclusiva en cliente para Leaflet (evitar errores de window / SSR)
const RouteCreationMapDynamic = dynamic(
  () => import("../elements/create/route-creation-map").then((mod) => mod.RouteCreationMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-slate-100 flex flex-col items-center justify-center gap-3">
        <Spinner className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="text-xs text-slate-500 font-medium">
          Cargando mapa base y herramientas de asignación...
        </span>
      </div>
    ),
  }
);

function RouteCreationInner() {
  const {
    currentStep,
    isSearchVisible,
    cartStops,
    startingPoint,
    serviceType,
    addStop,
  } = useRouteCreationWizard();
  const [isWizardSheetOpen, setIsWizardSheetOpen] = useState(false);

  // IDs de códigos fijos ya agregados para excluirlos en las búsquedas
  const excludedIds = useMemo(
    () => cartStops.map((stop) => stop.fixedCodeId),
    [cartStops]
  );

  const {
    query,
    setQuery,
    candidates,
    isSearching,
    selectedCandidate,
    isDropdownExpanded,
    setIsDropdownExpanded,
    isMobileSheetOpen,
    setIsMobileSheetOpen,
    executeSearch,
    handleSelectCandidate,
    handleAddCandidate,
    handleClear,
  } = useRouteCreationSearch({
    excludedIds,
    serviceType,
    onAddCandidate: (candidate) => {
      addStop(candidate);
      appToast.success(
        "Vivienda agregada a la ruta",
        `Código fijo #${candidate.fixedCode}${candidate.name ? ` (${candidate.name})` : ""}`
      );
    },
  });

  // Auto-apertura instantánea del bottom sheet móvil al fijar el punto de partida en el mapa (Paso 3)
  // Exclusivo para móviles y tablets (< 1024px)
  const prevStartingPointRef = useRef(startingPoint);
  useEffect(() => {
    if (
      currentStep === RouteWizardStep.STARTING_POINT &&
      startingPoint &&
      startingPoint !== prevStartingPointRef.current
    ) {
      const isMobileOrTablet =
        typeof window !== "undefined" && window.innerWidth < 1024;
      if (isMobileOrTablet) {
        setIsWizardSheetOpen(true);
      }
    }
    prevStartingPointRef.current = startingPoint;
  }, [currentStep, startingPoint]);

  // Escuchar eventos de solicitud de minimizado desde el interior de los pasos
  useEffect(() => {
    const handleMinimize = () => setIsWizardSheetOpen(false);
    window.addEventListener("minimize-wizard-sheet", handleMinimize);
    return () => window.removeEventListener("minimize-wizard-sheet", handleMinimize);
  }, []);

  const handleOpenWizard = () => {
    setIsMobileSheetOpen(false);
    setIsWizardSheetOpen(true);
  };

  const handleMobileSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await executeSearch(query);
    // Coordinación mutua: minimizar el wizard al abrir los resultados de búsqueda
    setIsWizardSheetOpen(false);
    setIsMobileSheetOpen(true);
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none touch-none overscroll-none bg-slate-100">
      {/* 1. Tarjeta Flotante del Asistente Guiado (Lado Izquierdo - Exclusivo Desktop) */}
      <RouteCreationWizardCard />

      {/* 2. Botón Flotante Inferior Móvil y Asistente en Bottom Sheet */}
      <RouteCreationMobileTrigger
        currentStep={currentStep}
        cartStopsCount={cartStops.length}
        isOpen={isWizardSheetOpen}
        onOpen={handleOpenWizard}
      />

      <RouteCreationMobileWizard
        isOpen={isWizardSheetOpen}
        onOpenChange={setIsWizardSheetOpen}
      />

      {/* 3. Búsqueda y Resultados (Activo exclusivamente en el Paso 3: Paradas) */}
      {isSearchVisible && (
        <>
          {/* Barra de búsqueda desktop superior derecha */}
          <RouteCreationSearchBar
            query={query}
            onQueryChange={setQuery}
            onSearch={executeSearch}
            onClear={handleClear}
            candidates={candidates}
            isSearching={isSearching}
            isExpanded={isDropdownExpanded}
            onToggleExpand={setIsDropdownExpanded}
            onSelectCandidate={handleSelectCandidate}
            onAddCandidate={handleAddCandidate}
            addedCandidates={[]}
            className="hidden lg:flex pointer-events-auto animate-in fade-in-0 slide-in-from-top-2 duration-300"
          />

          {/* Cabecera móvil superior integrada con degradado azul */}
          <RouteCreationMobileHeader
            query={query}
            onQueryChange={setQuery}
            onSearch={handleMobileSearch}
            onClear={handleClear}
            isSearching={isSearching}
            candidatesCount={candidates.length}
          />

          {/* Bottom Sheet modal de resultados de búsqueda móvil */}
          <RouteCreationMobileResultsSheet
            isOpen={isMobileSheetOpen}
            onOpenChange={setIsMobileSheetOpen}
            candidates={candidates}
            isSearching={isSearching}
            onSelectCandidate={handleSelectCandidate}
            onAddCandidate={handleAddCandidate}
            addedCandidateIds={excludedIds}
          />
        </>
      )}

      {/* 3. Mapa Cartográfico a Pantalla Completa (Santa Cruz de la Sierra) */}
      <div className="absolute inset-0 w-full h-full z-0">
        <RouteCreationMapDynamic
          selectedCandidate={selectedCandidate}
          onSelectCandidate={handleSelectCandidate}
        />
      </div>
    </div>
  );
}

export function RouteCreationView() {
  return (
    <RouteCreationWizardProvider>
      <RouteCreationInner />
    </RouteCreationWizardProvider>
  );
}

export default RouteCreationView;
