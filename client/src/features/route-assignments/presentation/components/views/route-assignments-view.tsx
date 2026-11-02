"use client";

import React, { useMemo } from "react";
import { PageHero } from "@/features/shared/presentation/components/layout/page-hero";
import {
  MOCK_ROUTE_ASSIGNMENTS,
  getRouteAssignmentPieStats,
  MOCK_WORKERS,
} from "../../data/mock-route-assignments";
import { RouteStatsSection } from "../elements/stats/route-stats-section";
import { RouteHistorySection } from "../elements/history/route-history-section";
import { useRouteAssignmentsHistory } from "../../hooks/use-route-assignments-history";

export function RouteAssignmentsView() {
  const history = useRouteAssignmentsHistory();

  // Estadísticas conservadas para visualización del tablero superior
  const pieStats = useMemo(
    () => getRouteAssignmentPieStats(MOCK_ROUTE_ASSIGNMENTS),
    []
  );

  // Trabajadores/Técnicos para filtros: priorizar técnicos reales del backend
  const availableWorkers = useMemo(() => {
    if (history.technicians.length > 0) {
      return history.technicians;
    }
    return MOCK_WORKERS;
  }, [history.technicians]);

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
          assignments={MOCK_ROUTE_ASSIGNMENTS}
        />

        {/* 3. Sección Inferior: Historial de Asignaciones con datos reales y paginación */}
        <RouteHistorySection
          assignments={history.items}
          workers={availableWorkers}
          totalCount={history.totalCount}
          currentPage={history.currentPage}
          pageSize={history.pageSize}
          totalPages={history.totalPages}
          isLoading={history.isLoading}
          error={history.error}
          hasActiveFilters={history.hasActiveFilters}
          filterValues={history.activeFilters}
          onApplyFilter={history.applyFilters}
          onResetFilters={history.resetFilters}
          onPageChange={history.handlePageChange}
          onRetry={history.refetch}
        />
      </div>
    </div>
  );
}

export default RouteAssignmentsView;
