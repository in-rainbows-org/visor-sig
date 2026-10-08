import React from "react";

export default function CapasLoading() {
  return (
    <div
      aria-label="Cargando catálogo de capas"
      data-purpose="layer-catalog-loading"
      className="h-full w-full overflow-y-auto bg-slate-50/70 p-6 md:p-8 select-none"
    >
      <div className="w-full space-y-7 pb-20 lg:pb-8">
        {/* 1. Silueta de Encabezado */}
        <div>
          <div className="w-56 h-8 rounded-xl bg-slate-200 animate-pulse" />
          <div className="w-96 max-w-full h-4 rounded-lg bg-slate-200/70 animate-pulse mt-2.5" />
        </div>

        {/* 2. Cuadrícula de 4 Tarjetas de Capa Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4].map((index) => (
            <div
              key={index}
              className="rounded-3xl border border-slate-200/80 bg-white shadow-xs overflow-hidden flex flex-col min-h-[260px] sm:min-h-[290px] animate-pulse"
            >
              {/* Cabecera cromática simulada */}
              <div className="relative h-44 sm:h-48 bg-slate-100/90 flex items-center justify-center p-6 border-b border-slate-100">
                <div className="w-16 h-16 rounded-2xl bg-slate-200/80" />
                <div className="absolute top-4 right-4 w-14 h-5 rounded-full bg-slate-200/80" />
              </div>

              {/* Cuerpo de metadatos simulado */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-300" />
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
    </div>
  );
}
