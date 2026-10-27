"use client";

import React from "react";
import { Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface StatsSectionHeaderProps {
  lastUpdatedAt: string;
  onRefresh: () => void | Promise<void>;
  isRefreshing?: boolean;
}

export function StatsSectionHeader({
  lastUpdatedAt,
  onRefresh,
  isRefreshing = false,
}: StatsSectionHeaderProps) {
  return (
    <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 px-0.5 select-none w-full">
      {/* Título de la sección */}
      <div className="min-w-0">
        <h3 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight truncate">
          Resumen Estadístico
        </h3>
      </div>

      {/* Badge redondeado de última actualización a la derecha */}
      <div className="rounded-full bg-white px-3 sm:px-4 py-1.5 sm:py-2 border-0 shadow-none flex items-center gap-2.5 sm:gap-3 shrink-0">
        {/* Icono de Reloj Azul sin fondo y más grande */}
        <Clock className="w-5.5 h-5.5 sm:w-6.5 sm:h-6.5 text-[#1b64ea] shrink-0" strokeWidth={2.2} />

        {/* Texto: Actualizado y fecha/hora */}
        <div className="flex flex-col justify-center leading-none">
          <span className="text-[9px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Actualizado
          </span>
          <span className="text-[11px] sm:text-sm font-bold text-slate-800 mt-0.5 font-sans whitespace-nowrap">
            {lastUpdatedAt}
          </span>
        </div>

        {/* Botón de refresco interactivo */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Refrescar estadísticas"
          className="w-6 h-6 sm:w-7 sm:h-7 rounded-full text-slate-400 hover:text-[#1b64ea] hover:bg-blue-50/80 transition-colors shrink-0"
        >
          <RefreshCw className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isRefreshing ? "animate-spin text-[#1b64ea]" : ""}`} />
        </Button>
      </div>
    </div>
  );
}
