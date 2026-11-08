"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type AssignmentDetailProgressProps = {
  totalStops: number;
  completedStops?: number;
  stops?: readonly { status: string }[];
  className?: string;
  title?: string;
};

export function AssignmentDetailProgress({
  totalStops,
  completedStops = 0,
  stops,
  className,
  title = "Progreso de la asignación",
}: AssignmentDetailProgressProps) {
  // Se cuentan únicamente las paradas en estado COMPLETED o FAILED
  const effectiveCompleted = stops
    ? stops.filter(
        (s) =>
          s.status?.toUpperCase() === "COMPLETED" ||
          s.status?.toUpperCase() === "FAILED"
      ).length
    : completedStops;

  const effectiveTotal = stops && stops.length > 0 ? stops.length : totalStops;

  const percentage =
    effectiveTotal > 0
      ? Math.min(100, Math.round((effectiveCompleted / effectiveTotal) * 100))
      : 0;

  return (
    <div className={cn("pt-1.5 shrink-0 space-y-2", className)}>
      {/* Fila de Título y Conteo */}
      <div className="flex items-center justify-between text-xs">
        <h5 className="font-bold text-slate-800 tracking-tight">
          {title}
        </h5>
        <span className="font-semibold text-slate-500 text-[11px] sm:text-xs">
          {effectiveCompleted} de {effectiveTotal} completadas
        </span>
      </div>

      {/* Barra de Progreso más gorda / alta con porcentaje blanco centrado únicamente dentro de la parte verde */}
      <div className="w-full h-7 sm:h-[30px] bg-slate-100 rounded-full overflow-hidden p-0.5 border-0 shadow-none relative">
        <div
          className={cn(
            "h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out flex items-center justify-center overflow-hidden",
            percentage > 0 ? "min-w-[42px]" : "w-0 min-w-0"
          )}
          style={{ width: `${percentage}%` }}
        >
          {percentage > 0 && (
            <span className="text-white text-xs sm:text-sm font-bold leading-none select-none tracking-tight px-1.5">
              {percentage}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default AssignmentDetailProgress;
