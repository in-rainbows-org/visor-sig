"use client";

import React from "react";
import { Hash, User, Plus, Check } from "lucide-react";
import {
  FIXED_CODE_STATUSES,
  type FixedCodeStatusValue,
} from "@/features/map/domain/entities/fixed-code-status.entity";
import type { FixedCodeCandidate } from "../../../../domain/entities/fixed-code-candidate.entity";
import { cn } from "@/lib/utils";

export type RouteCreationResultCardProps = {
  candidate: FixedCodeCandidate;
  onSelect?: (candidate: FixedCodeCandidate) => void;
  onAdd?: (candidate: FixedCodeCandidate) => void;
  isAdded?: boolean;
  className?: string;
};

const getStatusBadge = (statusValue: number) => {
  const def = FIXED_CODE_STATUSES[statusValue as FixedCodeStatusValue];
  if (!def) {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold border border-slate-200">
        Estado {statusValue}
      </span>
    );
  }

  const badgeColors: Record<number, string> = {
    1: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    2: "bg-amber-50 text-amber-700 border-amber-200/60",
    3: "bg-rose-50 text-rose-700 border-rose-200/60",
    4: "bg-orange-50 text-orange-700 border-orange-200/60",
    5: "bg-slate-100 text-slate-700 border-slate-200/60",
  };

  return (
    <span
      className={cn(
        "text-[10px] sm:text-[11px] font-semibold font-sans px-2.5 py-0.5 rounded-full border shadow-none inline-flex items-center",
        badgeColors[statusValue] ?? "bg-slate-100 text-slate-700 border-slate-200"
      )}
    >
      {def.label}
    </span>
  );
};

export function RouteCreationResultCard({
  candidate,
  onSelect,
  onAdd,
  isAdded = false,
  className = "",
}: RouteCreationResultCardProps) {
  return (
    <div
      onClick={() => onSelect?.(candidate)}
      className={cn(
        "p-3.5 rounded-2xl bg-white hover:bg-slate-50/80 border border-slate-200/80 cursor-pointer transition-all shadow-none flex flex-col gap-2.5 group select-none",
        className
      )}
    >
      {/* Fila Superior: Código Fijo a la izquierda y Badge de Estado a la derecha */}
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

        <div className="shrink-0">{getStatusBadge(candidate.status)}</div>
      </div>

      {/* Titular */}
      <div className="rounded-xl bg-slate-50/80 px-3 py-2 flex items-center gap-2 text-xs text-slate-700 border border-slate-200/50 font-sans shadow-none">
        <User className="size-3.5 text-slate-400 shrink-0" />
        <span className="font-semibold truncate text-slate-800 text-xs">
          {candidate.name || "Sin titular registrado"}
        </span>
      </div>

      {/* Botón inferior a ancho completo con degradado azul oficial */}
      <button
        type="button"
        disabled={isAdded}
        onClick={(e) => {
          e.stopPropagation();
          onAdd?.(candidate);
        }}
        className={cn(
          "w-full h-8 sm:h-9 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-none border-0 shrink-0 select-none",
          isAdded
            ? "bg-emerald-600 text-white cursor-default"
            : "bg-gradient-to-r from-[#0e4dcb] via-[#1a66e5] to-[#2579f6] text-white hover:opacity-95 active:scale-[0.99] cursor-pointer"
        )}
      >
        {isAdded ? (
          <>
            <Check className="size-3.5 stroke-[2.5]" />
            <span>Agregada a la ruta</span>
          </>
        ) : (
          <>
            <Plus className="size-3.5 stroke-[2.5]" />
            <span>Agregar a la ruta</span>
          </>
        )}
      </button>
    </div>
  );
}

export default RouteCreationResultCard;
