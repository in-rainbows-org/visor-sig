import React from "react";

export default function DashboardLoading() {
  return (
    <div
      aria-label="Cargando dashboard de administración"
      data-purpose="dashboard-loading"
      className="h-full w-full overflow-y-auto bg-slate-50/70 p-4 sm:p-6 md:p-8 select-none"
    >
      <div className="w-full space-y-8 pb-24 lg:pb-8">
        {/* 1. Silueta de Encabezado de Página */}
        <div className="space-y-1.5">
          <div className="w-64 sm:w-80 h-8 rounded-xl bg-slate-200 animate-pulse" />
          <div className="w-96 max-w-full h-4 rounded-lg bg-slate-200/70 animate-pulse mt-2" />
        </div>

        {/* 2. Sección de Gestión de Capas */}
        <div className="space-y-3">
          <div className="px-0.5 space-y-1">
            <div className="w-40 h-5 rounded-lg bg-slate-200 animate-pulse" />
            <div className="w-80 max-w-full h-3.5 rounded-md bg-slate-200/60 animate-pulse" />
          </div>

          {/* Cuadrícula de 4 Tarjetas de Capas */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4].map((index) => (
              <div
                key={index}
                className="rounded-3xl border border-slate-200/80 bg-white shadow-xs overflow-hidden flex flex-col min-h-[260px] sm:min-h-[290px] animate-pulse"
              >
                {/* Cabecera cromática e icono */}
                <div className="relative h-44 sm:h-48 bg-slate-100/90 flex items-center justify-center p-6 border-b border-slate-100">
                  <div className="w-16 h-16 rounded-2xl bg-slate-200/80" />
                  <div className="absolute top-4 right-4 w-14 h-5 rounded-full bg-slate-200/80" />
                </div>

                {/* Metadatos y pie de tarjeta */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    <div className="w-24 h-4 rounded-md bg-slate-200" />
                  </div>

                  <div className="pt-2.5 sm:pt-3 border-t border-slate-100 flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div className="w-16 h-3 rounded bg-slate-100" />
                    <div className="w-20 h-3 rounded bg-slate-100" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Sección de Accesos Rápidos */}
        <div className="space-y-4 pt-2">
          <div className="space-y-1">
            <div className="w-36 h-5 rounded-lg bg-slate-200 animate-pulse" />
            <div className="w-72 max-w-full h-3.5 rounded-md bg-slate-200/60 animate-pulse" />
          </div>

          {/* Cuadrícula de 4 Tarjetas de Acceso Rápido */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
            {[1, 2, 3, 4].map((index) => (
              <div
                key={index}
                className="rounded-2xl sm:rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs flex flex-col items-center justify-between text-center min-h-[135px] sm:min-h-[145px] lg:min-h-[160px] animate-pulse"
              >
                {/* Icono de acceso rápido */}
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-xl bg-slate-200/80" />
                </div>

                {/* Título y descripción corta */}
                <div className="w-full space-y-1.5 mt-2 flex flex-col items-center">
                  <div className="w-20 h-4 rounded-md bg-slate-200" />
                  <div className="w-28 h-3 rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
