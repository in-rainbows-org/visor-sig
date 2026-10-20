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

      <div className="w-full space-y-6 p-6 md:p-8 pb-20 lg:pb-8">
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="h-5 w-44 rounded-lg bg-slate-200 animate-pulse" />
          </div>

          {/* Skeleton Desktop: Tabla */}
          <div className="hidden lg:block rounded-2xl border border-slate-200/80 bg-white p-6 space-y-4 shadow-xs animate-pulse">
            <div className="h-10 w-full rounded-xl bg-slate-100" />
            <div className="h-12 w-full rounded-xl bg-slate-50 border border-slate-100" />
            <div className="h-12 w-full rounded-xl bg-slate-50 border border-slate-100" />
            <div className="h-12 w-full rounded-xl bg-slate-50 border border-slate-100" />
            <div className="h-12 w-full rounded-xl bg-slate-50 border border-slate-100" />
          </div>

          {/* Skeleton Mobile: Tarjetas */}
          <div className="block lg:hidden space-y-3">
            <div className="h-32 w-full rounded-2xl bg-white border border-slate-200/80 shadow-xs animate-pulse p-4 space-y-3">
              <div className="h-4 w-32 bg-slate-200 rounded" />
              <div className="h-3 w-48 bg-slate-100 rounded" />
              <div className="h-3 w-24 bg-slate-100 rounded" />
            </div>
            <div className="h-32 w-full rounded-2xl bg-white border border-slate-200/80 shadow-xs animate-pulse p-4 space-y-3">
              <div className="h-4 w-28 bg-slate-200 rounded" />
              <div className="h-3 w-40 bg-slate-100 rounded" />
              <div className="h-3 w-20 bg-slate-100 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
