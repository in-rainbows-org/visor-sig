"use client";

import React from "react";
import type { RouteAssignmentPieStats } from "../../../../domain/entities/route-assignment-stats.entity";
import type { RouteAssignment } from "../../../../domain/entities/route-assignment.entity";
import { RouteStatusPieChart } from "./route-status-pie-chart";
import { StackedBars } from "./stacked-bars";

export type RouteStatsSectionProps = {
  pieStats: RouteAssignmentPieStats;
  assignments: RouteAssignment[];
};

export function RouteStatsSection({
  pieStats,
  assignments,
}: RouteStatsSectionProps) {
  return (
    <section aria-label="Estadísticas de asignación de rutas" className="w-full space-y-3 sm:space-y-4">
      {/* Título de la sección de estadísticas */}
      <div className="px-1">
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Resumen Estadístico
        </h3>
      </div>

      {/* Cuadrícula 50/50 para ambas tarjetas estadísticas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-stretch">
        {/* Tarjeta Izquierda (50%): Distribución por Estado (Dona SVG) */}
        <div className="w-full flex flex-col h-full">
          <RouteStatusPieChart stats={pieStats} />
        </div>

        {/* Tarjeta Derecha (50%): Rendimiento por Ruta (StackedBars Bencho) */}
        <div className="w-full flex flex-col h-full">
          <StackedBars
            colour="Colour"
            bars={25}
            gap={5}
            assignments={assignments}
          />
        </div>
      </div>
    </section>
  );
}
