import React from "react";
import { Loader2 } from "lucide-react";

export default function MapaLoading() {
  return (
    <div
      aria-label="Cargando mapa"
      data-purpose="map-loading-skeleton"
      className="relative w-full h-full min-h-full overflow-hidden bg-slate-200/70 select-none flex items-center justify-center"
    >
      {/* 1. Indicador central de carga del mapa */}
      <div className="bg-white/95 backdrop-blur-md px-6 py-4 rounded-3xl shadow-float border border-gray-100/90 flex flex-col items-center gap-3 z-10 transition-all">
        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
        <div className="flex flex-col items-center gap-0.5 text-center">
          <h3 className="text-xs font-bold text-gray-800 tracking-tight">
            Cargando visor cartográfico...
          </h3>
          <p className="text-[11px] text-gray-400 font-medium">
            Inicializando capas y coordenadas
          </p>
        </div>
      </div>

      {/* 2. Skeletons flotantes de Escritorio (lg:flex / lg:block) */}
      <div className="hidden lg:flex absolute top-4 left-4 z-20 items-center gap-2.5">
        <div className="w-28 h-9 rounded-full bg-white/90 backdrop-blur-md shadow-float border border-gray-100/80 animate-pulse" />
        <div className="w-44 h-9 rounded-full bg-white/90 backdrop-blur-md shadow-float border border-gray-100/80 animate-pulse" />
      </div>

      <div className="hidden lg:block absolute top-4 right-4 z-20">
        <div className="w-96 max-w-[calc(100vw-2rem)] h-10 rounded-2xl bg-white/90 backdrop-blur-md shadow-float border border-gray-100/80 animate-pulse" />
      </div>

      <div className="hidden lg:block absolute bottom-6 right-4 z-20">
        <div className="w-9 h-36 rounded-xl bg-white/90 backdrop-blur-md shadow-float border border-gray-100/80 animate-pulse" />
      </div>

      {/* 3. Skeletons flotantes de Móvil (lg:hidden) */}
      <div className="lg:hidden absolute top-0 left-0 right-0 z-20 p-2 sm:p-3 pointer-events-none">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-2.5 shadow-float border border-gray-200/80 space-y-2 pointer-events-auto">
          <div className="h-9 rounded-xl bg-slate-100 animate-pulse w-full" />
          <div className="h-8 rounded-xl bg-blue-100/60 animate-pulse w-full" />
          <div className="flex items-center justify-center gap-2 pt-0.5">
            <div className="w-24 h-7 rounded-full bg-slate-100 animate-pulse" />
            <div className="w-24 h-7 rounded-full bg-slate-100 animate-pulse" />
          </div>
        </div>
      </div>

      <div className="lg:hidden absolute bottom-24 right-3 z-20">
        <div className="w-9 h-36 rounded-xl bg-white/90 backdrop-blur-md shadow-float border border-gray-100/80 animate-pulse" />
      </div>
    </div>
  );
}
