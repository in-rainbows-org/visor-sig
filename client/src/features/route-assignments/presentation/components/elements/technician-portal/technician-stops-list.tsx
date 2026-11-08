"use client";

import React from "react";
import { Calendar, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  AssignmentStopDetail,
  AssignmentStopStatus,
} from "@/features/route-assignments/domain/entities/assignment-detail.entity";

export interface TechnicianStopsListProps {
  stops: readonly AssignmentStopDetail[];
  selectedStop: AssignmentStopDetail | null;
  onSelectStop?: (stop: AssignmentStopDetail) => void;
  showHeader?: boolean;
  className?: string;
}

function formatTime(date: Date | string | null | undefined): string {
  if (!date) return "--";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "--";
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  } catch {
    return "--";
  }
}

function StopStatusBadge({ status }: { status: AssignmentStopStatus }) {
  switch (status) {
    case "COMPLETED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-50 text-emerald-700 border-0 shadow-none shrink-0">
          <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span>Completa</span>
        </span>
      );
    case "IN_TRANSIT":
    case "ARRIVED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-amber-50 text-amber-700 border-0 shadow-none shrink-0">
          <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
          <span>En proceso</span>
        </span>
      );
    case "FAILED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border-0 shadow-none shrink-0">
          <span className="size-1.5 rounded-full bg-rose-500 shrink-0" />
          <span>Fallida</span>
        </span>
      );
    case "PENDING":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-slate-200/80 text-slate-600 border-0 shadow-none shrink-0">
          <span className="size-1.5 rounded-full bg-slate-400 shrink-0" />
          <span>Pendiente</span>
        </span>
      );
  }
}

export function TechnicianStopsList({
  stops,
  selectedStop,
  onSelectStop,
  showHeader = true,
  className = "",
}: TechnicianStopsListProps) {
  if (stops.length === 0) {
    return (
      <div className="pt-2 text-center py-6 text-xs text-slate-400 font-medium">
        No hay paradas registradas en esta asignación.
      </div>
    );
  }

  // Filtrado en dos secciones: Pendientes (arriba) y Finalizadas (abajo)
  const pendingStops = stops.filter(
    (s) => s.status !== "COMPLETED" && s.status !== "FAILED"
  );
  const finishedStops = stops.filter(
    (s) => s.status === "COMPLETED" || s.status === "FAILED"
  );

  const renderStopItem = (stop: AssignmentStopDetail) => {
    const isSelected = selectedStop?.id === stop.id;

    let llegadaText = "--";
    let completadoText = "--";

    if (stop.status === "COMPLETED") {
      llegadaText = formatTime(stop.arrivedAt ?? stop.inTransitAt);
      completadoText = formatTime(stop.completedAt);
    } else if (stop.status === "IN_TRANSIT" || stop.status === "ARRIVED") {
      llegadaText = formatTime(stop.arrivedAt ?? stop.inTransitAt);
      completadoText = "--";
    } else if (stop.status === "FAILED") {
      llegadaText = formatTime(stop.arrivedAt ?? stop.inTransitAt);
      completadoText = formatTime(stop.completedAt);
    } else {
      // PENDING
      llegadaText = "--";
      completadoText = "--";
    }

    return (
      <div
        key={stop.id}
        role="button"
        tabIndex={0}
        onClick={() => onSelectStop?.(stop)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelectStop?.(stop);
          }
        }}
        className={cn(
          "w-full rounded-2xl p-3 sm:p-3.5 border-0 shadow-none transition-all cursor-pointer select-none space-y-2.5 text-left focus:outline-none",
          isSelected
            ? "bg-blue-50/90 ring-2 ring-blue-500"
            : "bg-slate-100/70 hover:bg-slate-200/60"
        )}
      >
        {/* 1. Código fijo arriba con número de orden de parada */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "size-6 rounded-full font-bold text-[11px] flex items-center justify-center shrink-0 transition-colors",
              isSelected ? "bg-blue-600 text-white" : "bg-[#0e4dcb] text-white"
            )}
          >
            {stop.orderIndex}
          </span>
          <span className="text-[11px] font-bold text-slate-500 font-mono tracking-tight">
            Código #{stop.fixedCode ?? "S/C"}
          </span>
        </div>

        {/* 2. Nombre del cliente y badge de estado a la derecha */}
        <div className="flex items-start justify-between gap-2.5">
          <h6 className="text-xs sm:text-[13px] font-bold text-slate-900 leading-snug line-clamp-2 break-words flex-1 min-w-0">
            {stop.name || "Sin titular registrado"}
          </h6>
          <div className="shrink-0 pt-0.5">
            <StopStatusBadge status={stop.status} />
          </div>
        </div>

        {/* 3. Fila inferior: Llegada y Fin en dos columnas */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
          <div className="flex items-center gap-2 bg-white/80 rounded-xl px-2.5 py-1.5 border-0 shadow-none">
            <Calendar className="size-3.5 sm:size-4 text-slate-400 shrink-0" />
            <div className="flex items-baseline gap-1.5 min-w-0">
              <span className="text-[11px] sm:text-xs text-slate-500 font-medium">
                Llegada:
              </span>
              <span className="text-xs sm:text-[13px] font-bold text-slate-800 font-mono truncate">
                {llegadaText}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-white/80 rounded-xl px-2.5 py-1.5 border-0 shadow-none">
            <CheckCircle2 className="size-3.5 sm:size-4 text-emerald-600/90 shrink-0" />
            <div className="flex items-baseline gap-1.5 min-w-0">
              <span className="text-[11px] sm:text-xs text-slate-500 font-medium">
                Fin:
              </span>
              <span className="text-xs sm:text-[13px] font-bold text-slate-800 font-mono truncate">
                {completadoText}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={cn("pt-1 space-y-4 shrink-0 flex flex-col", className)}>
      {/* Cabecera general opcional */}
      {showHeader && (
        <div className="flex items-center justify-between px-0.5 shrink-0">
          <h5 className="text-xs font-bold text-slate-800 tracking-tight">
            Detalle de paradas
          </h5>
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
            {stops.length} {stops.length === 1 ? "parada" : "paradas"}
          </span>
        </div>
      )}

      {/* Sección 1: Pendientes */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-0.5 shrink-0">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-amber-500 shrink-0" />
            <h6 className="text-xs font-bold text-slate-800 tracking-tight">
              Pendientes
            </h6>
          </div>
          <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
            {pendingStops.length} {pendingStops.length === 1 ? "parada" : "paradas"}
          </span>
        </div>

        {pendingStops.length === 0 ? (
          <div className="text-center py-4 px-3 bg-slate-50/80 rounded-2xl text-xs text-slate-400 font-medium border-0">
            No hay paradas pendientes en esta ruta.
          </div>
        ) : (
          <div className="space-y-2.5">
            {pendingStops.map(renderStopItem)}
          </div>
        )}
      </div>

      {/* Sección 2: Finalizadas */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-0.5 shrink-0">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
            <h6 className="text-xs font-bold text-slate-800 tracking-tight">
              Finalizadas
            </h6>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
            {finishedStops.length} {finishedStops.length === 1 ? "parada" : "paradas"}
          </span>
        </div>

        {finishedStops.length === 0 ? (
          <div className="text-center py-4 px-3 bg-slate-50/80 rounded-2xl text-xs text-slate-400 font-medium border-0">
            Aún no se han completado paradas.
          </div>
        ) : (
          <div className="space-y-2.5">
            {finishedStops.map(renderStopItem)}
          </div>
        )}
      </div>
    </div>
  );
}

export default TechnicianStopsList;
