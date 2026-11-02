"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Plus, Inbox, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RouteAssignment } from "../../../../domain/entities/route-assignment.entity";
import type {
  RouteHistoryFilter,
  WorkerOption,
} from "../../../../domain/entities/route-assignment-stats.entity";
import { RouteHistoryFilterCard } from "./route-history-filter-card";
import { RouteAssignmentsTable } from "./route-assignments-table";
import { RouteAssignmentCard } from "./route-assignment-card";

export type RouteHistorySectionProps = {
  assignments: RouteAssignment[];
  workers: WorkerOption[];
  onSelectAssignment?: (assignment: RouteAssignment) => void;
};

export function RouteHistorySection({
  assignments,
  workers,
  onSelectAssignment,
}: RouteHistorySectionProps) {
  const [filter, setFilter] = useState<RouteHistoryFilter>({});

  const hasActiveFilters = Boolean(
    filter.routeCode || filter.workerId || filter.startDate || filter.endDate
  );

  const handleResetFilters = () => {
    setFilter({});
  };

  // Filtrado reactivo en memoria
  const filteredAssignments = useMemo(() => {
    return assignments.filter((a) => {
      if (filter.routeCode) {
        const query = filter.routeCode.toLowerCase();
        const matchesCode = a.routeCode.toLowerCase().includes(query);
        const matchesName = a.routeName.toLowerCase().includes(query);
        if (!matchesCode && !matchesName) return false;
      }
      if (filter.workerId && a.workerId !== filter.workerId) {
        return false;
      }
      if (filter.startDate && a.scheduledDate < filter.startDate) {
        return false;
      }
      if (filter.endDate && a.scheduledDate > filter.endDate) {
        return false;
      }
      return true;
    });
  }, [assignments, filter]);

  // Efecto de desvanecido dinámico en scroll para dispositivos móviles
  const [scrollFade, setScrollFade] = useState<{
    canScrollUp: boolean;
    canScrollDown: boolean;
  }>({
    canScrollUp: false,
    canScrollDown: true,
  });

  const handleMobileScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const canScrollUp = el.scrollTop > 8;
    const canScrollDown = el.scrollTop + el.clientHeight < el.scrollHeight - 8;
    setScrollFade((prev) => {
      if (prev.canScrollUp === canScrollUp && prev.canScrollDown === canScrollDown) {
        return prev;
      }
      return { canScrollUp, canScrollDown };
    });
  };

  useEffect(() => {
    const canScrollDown = filteredAssignments.length > 3;
    setScrollFade({ canScrollUp: false, canScrollDown });
  }, [filteredAssignments.length]);

  const mobileMaskStyle = useMemo<React.CSSProperties>(() => {
    const { canScrollUp, canScrollDown } = scrollFade;
    const fade = "28px";
    if (canScrollUp && canScrollDown) {
      const gradient = `linear-gradient(to bottom, transparent 0%, black ${fade}, black calc(100% - ${fade}), transparent 100%)`;
      return {
        maskImage: gradient,
        WebkitMaskImage: gradient,
      };
    }
    if (canScrollUp) {
      const gradient = `linear-gradient(to bottom, transparent 0%, black ${fade}, black 100%)`;
      return {
        maskImage: gradient,
        WebkitMaskImage: gradient,
      };
    }
    if (canScrollDown) {
      const gradient = `linear-gradient(to bottom, black 0%, black calc(100% - ${fade}), transparent 100%)`;
      return {
        maskImage: gradient,
        WebkitMaskImage: gradient,
      };
    }
    return {};
  }, [scrollFade]);

  return (
    <section aria-label="Historial de asignaciones" className="w-full space-y-4 sm:space-y-6">
      {/* Cabecera de la sección: en móviles el botón va antes con full width, en desktop alineados lado a lado */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Historial de Asignaciones
          </h3>
        </div>

        <Link
          href="/asignacion-rutas/nueva-asignacion"
          className="w-full sm:w-auto h-11 rounded-full bg-gradient-to-r from-[#0e4dcb] via-[#1a66e5] to-[#2579f6] text-white hover:opacity-95 active:scale-[0.98] border-0 shadow-none font-semibold text-xs sm:text-sm px-5 gap-2 shrink-0 select-none flex items-center justify-center transition-all cursor-pointer"
        >
          <Plus className="size-4 stroke-[2.5]" />
          <span>Nueva asignación</span>
        </Link>
      </div>

      {/* Formulario / Tarjeta de Filtros con input de RUT y botón Buscar */}
      <RouteHistoryFilterCard
        filter={filter}
        workers={workers}
        onApplyFilter={setFilter}
        onReset={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Contenido: Tabla Desktop o Tarjetas Mobile */}
      {filteredAssignments.length === 0 ? (
        <div className="rounded-2xl sm:rounded-3xl border border-dashed border-slate-200 bg-white/70 p-12 text-center space-y-3">
          <div className="size-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto">
            <Inbox className="size-6" />
          </div>
          <h4 className="text-base font-semibold text-slate-800">
            No se encontraron asignaciones
          </h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No existen registros que coincidan con los criterios de búsqueda aplicados.
          </p>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="rounded-full text-xs font-semibold gap-1.5 mt-2"
            >
              <RotateCcw className="size-3.5" />
              <span>Restablecer filtros</span>
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Vista Desktop (≥ 768px): Tabla Plana */}
          <div className="hidden md:block">
            <RouteAssignmentsTable
              assignments={filteredAssignments}
              onSelectAssignment={onSelectAssignment}
            />
          </div>

          {/* Vista Mobile (< 768px): Tarjetas con Scroll y Máscara de Desvanecido */}
          <div
            className="md:hidden max-h-[580px] overflow-y-auto space-y-3 pr-1 pb-4"
            style={mobileMaskStyle}
            onScroll={handleMobileScroll}
          >
            {filteredAssignments.map((assignment) => (
              <RouteAssignmentCard
                key={assignment.id}
                assignment={assignment}
                onSelect={onSelectAssignment}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
