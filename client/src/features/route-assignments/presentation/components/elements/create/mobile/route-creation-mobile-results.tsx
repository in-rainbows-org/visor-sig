"use client";

import React from "react";
import { X, Loader2, Home } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { RouteCreationResultCard } from "../route-creation-result-card";
import type { RouteCreationMobileResultsProps } from "./types";
import { cn } from "@/lib/utils";

export function RouteCreationMobileResultsSheet({
  isOpen,
  onOpenChange,
  candidates,
  isSearching,
  onSelectCandidate,
  onAddCandidate,
  addedCandidateIds,
  className = "",
}: RouteCreationMobileResultsProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className={cn(
          "lg:hidden fixed bottom-0 inset-x-0 h-[65vh] max-h-[80vh] rounded-t-[32px] bg-white border-0 shadow-2xl flex flex-col overflow-hidden outline-none z-[2000] p-0 m-0",
          className
        )}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Resultados de búsqueda</SheetTitle>
        </SheetHeader>

        {/* 1. Cabecera con manija táctil, título, contador y botón X */}
        <div className="flex items-center justify-between px-5 pt-3 pb-3 border-b border-slate-100 shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Home className="size-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 leading-tight">
                Resultados de búsqueda
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">
                {candidates.length} {candidates.length === 1 ? "vivienda encontrada" : "viviendas encontradas"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="size-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 transition-all cursor-pointer border-0"
            aria-label="Cerrar resultados"
          >
            <X className="size-4 stroke-[2.5]" />
          </button>
        </div>

        {/* 2. Cuerpo con scroll de resultados */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2.5 bg-slate-50/50">
          {isSearching ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="size-6 animate-spin text-blue-600" />
              <span className="text-xs font-medium">Buscando viviendas...</span>
            </div>
          ) : candidates.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center px-4 text-slate-400">
              <Home className="size-8 text-slate-300 mb-2 stroke-[1.5]" />
              <p className="text-xs font-semibold text-slate-700">Sin resultados</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                No se encontraron viviendas coincidentes con ese código fijo.
              </p>
            </div>
          ) : (
            candidates.map((cand) => {
              const isAdded = addedCandidateIds.includes(cand.id);
              return (
                <RouteCreationResultCard
                  key={cand.id}
                  candidate={cand}
                  onSelect={(candidate) => {
                    onSelectCandidate(candidate);
                  }}
                  onAdd={onAddCandidate}
                  isAdded={isAdded}
                />
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default RouteCreationMobileResultsSheet;
