import React from "react";

export default function ConsultarLoading() {
  return (
    <div
      aria-label="Cargando consultas"
      data-purpose="consultation-loading"
      className="h-full w-full overflow-y-auto bg-slate-50/70 p-6 md:p-8 select-none"
    >
      <div className="w-full space-y-7 pb-20 lg:pb-8">
        {/* 1. Silueta de Encabezado */}
        <div>
          <div className="w-64 h-8 rounded-xl bg-slate-200 animate-pulse" />
          <div className="w-96 max-w-full h-4 rounded-lg bg-slate-200/70 animate-pulse mt-2.5" />
        </div>

        {/* 2. Silueta de Filtros */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4 animate-pulse shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-1.5">
                <div className="w-24 h-3 rounded bg-slate-200" />
                <div className="h-12 rounded-xl bg-slate-100 border border-slate-200/60" />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <div className="w-24 h-10 rounded-xl bg-slate-200/80" />
            <div className="w-28 h-10 rounded-xl bg-blue-100/70" />
          </div>
        </div>

        {/* 3. Silueta de Área de Contenido */}
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center space-y-3 animate-pulse">
          <div className="size-12 rounded-2xl bg-slate-200 mx-auto" />
          <div className="w-48 h-4 rounded bg-slate-200 mx-auto" />
          <div className="w-72 h-3 rounded bg-slate-100 mx-auto" />
        </div>
      </div>
    </div>
  );
}
