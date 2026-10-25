import React from "react";
import { PageHeroSkeleton } from "@/features/shared/presentation/components/layout/page-hero-skeleton";

export default function DashboardLoading() {
  return (
    <div
      aria-label="Cargando dashboard de administración"
      data-purpose="dashboard-loading"
      className="h-full w-full lg:-ml-[32px] lg:pl-[32px] lg:w-[calc(100%+32px)] overflow-y-auto bg-slate-50/70 overscroll-contain select-none"
    >
      {/* 1. Silueta de PageHero conectada */}
      <PageHeroSkeleton />

      <div className="w-full space-y-6 sm:space-y-8 p-4 sm:p-6 md:p-8 pb-24 lg:pb-8">
        {/* 2. Sección de Gestión de Capas (Skeletons planos estilo Bitácora) */}
        <div className="space-y-4">
          <div className="px-0.5 space-y-1">
            <div className="h-6 w-44 rounded-lg bg-slate-200/70 animate-pulse" />
            <div className="h-3.5 w-72 max-w-full rounded-md bg-slate-100 animate-pulse" />
          </div>

          {/* Cuadrícula de 4 Tarjetas de Capas Planas */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((index) => (
              <div
                key={index}
                className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-5 space-y-4 border-0 shadow-none flex flex-col justify-between min-h-[240px] sm:min-h-[270px] animate-pulse"
              >
                {/* Cabecera plana de icono */}
                <div className="w-full h-36 sm:h-40 rounded-2xl bg-slate-100/90 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-200/70" />
                </div>

                {/* Metadatos y pie plano */}
                <div className="space-y-2 pt-1">
                  <div className="h-4 w-28 bg-slate-200/70 rounded-md" />
                  <div className="h-3 w-16 bg-slate-100 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Sección de Accesos Rápidos (Skeletons planos) */}
        <div className="space-y-4 pt-2">
          <div className="px-0.5 space-y-1">
            <div className="h-6 w-36 rounded-lg bg-slate-200/70 animate-pulse" />
            <div className="h-3.5 w-60 max-w-full rounded-md bg-slate-100 animate-pulse" />
          </div>

          {/* Cuadrícula de 4 Tarjetas de Acceso Rápido Planas */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {[1, 2, 3, 4].map((index) => (
              <div
                key={index}
                className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-5 border-0 shadow-none flex flex-col items-center justify-center text-center min-h-[135px] sm:min-h-[145px] space-y-3 animate-pulse"
              >
                {/* Icono de acceso rápido */}
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-200/70" />
                </div>

                {/* Título */}
                <div className="h-3.5 w-20 bg-slate-200/70 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
