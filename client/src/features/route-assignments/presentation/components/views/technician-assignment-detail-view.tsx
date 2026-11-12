"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AlertCircle, ArrowLeft, RefreshCw, SearchX } from "lucide-react";
import type { AssignmentStopDetail } from "@/features/route-assignments/domain/entities/assignment-detail.entity";
import { deriveActiveStopState } from "@/features/route-assignments/domain/entities/assignment-execution.entity";
import { useAssignmentDetail } from "../../hooks/use-assignment-detail";
import { useAssignmentRealtime } from "../../hooks/use-assignment-realtime";
import { useTechnicianAssignmentExecution } from "../../hooks/use-technician-assignment-execution";
import { AssignmentDetailSkeleton } from "../elements/detail/assignment-detail-skeleton";
import { AssignmentDetailCard } from "../elements/detail/assignment-detail-card";
import { AssignmentDetailStopSheet } from "../elements/detail/assignment-detail-stop-sheet";
import { TechnicianViewStopsButton } from "../elements/technician-portal/technician-view-stops-button";
import { TechnicianStopsDrawer } from "../elements/technician-portal/technician-stops-drawer";
import { TechnicianStopsList } from "../elements/technician-portal/technician-stops-list";
import { TechnicianAssignmentMobileHeader } from "../elements/technician-portal/technician-assignment-mobile-header";
import { TechnicianActiveStopCard } from "../elements/technician-portal/technician-active-stop-card";
import { TechnicianFinalizeStopDrawer } from "../elements/technician-portal/technician-finalize-stop-drawer";

// Carga dinámica exclusiva en cliente para evitar fallos de SSR/window con Leaflet
const AssignmentDetailMapDynamic = dynamic(
  () =>
    import("../elements/detail/assignment-detail-map").then(
      (mod) => mod.AssignmentDetailMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-slate-100 flex items-center justify-center">
        <span className="text-xs text-slate-400 font-medium animate-pulse">
          Cargando mapa cartográfico...
        </span>
      </div>
    ),
  }
);

export type TechnicianAssignmentDetailViewProps = {
  assignmentId: string;
};

