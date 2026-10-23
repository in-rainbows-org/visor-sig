import React from "react";
import { PageHeroSkeleton } from "@/features/shared/presentation/components/layout/page-hero-skeleton";

export default function UsuariosLoading() {
  return (
    <div
      aria-label="Cargando gestión de usuarios"
      data-purpose="users-loading"
      className="h-full w-full overflow-y-auto bg-slate-50/70 overscroll-contain select-none"
    >
      {/* 1. Silueta de PageHero conectada */}
      <PageHeroSkeleton />

      <div className="w-full space-y-4 sm:space-y-6 p-4 sm:p-6 md:p-8 pb-24 lg:pb-8">
        {/* Barra de Búsqueda y Filtros Skeleton */}
        <div className="rounded-2xl sm:rounded-3xl border-0 shadow-none bg-white p-5 sm:p-6 space-y-4 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <div className="w-28 h-3.5 rounded-full bg-slate-200" />
              <div className="h-12 rounded-full bg-slate-100 border-0" />
            </div>
            <div className="space-y-1.5">
              <div className="w-24 h-3.5 rounded-full bg-slate-200" />
              <div className="h-12 rounded-full bg-slate-100 border-0" />
            </div>
            <div className="space-y-1.5">
              <div className="w-24 h-3.5 rounded-full bg-slate-200" />
              <div className="h-12 rounded-full bg-slate-100 border-0" />
            </div>
          </div>
        </div>

        {/* Tabla / Lista de Usuarios Skeleton */}
        <div className="space-y-4">
          <div className="px-0.5">
            <div className="h-7 w-56 rounded-lg bg-slate-200/70 animate-pulse" />
          </div>

          {/* Desktop Skeleton */}
          <div className="hidden lg:block rounded-2xl sm:rounded-3xl bg-white p-6 space-y-4 border-0 shadow-none animate-pulse">
            <div className="h-8 w-full rounded-xl bg-slate-100" />
            <div className="h-12 w-full rounded-xl bg-slate-50/80" />
            <div className="h-12 w-full rounded-xl bg-slate-50/80" />
            <div className="h-12 w-full rounded-xl bg-slate-50/80" />
            <div className="h-12 w-full rounded-xl bg-slate-50/80" />
          </div>

          {/* Mobile Skeleton */}
          <div className="block lg:hidden space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-2xl sm:rounded-3xl bg-white border-0 shadow-none p-4 sm:p-5 space-y-3 animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="size-9 rounded-full bg-slate-200" />
                    <div className="h-4 w-28 bg-slate-200 rounded-full" />
                  </div>
                  <div className="h-6 w-20 bg-slate-100 rounded-full" />
                </div>
                <div className="h-12 w-full rounded-2xl bg-slate-50/80" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
