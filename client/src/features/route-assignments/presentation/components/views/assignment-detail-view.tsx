"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AlertCircle, ArrowLeft, RefreshCw, SearchX, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAssignmentDetail } from "../../hooks/use-assignment-detail";
import { AssignmentDetailSkeleton } from "../elements/detail/assignment-detail-skeleton";
import { AssignmentDetailCard } from "../elements/detail/assignment-detail-card";
import { AssignmentDetailStopSheet } from "../elements/detail/assignment-detail-stop-sheet";

// Carga dinámica exclusiva en cliente para evitar fallos de window / SSR con Leaflet
const AssignmentDetailMapDynamic = dynamic(
  () => import("../elements/detail/assignment-detail-map").then((mod) => mod.AssignmentDetailMap),
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

export type AssignmentDetailViewProps = {
  assignmentId: string;
};

export function AssignmentDetailView({ assignmentId }: AssignmentDetailViewProps) {
  const {
    assignment,
    isLoading,
    error,
    isNotFound,
    selectedStop,
    selectStop,
    clearSelectedStop,
    refetch,
  } = useAssignmentDetail(assignmentId);

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  // 1. Estado de carga con Skeleton
  if (isLoading) {
    return <AssignmentDetailSkeleton />;
  }

  // 2. Estado de Asignación no encontrada (404)
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
              href="/asignacion-rutas"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-[#0e4dcb] text-white hover:bg-blue-700 transition"
            >
              <ArrowLeft className="size-4" />
              <span>Volver a asignaciones</span>
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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-[#0e4dcb] text-white hover:bg-blue-700 transition cursor-pointer"
            >
              <RefreshCw className="size-4" />
              <span>Reintentar</span>
            </button>
            <Link
              href="/asignacion-rutas"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
            >
              <span>Volver</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Vista exitosa: Card lateral, Mapa de fondo OpenStreetMap y Card flotante de parada
  return (
    <div className="relative w-full h-full overflow-hidden select-none touch-none overscroll-none bg-slate-100">
      {/* 1. Mapa de fondo interactivo OpenStreetMap a pantalla completa */}
      <div className="absolute inset-0 w-full h-full z-0">
        <AssignmentDetailMapDynamic
          assignmentStatus={assignment.status}
          startLatitude={assignment.startLatitude}
          startLongitude={assignment.startLongitude}
          stops={assignment.stops}
          selectedStop={selectedStop}
          onSelectStop={selectStop}
        />
      </div>

      {/* 2. Botón flotante superior izquierdo 'Volver a asignaciones' (exclusivo móviles y tablets < 1024px) */}
      <div className="lg:hidden absolute top-[92px] left-4 z-[900] pointer-events-auto select-none">
        <Link
          href="/asignacion-rutas"
          className="h-9 px-3.5 rounded-full text-xs font-semibold bg-white/95 backdrop-blur-md text-slate-700 hover:bg-white hover:text-slate-900 border border-slate-200/80 shadow-md inline-flex items-center gap-1.5 transition active:scale-95 cursor-pointer select-none"
        >
          <ArrowLeft className="size-4 stroke-[2.5] text-slate-600" />
          <span>Volver a asignaciones</span>
        </Link>
      </div>

      {/* 3. Card lateral flotante izquierdo (Escritorio - Idéntico al Wizard) */}
      <AssignmentDetailCard
        assignment={assignment}
        selectedStop={selectedStop}
        onSelectStop={selectStop}
      />

      {/* 4. Card flotante inferior emergente de la parada (Framer Motion) */}
      <AssignmentDetailStopSheet
        stop={selectedStop}
        onClose={clearSelectedStop}
      />

      {/* 5. Soporte Móvil: Botón flotante inferior estilo Nueva Asignación (azul, centrado, rounded-full) */}
      {!isMobileDrawerOpen && (
        <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40 pointer-events-auto select-none">
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="w-full h-12 min-h-[48px] rounded-full bg-gradient-to-r from-[#0e4dcb] via-[#1a66e5] to-[#2579f6] text-white font-semibold text-xs sm:text-sm shadow-none border-0 outline-none ring-0 flex items-center justify-center active:scale-[0.99] transition-transform duration-150 cursor-pointer select-none"
          >
            <span>Ver detalle de asignación</span>
          </button>
        </div>
      )}

      {/* 6. Sheet Móvil Desplegable (Idéntico a RouteCreationMobileWizard) */}
      <Sheet open={isMobileDrawerOpen} onOpenChange={setIsMobileDrawerOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="fixed bottom-0 left-0 right-0 h-[88vh] max-h-[88vh] w-full p-0 m-0 bg-white border-0 shadow-2xl rounded-t-3xl flex flex-col z-[2000] overflow-hidden outline-none data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:top-auto data-[side=bottom]:h-[88vh] data-[side=bottom]:max-h-[88vh]"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Detalle de Asignación</SheetTitle>
          </SheetHeader>

          {/* Barra superior de cierre móvil (sin título duplicado) */}
          <div className="flex items-center justify-end px-5 pt-3 pb-2 shrink-0 bg-white border-b border-slate-100">
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(false)}
              className="size-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 transition-all cursor-pointer border-0"
              aria-label="Cerrar detalle"
            >
              <X className="size-4 stroke-[2.5]" />
            </button>
          </div>

          {/* Contenedor del detalle adaptado a móvil (sin botón volver interno) */}
          <div className="flex-1 min-h-0 overflow-hidden relative bg-white flex flex-col">
            <AssignmentDetailCard
              assignment={assignment}
              selectedStop={selectedStop}
              onSelectStop={(s) => {
                selectStop(s);
                setIsMobileDrawerOpen(false);
              }}
              showBackButton={false}
              className="flex relative inset-auto w-full h-full top-auto bottom-auto left-auto rounded-none border-0 shadow-none z-0"
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default AssignmentDetailView;
