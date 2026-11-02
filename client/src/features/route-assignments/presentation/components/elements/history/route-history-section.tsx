"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Plus, Inbox, RotateCcw, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RouteAssignment } from "../../../../domain/entities/route-assignment.entity";
import {
  RouteHistoryFilterCard,
  type RouteHistoryFilterValues,
} from "./route-history-filter-card";
import { RouteAssignmentsTable } from "./route-assignments-table";
import { RouteAssignmentCard } from "./route-assignment-card";

export type RouteHistorySectionProps = {
  assignments: RouteAssignment[];
  workers: { id: string; name: string }[];
  totalCount?: number;
  currentPage?: number;
  pageSize?: number;
  totalPages?: number;
  isLoading?: boolean;
  error?: string | null;
  hasActiveFilters?: boolean;
  filterValues?: RouteHistoryFilterValues;
  onApplyFilter?: (updated: RouteHistoryFilterValues) => void;
  onResetFilters?: () => void;
  onPageChange?: (page: number) => void;
  onRetry?: () => void;
  onSelectAssignment?: (assignment: RouteAssignment) => void;
};

export function RouteHistorySection({
  assignments,
  workers,
  totalCount = assignments.length,
  currentPage = 1,
  pageSize = 10,
  totalPages = 1,
  isLoading = false,
  error = null,
  hasActiveFilters: externalHasActiveFilters,
  filterValues: externalFilterValues,
  onApplyFilter: externalOnApplyFilter,
  onResetFilters: externalOnResetFilters,
  onPageChange,
  onRetry,
  onSelectAssignment,
}: RouteHistorySectionProps) {
  // Estado local para fallback en modo no conectado
  const [localFilter, setLocalFilter] = useState<RouteHistoryFilterValues>({});

  const isConnected = Boolean(externalOnApplyFilter);

  const filter = isConnected ? (externalFilterValues || {}) : localFilter;
  const hasActiveFilters = isConnected
    ? Boolean(externalHasActiveFilters)
    : Boolean(localFilter.workerId || localFilter.startDate || localFilter.endDate);

  const handleApplyFilter = (updated: RouteHistoryFilterValues) => {
    if (externalOnApplyFilter) {
      externalOnApplyFilter(updated);
    } else {
      setLocalFilter(updated);
    }
  };

  const handleResetFilters = () => {
    if (externalOnResetFilters) {
      externalOnResetFilters();
    } else {
      setLocalFilter({});
    }
  };

  // Filtrado reactivo en memoria para fallback desconectado
  const displayedAssignments = useMemo(() => {
    if (isConnected) return assignments;

    return assignments.filter((a) => {
      const selectedWorker = filter.technicianId || filter.workerId;
      if (selectedWorker && a.workerId !== selectedWorker) {
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
  }, [assignments, filter, isConnected]);

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
    const canScrollDown = displayedAssignments.length > 3;
    setScrollFade({ canScrollUp: false, canScrollDown });
  }, [displayedAssignments.length]);

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
      {/* Cabecera de la sección */}
      <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Historial de Asignaciones
          </h3>
          {totalCount > 0 && !isLoading && (
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {totalCount === 1
                ? "1 asignación registrada"
                : `${totalCount} asignaciones registradas en el sistema`}
            </p>
          )}
        </div>

        <Link
          href="/asignacion-rutas/nueva-asignacion"
          className="w-full sm:w-auto h-11 rounded-full bg-gradient-to-r from-[#0e4dcb] via-[#1a66e5] to-[#2579f6] text-white hover:opacity-95 active:scale-[0.98] border-0 shadow-none font-semibold text-xs sm:text-sm px-5 gap-2 shrink-0 select-none flex items-center justify-center transition-all cursor-pointer"
        >
          <Plus className="size-4 stroke-[2.5]" />
          <span>Nueva asignación</span>
        </Link>
      </div>

      {/* Formulario / Tarjeta de Filtros */}
      <RouteHistoryFilterCard
        filter={filter}
        workers={workers}
        onApplyFilter={handleApplyFilter}
        onReset={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Error State */}
      {error && !isLoading && (
        <div className="rounded-2xl sm:rounded-3xl border border-rose-200 bg-rose-50/70 p-6 sm:p-8 text-center space-y-3">
          <div className="size-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="size-6" />
          </div>
          <h4 className="text-base font-semibold text-rose-900">
            Error al consultar asignaciones
          </h4>
          <p className="text-xs text-rose-700 max-w-md mx-auto">
            {error}
          </p>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="rounded-full text-xs font-semibold gap-1.5 mt-2 bg-white text-rose-700 border-rose-200 hover:bg-rose-100/50"
            >
              <span>Reintentar carga</span>
            </Button>
          )}
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="rounded-2xl sm:rounded-3xl bg-white p-6 border-0 shadow-none space-y-4 animate-pulse">
          <div className="h-4 bg-slate-200/80 rounded-full w-1/4" />
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-2xl w-full" />
            ))}
          </div>
        </div>
      )}

      {/* Contenido: Tabla Desktop o Tarjetas Mobile */}
      {!isLoading && !error && displayedAssignments.length === 0 && (
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
      )}

      {!isLoading && !error && displayedAssignments.length > 0 && (
        <>
          {/* Vista Desktop (≥ 768px): Tabla Plana */}
          <div className="hidden md:block">
            <RouteAssignmentsTable
              assignments={displayedAssignments}
              onSelectAssignment={onSelectAssignment}
            />
          </div>

          {/* Vista Mobile (< 768px): Tarjetas con Scroll y Máscara de Desvanecido */}
          <div
            className="md:hidden max-h-[580px] overflow-y-auto space-y-3 pr-1 pb-4"
            style={mobileMaskStyle}
            onScroll={handleMobileScroll}
          >
            {displayedAssignments.map((assignment) => (
              <RouteAssignmentCard
                key={assignment.id}
                assignment={assignment}
                onSelect={onSelectAssignment}
              />
            ))}
          </div>

          {/* Controles de Paginación */}
          {totalPages > 1 && onPageChange && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 px-2">
              <span className="text-xs text-slate-500 font-medium order-2 sm:order-1">
                Página <strong className="text-slate-800 font-semibold">{currentPage}</strong> de{" "}
                <strong className="text-slate-800 font-semibold">{totalPages}</strong>
              </span>

              <div className="flex items-center gap-2 order-1 sm:order-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => onPageChange(currentPage - 1)}
                  className="h-9 px-3 rounded-full text-xs font-semibold bg-white border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="size-4 mr-1" />
                  <span>Anterior</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => onPageChange(currentPage + 1)}
                  className="h-9 px-3 rounded-full text-xs font-semibold bg-white border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="size-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
