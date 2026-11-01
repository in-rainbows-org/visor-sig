"use client";

import React, { useState } from "react";
import { PageHero } from "@/features/shared/presentation/components/layout/page-hero";
import {
  MOCK_ROUTE_ASSIGNMENTS,
  getRouteAssignmentPieStats,
  MOCK_WORKERS,
} from "../../data/mock-route-assignments";
import { RouteAssignment } from "../../../domain/entities/route-assignment.entity";

import { RouteStatsSection } from "../elements/stats/route-stats-section";
import { RouteHistorySection } from "../elements/history/route-history-section";

export function RouteAssignmentsView() {
  const [assignments] = useState<RouteAssignment[]>(MOCK_ROUTE_ASSIGNMENTS);

  // Estadísticas derivadas de las asignaciones activas
  const pieStats = React.useMemo(() => getRouteAssignmentPieStats(assignments), [assignments]);

  return (
    <div className="h-full w-full lg:-ml-[32px] lg:pl-[32px] lg:w-[calc(100%+32px)] overflow-y-auto bg-slate-50/70 overscroll-contain">
      {/* 1. PageHero del módulo */}
      <PageHero
        title="Asignación de Rutas"
        description="Asignar rutas, crear rutas y monitorearlas"
        iconSrc="/hero-icons/asignacion-rutas.png"
        iconAlt="Ilustración de Asignación de Rutas"
      />

      <div className="w-full space-y-6 sm:space-y-8 p-4 sm:p-6 md:p-8 pb-24 lg:pb-8">
        {/* 2. Sección Superior: Estadísticas 50/50 con título (Dona + StackedBars) */}
        <RouteStatsSection
          pieStats={pieStats}
          assignments={assignments}
        />

        {/* 3. Sección Inferior: Historial de Asignaciones sin subtítulo */}
        <RouteHistorySection
          assignments={assignments}
          workers={MOCK_WORKERS}
        />
      </div>
    </div>
  );
}
