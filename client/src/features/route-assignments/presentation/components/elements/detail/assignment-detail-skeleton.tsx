"use client";

import React from "react";

export function AssignmentDetailSkeleton() {
  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-100/50">
      {/* 1. Fondo de mapa simulado con pulso suave */}
      <div className="absolute inset-0 bg-slate-200/40 animate-pulse" />

      {/* 2. Card lateral izquierdo skeleton */}
      <div className="hidden lg:flex absolute lg:left-[96px] lg:w-[468px] top-[93px] bottom-4 z-[1000] pointer-events-none flex-col bg-white rounded-2xl border-0 shadow-none overflow-hidden p-6 select-none">
        {/* Cabecera: Botón de volver y Título + Badge */}
        <div className="space-y-3 shrink-0 pb-2 border-b border-slate-100">
          <div className="w-24 h-7 bg-slate-200/80 rounded-full animate-pulse" />
          <div className="flex items-center justify-between gap-3">
            <div className="w-48 h-6 bg-slate-200 rounded-lg animate-pulse" />
            <div className="w-20 h-6 bg-slate-200 rounded-full animate-pulse" />
          </div>
        </div>

        {/* Resumen: Tarjetas */}
        <div className="space-y-2.5 pt-3 shrink-0">
          {/* Card Técnico */}
          <div className="w-full h-16 bg-slate-200/70 rounded-3xl animate-pulse" />
          {/* Card Fecha */}
          <div className="w-full h-14 bg-slate-100 rounded-3xl animate-pulse" />
          {/* Card Servicio */}
          <div className="w-full h-14 bg-slate-100 rounded-3xl animate-pulse" />
          {/* Grid 2 cols: Casas y Distancia */}
          <div className="grid grid-cols-2 gap-2">
            <div className="h-14 bg-slate-100 rounded-3xl animate-pulse" />
            <div className="h-14 bg-slate-100 rounded-3xl animate-pulse" />
          </div>
        </div>

        {/* Progreso Skeleton */}
        <div className="pt-4 space-y-2 shrink-0">
          <div className="flex justify-between items-center">
            <div className="w-36 h-4 bg-slate-200 rounded animate-pulse" />
            <div className="w-24 h-4 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="w-full h-2.5 bg-slate-200/70 rounded-full animate-pulse" />
        </div>

        {/* Lista de Paradas Skeleton */}
        <div className="flex-1 min-h-0 pt-4 space-y-2 overflow-hidden">
          <div className="w-32 h-4 bg-slate-200 rounded animate-pulse mb-3" />
          <div className="w-full h-16 bg-slate-100 rounded-2xl animate-pulse" />
          <div className="w-full h-16 bg-slate-100 rounded-2xl animate-pulse" />
          <div className="w-full h-16 bg-slate-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}
