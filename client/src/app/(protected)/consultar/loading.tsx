import React from "react";
import { PageHeroSkeleton } from "@/features/shared/presentation/components/layout/page-hero-skeleton";

export default function ConsultarLoading() {
  return (
    <div
      aria-label="Cargando consultas"
      data-purpose="consultation-loading"
      className="h-full w-full overflow-y-auto bg-slate-50/70 overscroll-contain select-none"
    >
      {/* 1. Silueta de PageHero conectada */}
      <PageHeroSkeleton />

      <div className="w-full space-y-4 sm:space-y-6 p-4 sm:p-6 md:p-8 pb-24 lg:pb-8">
        {/* 2. Silueta de Filtros */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border-0 shadow-none p-5 sm:p-6 space-y-5 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-1.5">
                <div className="w-24 h-3.5 rounded-full bg-slate-200" />
                <div className="h-12 rounded-full bg-slate-100 border-0" />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100/80">
            <div className="w-24 h-10 rounded-full bg-slate-100" />
            <div className="w-28 h-10 rounded-full bg-blue-100/70" />
          </div>
        </div>

        {/* 3. Silueta de Área de Contenido */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border-0 shadow-none p-12 text-center space-y-3 animate-pulse">
          <div className="size-14 rounded-2xl bg-slate-100 mx-auto" />
          <div className="w-48 h-4 rounded-full bg-slate-200 mx-auto" />
          <div className="w-72 h-3 rounded-full bg-slate-100 mx-auto" />
        </div>
      </div>
    </div>
  );
}
