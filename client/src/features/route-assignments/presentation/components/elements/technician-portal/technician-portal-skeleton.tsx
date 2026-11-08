"use client";

import React from "react";

export function TechnicianPortalSkeleton() {
  return (
    <div className="w-full space-y-6 sm:space-y-8 select-none animate-pulse">
      {/* Sección 1: Tarjetas superiores */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch">
        {/* Card activa */}
        <div className="lg:col-span-7 h-36 sm:h-40 rounded-[28px] sm:rounded-[36px] bg-white border-0 shadow-none p-5 sm:p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 flex-1">
            <div className="size-16 sm:size-20 rounded-2xl bg-slate-100 shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-5 w-24 bg-slate-100 rounded-full" />
              <div className="h-6 w-44 bg-slate-100 rounded-lg" />
              <div className="h-3.5 w-32 bg-slate-100 rounded-md" />
            </div>
          </div>
          <div className="size-11 rounded-full bg-slate-100 shrink-0" />
        </div>

        {/* Card pendientes */}
        <div className="lg:col-span-5 h-36 sm:h-40 rounded-[28px] sm:rounded-[36px] bg-white border-0 shadow-none p-5 sm:p-6 flex items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-4 w-28 bg-slate-100 rounded-md" />
            <div className="h-10 w-16 bg-slate-100 rounded-lg" />
            <div className="h-5 w-24 bg-slate-100 rounded-full" />
          </div>
          <div className="size-20 sm:size-24 rounded-2xl bg-slate-100 shrink-0 ml-auto" />
        </div>
      </div>

      {/* Sección 2: Gráfico de rendimiento */}
      <div className="rounded-[28px] sm:rounded-[36px] bg-white border-0 shadow-none p-6 sm:p-7 space-y-5">
        <div className="flex items-center justify-between">
          <div className="h-5 w-48 bg-slate-100 rounded-md" />
          <div className="h-3.5 w-28 bg-slate-100 rounded-md" />
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-full sm:w-36 space-y-2 shrink-0">
            <div className="h-3.5 w-24 bg-slate-100 rounded-md" />
            <div className="h-10 w-20 bg-slate-100 rounded-lg" />
          </div>
          <div className="flex-1 w-full h-36 sm:h-40 bg-slate-100/70 rounded-2xl" />
        </div>
      </div>

      {/* Sección 3: Feed de asignaciones */}
      <div className="space-y-4">
        <div className="h-6 w-44 bg-slate-200/80 rounded-md" />
        <div className="h-11 w-72 sm:w-80 bg-slate-200/60 rounded-full" />
        <div className="space-y-3 pt-1">
          <div className="h-24 sm:h-26 rounded-[24px] sm:rounded-[30px] bg-white border-0 shadow-none p-4 flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-slate-100 shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-36 bg-slate-100 rounded-md" />
              <div className="h-3 w-28 bg-slate-100 rounded-md" />
              <div className="h-4 w-44 bg-slate-100 rounded-full" />
            </div>
            <div className="w-2.5 h-5 rounded-xs bg-slate-100 shrink-0 mr-1" />
          </div>
          <div className="h-24 sm:h-26 rounded-[24px] sm:rounded-[30px] bg-white border-0 shadow-none p-4 flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-slate-100 shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-36 bg-slate-100 rounded-md" />
              <div className="h-3 w-28 bg-slate-100 rounded-md" />
              <div className="h-4 w-44 bg-slate-100 rounded-full" />
            </div>
            <div className="w-2.5 h-5 rounded-xs bg-slate-100 shrink-0 mr-1" />
          </div>
        </div>
      </div>
    </div>
  );
}
