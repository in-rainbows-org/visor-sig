"use client";

import React from "react";
import type { RouteAssignmentPieStats } from "../../../../domain/entities/route-assignment-stats.entity";

export type RouteStatusPieChartProps = {
  stats: RouteAssignmentPieStats;
};

export function RouteStatusPieChart({ stats }: RouteStatusPieChartProps) {
  const { total, periodLabel, metrics } = stats;
  const formattedTotal = new Intl.NumberFormat("es-ES").format(total);

  // Parámetros geométricos para el SVG Donut
  const size = 240;
  const strokeWidth = 36;
  const radius = (size - strokeWidth) / 2 - 6; // 96
  const circumference = 2 * Math.PI * radius;

  // Cálculo acumulativo de offsets para cada segmento
  let accumulatedLength = 0;
  const segments = metrics.map((item) => {
    const ratio = total > 0 ? item.count / total : 0;
    const length = ratio * circumference;
    const offset = -accumulatedLength;
    accumulatedLength += length;

    return {
      ...item,
      strokeDasharray: `${length} ${circumference - length}`,
      strokeDashoffset: offset,
    };
  });

  return (
    <div className="bg-white rounded-[28px] sm:rounded-[32px] p-5 sm:p-7 border-0 shadow-none flex flex-col justify-between h-full select-none">
      {/* Cabecera de la tarjeta */}
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
          Distribución de asignaciones
        </h4>
        <span className="text-xs text-slate-500 font-medium">
          {periodLabel || "Últimos 30 días"}
        </span>
      </div>

      {/* Contenido: Gráfica Donut + Métricas */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 my-auto">
        {/* Dona SVG centrada */}
        <div className="relative w-[200px] h-[200px] sm:w-[220px] sm:h-[220px] shrink-0 flex items-center justify-center">
          <svg
            viewBox={`0 0 ${size} ${size}`}
            className="w-full h-full -rotate-90 transform"
            aria-label="Gráfico de distribución en dona de asignaciones"
          >
            {/* Pista base si no hay datos */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#f1f5f9"
              strokeWidth={strokeWidth}
            />

            {/* Segmentos de estado */}
            {total > 0 &&
              segments.map((seg) => {
                if (seg.count === 0) return null;
                return (
                  <circle
                    key={seg.key}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={seg.colorHex}
                    strokeWidth={strokeWidth}
                    strokeDasharray={seg.strokeDasharray}
                    strokeDashoffset={seg.strokeDashoffset}
                    strokeLinecap="butt"
                    className="transition-all duration-500 ease-out"
                  />
                );
              })}
          </svg>

          {/* Agujero Central: Total y Etiqueta */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none select-none">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
              {formattedTotal}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-600 mt-1 uppercase tracking-wider">
              Rutas
            </span>
          </div>
        </div>

        {/* Información a la derecha: completamente plana */}
        <div className="w-full sm:flex-1 space-y-2 min-w-0">
          {metrics.map((item) => (
            <div
              key={item.key}
              className="rounded-2xl bg-slate-50/80 hover:bg-slate-100/80 px-3.5 py-2.5 flex items-center justify-between gap-3 border-0 shadow-none transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.colorHex }}
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs sm:text-sm font-semibold text-slate-700 truncate">
                    {item.label}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {item.count} {item.count === 1 ? "ruta" : "rutas"}
                  </span>
                </div>
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-900 shrink-0 font-mono">
                {item.percentageFormatted}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
