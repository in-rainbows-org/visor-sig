"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowLeft, RefreshCw, SearchX, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAssignmentDetail } from "../../hooks/use-assignment-detail";
import { useAssignmentRealtime } from "../../hooks/use-assignment-realtime";
import { AssignmentDetailSkeleton } from "../elements/detail/assignment-detail-skeleton";
import { AssignmentDetailCard } from "../elements/detail/assignment-detail-card";
import { AssignmentDetailStopSheet } from "../elements/detail/assignment-detail-stop-sheet";
import { AssignmentDetailScheduleCard } from "../elements/detail/assignment-detail-schedule-card";
import { AssignmentDetailMobileHeader } from "../elements/detail/assignment-detail-mobile-header";
import { RealtimeConnectionBadge } from "../elements/realtime/realtime-connection-badge";

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
    updateAssignmentLocally,
  } = useAssignmentDetail(assignmentId);

  const { connectionStatus, technicianLocation } = useAssignmentRealtime({
    assignmentId,
    assignmentStatus: assignment?.status,
    role: "ADMIN",
    enabled: Boolean(assignment),
    onStopStatusUpdated: (event) => {
      updateAssignmentLocally((prev) => {
        const updatedStops = prev.stops.map((stop) => {
          if (stop.id === event.stopId) {
            return {
              ...stop,
              status: event.status,
              inTransitAt: event.inTransitAt ?? stop.inTransitAt,
              arrivedAt: event.arrivedAt ?? stop.arrivedAt,
              completedAt: event.completedAt ?? stop.completedAt,
              meterReading: event.meterReading ?? stop.meterReading,
              observation: event.observation ?? stop.observation,
              evidencePhotoUrl: event.evidencePhotoUrl ?? stop.evidencePhotoUrl,
            };
          }
          return stop;
        });

        const nextStatus = event.isAssignmentCompleted ? "COMPLETED" : prev.status;
        const nextCompletedAt = event.isAssignmentCompleted
          ? (event.completedAt ?? new Date())
          : prev.completedAt;

        return {
          ...prev,
          status: nextStatus,
          completedAt: nextCompletedAt,
          stops: updatedStops,
        };
      });
    },
    onAssignmentCompleted: (event) => {
      updateAssignmentLocally((prev) => ({
        ...prev,
        status: "COMPLETED",
        completedAt: event.completedAt,
      }));
    },
  });

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
          assignmentId={assignment.id}
          assignmentStatus={assignment.status}
          startLatitude={assignment.startLatitude}
          startLongitude={assignment.startLongitude}
          stops={assignment.stops}
          selectedStop={selectedStop}
          technicianLocation={technicianLocation}
          onSelectStop={selectStop}
          hideZoomControls={isMobileDrawerOpen}
        />
      </div>

      {/* 2. Card superior móvil: Volver, estado, fechas operativas y progreso (se oculta suavemente al seleccionar parada) */}
      <AnimatePresence>
        {!selectedStop && (
          <motion.div
            key="assignment-detail-mobile-header"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.24, ease: "easeOut" }}
            className="lg:hidden absolute top-[88px] inset-x-3 sm:inset-x-4 z-[900] pointer-events-auto select-none"
          >
            <AssignmentDetailMobileHeader
              assignment={assignment}
              headerExtra={
                assignment.status === "IN_PROGRESS" ? (
                  <RealtimeConnectionBadge status={connectionStatus} />
                ) : null
              }
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Card lateral flotante izquierdo (Escritorio - Idéntico al Wizard) */}
      <AssignmentDetailCard
        assignment={assignment}
        selectedStop={selectedStop}
        onSelectStop={selectStop}
        showScheduledDate={false}
        headerExtra={
          assignment.status === "IN_PROGRESS" ? (
            <RealtimeConnectionBadge status={connectionStatus} />
          ) : null
        }
      />

      {/* 4. Card superior derecho flotante de fechas y horarios (Escritorio >= 1024px) */}
      <AssignmentDetailScheduleCard assignment={assignment} />

      {/* 5. Card flotante inferior emergente de la parada (Framer Motion) */}
      <AssignmentDetailStopSheet
        stop={selectedStop}
        startLatitude={assignment.startLatitude}
        startLongitude={assignment.startLongitude}
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
              headerExtra={
                assignment.status === "IN_PROGRESS" ? (
                  <RealtimeConnectionBadge status={connectionStatus} />
                ) : null
              }
              onSelectStop={(s) => {
                selectStop(s);
                setIsMobileDrawerOpen(false);
              }}
              showBackButton={false}
              showScheduledDate={false}
              className="flex relative inset-auto w-full h-full top-auto bottom-auto left-auto rounded-none border-0 shadow-none z-0"
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default AssignmentDetailView;
