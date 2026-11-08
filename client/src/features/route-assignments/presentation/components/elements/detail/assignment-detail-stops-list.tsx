"use client";

import React from "react";
import { Calendar, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  AssignmentStopDetail,
  AssignmentStopStatus,
} from "@/features/route-assignments/domain/entities/assignment-detail.entity";

export type AssignmentDetailStopsListProps = {
  stops: readonly AssignmentStopDetail[];
  selectedStop: AssignmentStopDetail | null;
  onSelectStop?: (stop: AssignmentStopDetail) => void;
};

function formatTime(date: Date | null): string {
  if (!date) return "--";
  try {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  } catch {
    return "--";
  }
}

function StopStatusBadge({ status }: { status: AssignmentStopStatus }) {
  const normalized = (status ? String(status).toUpperCase().trim() : "PENDING") as AssignmentStopStatus;
  switch (normalized) {
    case "COMPLETED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-50 text-emerald-700 border-0 shadow-none shrink-0">
          <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span>Completa</span>
        </span>
      );
    case "ARRIVED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-amber-50 text-amber-700 border-0 shadow-none shrink-0">
          <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
          <span>En proceso</span>
        </span>
      );
    case "IN_TRANSIT":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-sky-50 text-sky-700 border-0 shadow-none shrink-0">
          <span className="size-1.5 rounded-full bg-sky-500 shrink-0" />
          <span>En tránsito</span>
        </span>
      );
    case "FAILED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-rose-50 text-rose-700 border-0 shadow-none shrink-0">
          <span className="size-1.5 rounded-full bg-rose-500 shrink-0" />
          <span>Fallida</span>
        </span>
      );
    case "PENDING":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-slate-100 text-slate-600 border-0 shadow-none shrink-0">
          <span className="size-1.5 rounded-full bg-slate-400 shrink-0" />
          <span>Pendiente</span>
        </span>
      );
  }
}

export function AssignmentDetailStopsList({
  stops,
  selectedStop,
  onSelectStop,
}: AssignmentDetailStopsListProps) {
  if (stops.length === 0) {
    return (
      <div className="pt-2 text-center py-6 text-xs text-slate-400">
        No hay paradas registradas en esta asignación.
      </div>
    );
  }

  return (
    <div className="pt-1 space-y-2.5 shrink-0 flex flex-col">
      <div className="flex items-center justify-between px-0.5 shrink-0">
        <h5 className="text-xs font-bold text-slate-800 tracking-tight">
          Detalle de paradas
        </h5>
        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
          {stops.length} {stops.length === 1 ? "parada" : "paradas"}
        </span>
      </div>

      {/* Contenedor ampliado de paradas con scroll interno */}
      <div className="min-h-[140px] max-h-[390px] overflow-y-auto space-y-2.5 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
        {stops.map((stop) => {
          const isSelected = selectedStop?.id === stop.id;

          let llegadaLabel = "Llegada:";
          let llegadaText = "--";
          let completadoText = "--";

          if (stop.status === "COMPLETED") {
            llegadaText = formatTime(stop.arrivedAt ?? stop.inTransitAt);
            completadoText = formatTime(stop.completedAt);
          } else if (stop.status === "IN_TRANSIT") {
            llegadaLabel = "Ida:";
            llegadaText = formatTime(stop.inTransitAt);
            completadoText = "--";
          } else if (stop.status === "ARRIVED") {
            llegadaLabel = "Llegada:";
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
              onClick={() => onSelectStop?.(stop)}
              className={cn(
                "w-full rounded-2xl p-3 sm:p-3.5 border transition-all cursor-pointer select-none space-y-2.5",
                isSelected
                  ? "bg-blue-50/70 border-blue-500 shadow-sm ring-1 ring-blue-500/20"
                  : "bg-slate-50/80 border-slate-100 hover:bg-slate-100/70 hover:border-slate-200"
              )}
            >
              {/* 1. Código fijo arriba (con número de orden de parada) */}
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "size-6 rounded-full font-bold text-[11px] flex items-center justify-center shrink-0 transition-colors",
                    isSelected
                      ? "bg-blue-600 text-white"
                      : "bg-[#0e4dcb] text-white"
                  )}
                >
                  {stop.orderIndex}
                </span>
                <span className="text-[11px] font-bold text-slate-500 font-mono tracking-tight">
                  Código #{stop.fixedCode ?? "S/C"}
                </span>
              </div>

              {/* 2. Parte superior: Debajo el name (1 o 2 filas máx) y a la derecha el status */}
              <div className="flex items-start justify-between gap-2.5">
                <h6 className="text-xs sm:text-[13px] font-bold text-slate-900 leading-snug line-clamp-2 break-words flex-1 min-w-0">
                  {stop.name || "Sin titular registrado"}
                </h6>
                <div className="shrink-0 pt-0.5">
                  <StopStatusBadge status={stop.status} />
                </div>
              </div>

              {/* 3. Fila inferior: Llegada y fin en dos columnas más grandes */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60">
                <div className="flex items-center gap-2 bg-white/70 rounded-xl px-2.5 py-1.5 border border-slate-100/80">
                  <Calendar className="size-3.5 sm:size-4 text-slate-400 shrink-0" />
                  <div className="flex items-baseline gap-1.5 min-w-0">
                    <span className="text-[11px] sm:text-xs text-slate-500 font-medium">{llegadaLabel}</span>
                    <span className="text-xs sm:text-[13px] font-bold text-slate-800 font-mono truncate">
                      {llegadaText}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white/70 rounded-xl px-2.5 py-1.5 border border-slate-100/80">
                  <CheckCircle2 className="size-3.5 sm:size-4 text-emerald-600/90 shrink-0" />
                  <div className="flex items-baseline gap-1.5 min-w-0">
                    <span className="text-[11px] sm:text-xs text-slate-500 font-medium">Fin:</span>
                    <span className="text-xs sm:text-[13px] font-bold text-slate-800 font-mono truncate">
                      {completadoText}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AssignmentDetailStopsList;
