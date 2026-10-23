import React from "react";
import { PageHeroSkeleton } from "@/features/shared/presentation/components/layout/page-hero-skeleton";

export default function BitacoraLoading() {
  return (
    <div
      aria-label="Cargando bitácora del sistema"
      data-purpose="audit-logs-loading"
      className="h-full w-full overflow-y-auto bg-slate-50/70 overscroll-contain select-none"
    >
      {/* 1. Silueta de PageHero conectada */}
      <PageHeroSkeleton />

      <div className="w-full space-y-4 sm:space-y-6 p-4 sm:p-6 md:p-8 pb-24 lg:pb-8">
        <div className="space-y-4">
          {/* Título de Sección Skeleton */}
          <div className="px-0.5">
            <div className="h-7 w-56 rounded-lg bg-slate-200/70 animate-pulse" />
          </div>

          {/* Skeleton Desktop: Tabla */}
          <div className="hidden lg:block rounded-2xl sm:rounded-3xl bg-white p-6 space-y-4 border-0 shadow-none animate-pulse">
            <div className="h-8 w-full rounded-xl bg-slate-100" />
            <div className="h-12 w-full rounded-xl bg-slate-50/80" />
            <div className="h-12 w-full rounded-xl bg-slate-50/80" />
            <div className="h-12 w-full rounded-xl bg-slate-50/80" />
            <div className="h-12 w-full rounded-xl bg-slate-50/80" />
          </div>

          {/* Skeleton Mobile: Tarjetas en columna ScrollArea */}
          <div className="block lg:hidden space-y-3">
            <div className="rounded-2xl sm:rounded-3xl bg-white border-0 shadow-none p-4 sm:p-5 space-y-3 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-full bg-slate-200" />
                  <div className="h-4 w-28 bg-slate-200 rounded" />
                </div>
                <div className="h-6 w-20 bg-slate-100 rounded-full" />
              </div>
              <div className="h-12 w-full rounded-2xl bg-slate-50/80" />
              <div className="h-3 w-28 bg-slate-100 rounded ml-auto" />
            </div>

            <div className="rounded-2xl sm:rounded-3xl bg-white border-0 shadow-none p-4 sm:p-5 space-y-3 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-full bg-slate-200" />
                  <div className="h-4 w-32 bg-slate-200 rounded" />
                </div>
                <div className="h-6 w-20 bg-slate-100 rounded-full" />
              </div>
              <div className="h-12 w-full rounded-2xl bg-slate-50/80" />
              <div className="h-3 w-24 bg-slate-100 rounded ml-auto" />
            </div>

            <div className="rounded-2xl sm:rounded-3xl bg-white border-0 shadow-none p-4 sm:p-5 space-y-3 animate-pulse opacity-60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-full bg-slate-200" />
                  <div className="h-4 w-24 bg-slate-200 rounded" />
                </div>
                <div className="h-6 w-20 bg-slate-100 rounded-full" />
              </div>
              <div className="h-12 w-full rounded-2xl bg-slate-50/80" />
              <div className="h-3 w-20 bg-slate-100 rounded ml-auto" />
            </div>

            <div className="rounded-2xl sm:rounded-3xl bg-white border-0 shadow-none p-4 sm:p-5 space-y-3 animate-pulse opacity-30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-full bg-slate-200" />
                  <div className="h-4 w-28 bg-slate-200 rounded" />
                </div>
                <div className="h-6 w-20 bg-slate-100 rounded-full" />
              </div>
              <div className="h-12 w-full rounded-2xl bg-slate-50/80" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
