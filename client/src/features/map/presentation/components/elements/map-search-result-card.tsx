"use client";

import React from "react";
import { Hash, User } from "lucide-react";
import type { SearchResultItem } from "@/features/map/domain/entities/map.entity";
import { cn } from "@/lib/utils";

export type MapSearchResultCardProps = {
  item: SearchResultItem;
  onClick: () => void;
  className?: string;
};

function getStatusBadgeStyle(status?: number) {
  switch (status) {
    case 1:
      return "bg-emerald-50 text-emerald-600";
    case 2:
      return "bg-amber-50 text-amber-600";
    case 3:
      return "bg-rose-50 text-rose-600";
    case 4:
      return "bg-slate-100 text-slate-600";
    case 5:
      return "bg-red-50 text-red-600";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export function MapSearchResultCard({
  item,
  onClick,
  className = "",
}: MapSearchResultCardProps) {
  const status = item.status ?? item.statusVal;

  return (
    <div
      onClick={onClick}
      className={cn(
        "p-3.5 rounded-2xl bg-slate-50/90 hover:bg-slate-100/90 active:bg-slate-100 cursor-pointer transition-all border-0 shadow-none flex flex-col gap-2.5 group select-none",
        className
      )}
    >
      {/* Fila Superior: Icono + Código Fijo + Badge de Estado Plano */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0 border-0 shadow-none">
            <Hash className="size-4" />
          </span>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">
              {item.label || "Código Fijo"}
            </span>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate font-sans">
              {item.fixedCode ? `#${item.fixedCode}` : item.code}
            </h4>
          </div>
        </div>

        <span
          className={cn(
            "text-[11px] font-bold font-sans px-2.5 py-0.5 rounded-full border-0 shadow-none shrink-0 inline-flex items-center",
            getStatusBadgeStyle(status)
          )}
        >
          {item.actionTag}
        </span>
      </div>

      {/* Caja de Datos: Titular y Lote Asociado con fondo blanco */}
      <div className="rounded-xl bg-white/90 p-2.5 space-y-1.5 text-xs text-slate-600 border-0 font-sans shadow-none">
        <div className="flex items-center gap-2 text-slate-700">
          <User className="size-3.5 text-slate-400 shrink-0" />
          <span className="font-medium truncate font-sans text-slate-800 text-xs">
            {item.name || "Sin titular registrado"}
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-500 pt-1.5 border-t border-slate-100/80 text-[11px]">
          <span>Lote asociado:</span>
          <span className="font-semibold text-slate-800 font-mono">
            {item.lotNumber || "No asignado"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default MapSearchResultCard;
