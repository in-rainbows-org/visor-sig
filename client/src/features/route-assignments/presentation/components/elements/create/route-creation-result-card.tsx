"use client";

import React from "react";
import { Hash, User, MapPin, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FixedCodeCandidate } from "../../../../domain/entities/fixed-code-candidate.entity";
import { cn } from "@/lib/utils";

export type RouteCreationResultCardProps = {
  candidate: FixedCodeCandidate;
  onSelect?: (candidate: FixedCodeCandidate) => void;
  onAdd?: (candidate: FixedCodeCandidate) => void;
  isAdded?: boolean;
  className?: string;
};

function getStatusBadge(status: number) {
  switch (status) {
    case 1:
      return { text: "Activo", className: "bg-emerald-50 text-emerald-700 border-emerald-200/60" };
    case 2:
      return { text: "Cortado", className: "bg-amber-50 text-amber-700 border-amber-200/60" };
    case 3:
      return { text: "Inactivo", className: "bg-rose-50 text-rose-700 border-rose-200/60" };
    case 4:
      return { text: "En Espera", className: "bg-slate-100 text-slate-700 border-slate-200/60" };
    case 5:
      return { text: "Retirado", className: "bg-red-50 text-red-700 border-red-200/60" };
    default:
      return { text: `Estado ${status}`, className: "bg-slate-100 text-slate-700 border-slate-200/60" };
  }
}

export function RouteCreationResultCard({
  candidate,
  onSelect,
  onAdd,
  isAdded = false,
  className = "",
}: RouteCreationResultCardProps) {
  const badge = getStatusBadge(candidate.status);

  return (
    <div
      onClick={() => onSelect?.(candidate)}
      className={cn(
        "p-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200/80 active:bg-slate-200 border border-slate-200/80 cursor-pointer transition-all shadow-none flex flex-col gap-2.5 group select-none",
        className
      )}
    >
      {/* Fila Superior: Icono + Código Fijo + Badge de Estado + Botón Agregar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0 border-0 shadow-none">
            <Hash className="size-4" />
          </span>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">
              Código Fijo
            </span>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate font-sans">
              {candidate.fixedCode ? `#${candidate.fixedCode}` : "S/C"}
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className={cn(
              "text-[10px] sm:text-[11px] font-semibold font-sans px-2.5 py-0.5 rounded-full border shadow-none inline-flex items-center",
              badge.className
            )}
          >
            {badge.text}
          </span>

          <Button
            type="button"
            size="sm"
            disabled={isAdded}
            onClick={(e) => {
              e.stopPropagation();
              onAdd?.(candidate);
            }}
            className={cn(
              "h-7 px-2.5 sm:px-3 rounded-full text-xs font-semibold gap-1 transition-all shadow-none shrink-0 cursor-pointer",
              isAdded
                ? "bg-emerald-600 hover:bg-emerald-600 text-white cursor-default"
                : "bg-blue-600 hover:bg-blue-700 text-white active:scale-95"
            )}
          >
            {isAdded ? (
              <>
                <Check className="size-3.5 stroke-[2.5]" />
                <span className="hidden xs:inline">Agregado</span>
              </>
            ) : (
              <>
                <Plus className="size-3.5 stroke-[2.5]" />
                <span>Agregar</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Caja de Datos: Titular y Coordenadas geográficas con fondo blanco */}
      <div className="rounded-xl bg-white/95 p-2.5 space-y-1.5 text-xs text-slate-600 border border-slate-200/50 font-sans shadow-none">
        <div className="flex items-center gap-2 text-slate-700">
          <User className="size-3.5 text-slate-400 shrink-0" />
          <span className="font-semibold truncate font-sans text-slate-800 text-xs">
            {candidate.name || "Sin titular registrado"}
          </span>
        </div>
        <div className="flex items-center justify-between text-slate-500 pt-1.5 border-t border-slate-100 text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-600 font-mono">
            <MapPin className="size-3 text-slate-400 shrink-0" />
            <span>
              {candidate.latitude.toFixed(5)}, {candidate.longitude.toFixed(5)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RouteCreationResultCard;
