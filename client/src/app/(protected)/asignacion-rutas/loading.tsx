import React from "react";
import { PageHeroSkeleton } from "@/features/shared/presentation/components/layout/page-hero-skeleton";

export default function AsignacionRutasLoading() {
  return (
    <div
      aria-label="Cargando módulo de asignación de rutas"
      className="h-full w-full lg:-ml-[32px] lg:pl-[32px] lg:w-[calc(100%+32px)] overflow-y-auto bg-slate-50/70 overscroll-contain select-none"
    >
      {/* 1. Silueta de PageHero */}
      <PageHeroSkeleton />

      <div className="w-full space-y-6 sm:space-y-8 p-4 sm:p-6 md:p-8 pb-24 lg:pb-8">
        {/* 2. Sección Superior: Resumen Estadístico 50/50 */}
        <div className="space-y-3 sm:space-y-4">
          <div className="px-1">
            <div className="h-6 w-48 bg-slate-200/70 rounded-lg animate-pulse" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Card Izquierda (50%): Gráfico Dona */}
            <div className="rounded-[28px] sm:rounded-[32px] bg-white p-6 sm:p-7 border-0 shadow-none min-h-[340px] animate-pulse space-y-4">
              <div className="flex justify-between items-center">
                <div className="h-5 w-40 bg-slate-200/70 rounded-md" />
                <div className="h-4 w-16 bg-slate-100 rounded-full" />
              </div>
              <div className="flex items-center justify-center py-6">
                <div className="size-44 rounded-full border-8 border-slate-100 bg-slate-50" />
              </div>
              <div className="space-y-2 pt-2">
                <div className="h-4 w-full bg-slate-100 rounded-md" />
                <div className="h-4 w-3/4 bg-slate-100 rounded-md" />
              </div>
            </div>

            {/* Card Derecha (50%): StackedBars */}
            <div className="rounded-[28px] sm:rounded-[32px] bg-white p-6 sm:p-7 border-0 shadow-none min-h-[340px] animate-pulse space-y-4">
              <div className="flex justify-between items-center">
                <div className="space-y-1.5">
                  <div className="h-5 w-48 bg-slate-200/70 rounded-md" />
                  <div className="h-3.5 w-32 bg-slate-100 rounded-md" />
                </div>
                <div className="h-8 w-28 bg-slate-100 rounded-xl" />
              </div>
              <div className="h-8 w-36 bg-slate-200/70 rounded-md mt-2" />
              <div className="h-44 w-full bg-slate-50 rounded-2xl mt-4" />
            </div>
          </div>
        </div>

        {/* 3. Sección Inferior: Historial de Asignaciones */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="h-6 w-52 bg-slate-200/70 rounded-lg animate-pulse" />
            <div className="h-10 w-36 bg-slate-200/70 rounded-xl animate-pulse" />
          </div>

          {/* Card de filtros skeleton */}
          <div className="rounded-2xl sm:rounded-3xl bg-white p-5 border-0 shadow-none animate-pulse space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="h-12 bg-slate-100 rounded-full" />
              <div className="h-12 bg-slate-100 rounded-full" />
              <div className="h-12 bg-slate-100 rounded-full" />
              <div className="h-12 bg-slate-100 rounded-full" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <div className="h-10 w-24 bg-slate-100 rounded-full" />
              <div className="h-10 w-28 bg-slate-200/70 rounded-full" />
            </div>
          </div>

          {/* Tabla skeleton */}
          <div className="rounded-[24px] sm:rounded-[32px] bg-white p-6 border-0 shadow-none min-h-[320px] animate-pulse space-y-3">
            <div className="h-8 w-full bg-slate-100 rounded-lg" />
            <div className="h-12 w-full bg-slate-50 rounded-lg" />
            <div className="h-12 w-full bg-slate-50 rounded-lg" />
            <div className="h-12 w-full bg-slate-50 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
