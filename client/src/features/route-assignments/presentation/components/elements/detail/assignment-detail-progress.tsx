"use client";

import React from "react";

export type AssignmentDetailProgressProps = {
  totalStops: number;
  completedStops: number;
};

export function AssignmentDetailProgress({
  totalStops,
  completedStops,
}: AssignmentDetailProgressProps) {
  const percentage =
    totalStops > 0 ? Math.min(100, Math.round((completedStops / totalStops) * 100)) : 0;

  return (
    <div className="pt-2 shrink-0 space-y-2">
      {/* Fila de Título y Conteo */}
      <div className="flex items-center justify-between text-xs">
        <h5 className="font-bold text-slate-800 tracking-tight">
          Progreso de la asignación
        </h5>
        <span className="font-semibold text-slate-500">
          {completedStops} de {totalStops} completadas
        </span>
      </div>

      {/* Barra de Progreso */}
      <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border-0 shadow-none">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
