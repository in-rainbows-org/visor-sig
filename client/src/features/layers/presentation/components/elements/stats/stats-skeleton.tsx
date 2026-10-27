import React from "react";

export function StatsSkeleton() {
  return (
    <div
      aria-label="Cargando resumen estadístico"
      className="space-y-4 select-none"
    >
      {/* Cabecera plana de skeleton en misma fila */}
      <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 px-0.5">
        <div className="h-6 w-36 sm:w-48 rounded-lg bg-slate-200/70 animate-pulse" />
        <div className="h-9 sm:h-10 w-36 sm:w-44 rounded-full bg-white animate-pulse" />
      </div>

      {/* Fila 1: 6 Tarjetas Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {/* Tarjeta Total */}
        <div className="col-span-2 md:col-span-3 xl:col-span-1 rounded-[24px] sm:rounded-[28px] bg-blue-100/60 p-3.5 sm:p-4.5 xl:p-5 h-[120px] sm:h-[135px] xl:h-[125px] max-h-[120px] sm:max-h-[135px] xl:max-h-[125px] animate-pulse flex items-center justify-between gap-2">
          <div className="flex flex-col justify-between h-full space-y-2">
            <div className="h-3 w-24 bg-blue-200/70 rounded-md" />
            <div className="h-6 w-16 bg-blue-200/80 rounded-lg" />
            <div className="h-2.5 w-14 bg-blue-200/60 rounded-md" />
          </div>
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-blue-200/50 shrink-0" />
        </div>

        {/* 5 Tarjetas de estado */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="rounded-[24px] sm:rounded-[28px] bg-white p-3 sm:p-3.5 xl:p-5 h-[85px] sm:h-[94px] xl:h-[125px] max-h-[85px] sm:max-h-[94px] xl:max-h-[125px] border-0 shadow-none animate-pulse flex items-center justify-between gap-2"
          >
            <div className="flex flex-col justify-between h-full space-y-2">
              <div className="h-3 w-16 bg-slate-200/70 rounded-md" />
              <div className="h-6 w-14 bg-slate-200/80 rounded-lg" />
              <div className="h-2.5 w-12 bg-slate-100 rounded-md" />
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-100 shrink-0" />
          </div>
        ))}
      </div>

      {/* Fila 2: 2 Gráficos Estadísticos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Gráfico 1: Dona */}
        <div className="bg-white rounded-[28px] sm:rounded-[32px] p-5 sm:p-7 min-h-[290px] border-0 shadow-none animate-pulse flex flex-col justify-between space-y-4">
          <div className="mb-4">
            <div className="h-4.5 w-36 bg-slate-200/70 rounded-md" />
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 my-auto">
            <div className="w-40 h-40 rounded-full border-[14px] border-slate-100 bg-slate-50 flex items-center justify-center">
              <div className="w-12 h-6 bg-slate-200/70 rounded-md" />
            </div>
            <div className="w-full sm:w-44 space-y-2">
              {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="h-8 rounded-2xl bg-slate-100/80" />
              ))}
            </div>
          </div>
        </div>

        {/* Gráfico 2: Barras */}
        <div className="bg-white rounded-[28px] sm:rounded-[32px] p-5 sm:p-7 min-h-[290px] border-0 shadow-none animate-pulse flex flex-col justify-between space-y-4">
          <div className="mb-4">
            <div className="h-4.5 w-32 bg-slate-200/70 rounded-md" />
          </div>
          <div className="space-y-3.5 sm:space-y-4 my-auto">
            {[1, 2, 3, 4, 5].map((k) => (
              <div key={k} className="flex items-center gap-3 sm:gap-4">
                <div className="w-24 sm:w-28 h-4 bg-slate-200/60 rounded-md shrink-0" />
                <div className="flex-1 h-7 sm:h-8 bg-slate-100 rounded-full" />
                <div className="w-14 sm:w-16 h-4 bg-slate-200/70 rounded-md shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
