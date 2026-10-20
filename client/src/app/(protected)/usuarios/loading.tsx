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

      <div className="w-full space-y-6 p-6 md:p-8 pb-20 lg:pb-8">
        {/* Barra de Búsqueda y Filtros Skeleton */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="lg:col-span-2 h-10 bg-slate-100 rounded-xl" />
            <div className="h-10 bg-slate-100 rounded-xl" />
            <div className="h-10 bg-slate-100 rounded-xl" />
          </div>
        </div>

        {/* Tabla / Lista de Usuarios Skeleton */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 space-y-4 shadow-xs animate-pulse">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="h-5 w-32 bg-slate-200 rounded-lg" />
            <div className="h-4 w-20 bg-slate-100 rounded-md" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 w-full rounded-xl bg-slate-50 border border-slate-100/80 flex items-center px-4 justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-200" />
                  <div className="space-y-1.5">
                    <div className="w-28 h-3.5 bg-slate-200 rounded" />
                    <div className="w-40 h-2.5 bg-slate-100 rounded" />
                  </div>
                </div>
                <div className="w-16 h-6 rounded-full bg-slate-100 hidden sm:block" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
