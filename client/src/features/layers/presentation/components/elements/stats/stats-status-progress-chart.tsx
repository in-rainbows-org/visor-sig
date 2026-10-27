"use client";

import React from "react";
import type { CodigoFijoStatistics } from "@/features/layers/domain/entities/codigo-fijo-statistics.entity";
import { codigoFijoStatisticsMapper } from "@/features/layers/infrastructure/mappers/codigo-fijo-statistics.mapper";

export interface StatsStatusProgressChartProps {
  stats: CodigoFijoStatistics;
}

export function StatsStatusProgressChart({ stats }: StatsStatusProgressChartProps) {
  const statusMetrics = codigoFijoStatisticsMapper.toStatusMetrics(stats);

  const total = stats.total > 0 ? stats.total : 0;

  return (
    <div className="bg-white rounded-[28px] sm:rounded-[32px] p-5 sm:p-7 border-0 shadow-none flex flex-col justify-between h-full select-none">
      {/* Cabecera de la tarjeta: solo título sin subtítulo */}
      <div className="mb-4">
        <h4 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
          Cantidad por estado
        </h4>
      </div>

      {/* 5 Filas de Progreso */}
      <div className="space-y-3.5 sm:space-y-4 my-auto">
        {statusMetrics.map((item) => {
          // El porcentaje de la barra representa su proporción respecto al total
          const ratio = total > 0 ? (item.count / total) * 100 : 0;
          const formattedCount = new Intl.NumberFormat("es-ES").format(item.count);

          return (
            <div key={item.key} className="flex items-center gap-3 sm:gap-4">
              {/* Etiqueta del estado a la izquierda */}
              <div className="w-24 sm:w-28 flex items-center gap-2.5 shrink-0">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: item.colorHex }}
                />
                <span className="text-xs sm:text-sm font-semibold text-slate-700 truncate">
                  {item.label}
                </span>
              </div>

              {/* Barra de progreso en el centro: más gordita y alta (h-7 sm:h-8) */}
              <div className="flex-1 h-7 sm:h-8 bg-slate-100 rounded-full overflow-hidden p-1">
                <div
                  className="h-full rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${Math.max(ratio, item.count > 0 ? 3 : 0)}%`,
                    backgroundColor: item.colorHex,
                  }}
                />
              </div>

              {/* Conteo a la derecha */}
              <span className="text-xs sm:text-sm font-bold text-slate-900 w-14 sm:w-16 text-right shrink-0 font-mono">
                {formattedCount}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