export function TechnicianAssignmentDetailView({
  assignmentId,
}: TechnicianAssignmentDetailViewProps) {
  const {
    assignment,
    isLoading,
    error,
    isNotFound,
    selectedStop,
    selectStop,
    clearSelectedStop,
    refetch,
    updateAssignmentLocally,
  } = useAssignmentDetail(assignmentId);

  const {
    startAssignment,
    startTransit,
    openNavigation,
    arriveAtStop,
    completeStop,
    isSubmitting,
    activeAction,
  } = useTechnicianAssignmentExecution({
    assignmentId,
    refetch,
    updateAssignmentLocally,
  });

  const { technicianLocation } = useAssignmentRealtime({
    assignmentId,
    assignmentStatus: assignment?.status,
    role: "TECHNICIAN",
    enabled: Boolean(assignment),
  });

  const [isStopsDrawerOpen, setIsStopsDrawerOpen] = useState<boolean>(false);
  const [stopToFinalize, setStopToFinalize] = useState<AssignmentStopDetail | null>(null);
  const [isFinalizeDrawerOpen, setIsFinalizeDrawerOpen] = useState<boolean>(false);

  const handleOpenFinalize = (stop: AssignmentStopDetail) => {
    setStopToFinalize(stop);
    setIsFinalizeDrawerOpen(true);
  };

  // 1. Estado de carga inicial con Skeleton
  if (isLoading) {
    return <AssignmentDetailSkeleton />;
  }

  // 2. Estado de Asignación no encontrada (404) o sin permisos
  if (isNotFound) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-50 p-6 select-none">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center border-0 shadow-lg space-y-4">
          <div className="size-16 rounded-full bg-slate-100 text-slate-500 mx-auto flex items-center justify-center">
            <SearchX className="size-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-900">
              Asignación no encontrada
            </h3>
            <p className="text-sm text-slate-500">
              La asignación solicitada no existe, fue eliminada o no cuentas con permisos para visualizarla.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/mis-asignaciones"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-[#0e4dcb] text-white hover:bg-blue-700 transition"
            >
              <ArrowLeft className="size-4" />
              <span>Volver a mis asignaciones</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Estado de error de red o backend
  if (error || !assignment) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-50 p-6 select-none">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 text-center border-0 shadow-lg space-y-4">
          <div className="size-16 rounded-full bg-rose-50 text-rose-500 mx-auto flex items-center justify-center">
            <AlertCircle className="size-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-900">
              Error al cargar asignación
            </h3>
            <p className="text-sm text-slate-500">
              {error ?? "Ocurrió un problema inesperado al obtener los datos de la asignación."}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={refetch}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-[#0e4dcb] text-white hover:bg-blue-700 transition cursor-pointer border-0"
            >
              <RefreshCw className="size-4" />
              <span>Reintentar</span>
            </button>
            <Link
              href="/mis-asignaciones"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
            >
              <span>Volver</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Vista exitosa de Detalle de Asignación Móvil y Desktop
  const activeStopState = deriveActiveStopState(assignment.stops);

  return (
    <div className="relative w-full h-full overflow-hidden select-none touch-none overscroll-none bg-slate-100">
      {/* A. Mapa interactivo OpenStreetMap a pantalla completa con pines dinámicos y trazos viales */}
      <div className="absolute inset-0 w-full h-full z-0">
        <AssignmentDetailMapDynamic
          assignmentId={assignment.id}
          assignmentStatus={assignment.status}
          startLatitude={assignment.startLatitude}
          startLongitude={assignment.startLongitude}
          stops={assignment.stops}
          selectedStop={selectedStop}
          technicianLocation={technicianLocation}
          hideZoomControls={isStopsDrawerOpen || isFinalizeDrawerOpen}
        />
      </div>

      {/* B. Contenedor móvil superior: Header principal y Card de parada activa sin colisión */}
      <div className="lg:hidden absolute top-[88px] inset-x-3 sm:inset-x-4 z-[900] pointer-events-none select-none flex flex-col gap-3 transition-all duration-300 ease-in-out">
        <div className="pointer-events-auto">
          <TechnicianAssignmentMobileHeader assignment={assignment} />
        </div>

        {assignment.status === "IN_PROGRESS" && activeStopState && (
          <div className="pointer-events-auto transition-all duration-300 ease-in-out">
            <TechnicianActiveStopCard
              cardState={activeStopState}
              onStartTransit={startTransit}
              onNavigate={openNavigation}
              onArrive={arriveAtStop}
              onFinalize={handleOpenFinalize}
              isSubmitting={isSubmitting}
            />
          </div>
        )}
      </div>

      {/* C. Botón flotante inferior ancho 'Comenzar' / 'Ver detalles' (exclusivo móvil, visible cuando los drawers están cerrados) */}
      {!isStopsDrawerOpen && !isFinalizeDrawerOpen && (
        <TechnicianViewStopsButton
          totalStops={assignment.totalStops}
          assignmentStatus={assignment.status}
          onClick={() => setIsStopsDrawerOpen(true)}
          className="lg:hidden"
        />
      )}

      {/* D. Drawer de Paradas estilo Card Flotante (listado completo de visitas) */}
      <TechnicianStopsDrawer
        open={isStopsDrawerOpen}
        onOpenChange={setIsStopsDrawerOpen}
        stops={assignment.stops}
        selectedStop={selectedStop}
        totalStops={assignment.totalStops}
        completedStops={assignment.completedStops}
        scheduledDate={assignment.scheduledDate}
        totalDistanceKm={assignment.totalDistanceKm}
        assignmentStatus={assignment.status}
        onStartAssignment={startAssignment}
        isStarting={isSubmitting && activeAction === "start"}
      />

      {/* H. Drawer de Finalización de Parada */}
      <TechnicianFinalizeStopDrawer
        open={isFinalizeDrawerOpen}
        onOpenChange={setIsFinalizeDrawerOpen}
        stop={stopToFinalize}
        onCompleteStop={completeStop}
        isSubmitting={isSubmitting && activeAction === "complete"}
      />

      {/* F. Ficha técnica de parada en Escritorio (Framer Motion >= 1024px) */}
      <div className="hidden lg:block">
        <AssignmentDetailStopSheet
          stop={selectedStop}
          onClose={clearSelectedStop}
        />
      </div>

      {/* G. Layout Fallback para pantallas de escritorio (>= 1024px) con tarjeta lateral interactiva */}
      <AssignmentDetailCard
        assignment={assignment}
        selectedStop={selectedStop}
        onSelectStop={selectStop}
        showBackButton={true}
        backHref="/mis-asignaciones"
        backLabel="Volver a mis asignaciones"
        showMetricsCards={false}
        customStopsList={
          <TechnicianStopsList
            stops={assignment.stops}
            selectedStop={selectedStop}
            onSelectStop={selectStop}
            showHeader={true}
          />
        }
      />
    </div>
  );
}

export default TechnicianAssignmentDetailView;
