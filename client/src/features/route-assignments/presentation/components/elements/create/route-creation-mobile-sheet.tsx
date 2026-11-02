"use client";

import React from "react";
import { Search, X, Loader2, Hash } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { RouteCreationResultCard } from "./route-creation-result-card";
import type { FixedCodeCandidate } from "../../../../domain/entities/fixed-code-candidate.entity";
import { cn } from "@/lib/utils";

export type RouteCreationMobileSheetProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: (query: string) => void;
  onClear: () => void;
  candidates: FixedCodeCandidate[];
  isSearching: boolean;
  onSelectCandidate: (candidate: FixedCodeCandidate) => void;
  onAddCandidate: (candidate: FixedCodeCandidate) => void;
  addedCandidates: FixedCodeCandidate[];
  className?: string;
};

export function RouteCreationMobileSheet({
  isOpen,
  onOpenChange,
  query,
  onQueryChange,
  onSearch,
  onClear,
  candidates,
  isSearching,
  onSelectCandidate,
  onAddCandidate,
  addedCandidates,
  className = "",
}: RouteCreationMobileSheetProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch(query);
    onOpenChange(true);
  };

  return (
    <>
      {/* Barra de Búsqueda Móvil Flotante Superior */}
      <div
        className={cn(
          "lg:hidden fixed top-3 left-3 right-3 z-[1000] bg-white rounded-full shadow-md shadow-slate-900/10 border border-slate-200/60 p-1.5 flex items-center gap-2 select-none",
          className
        )}
      >
        <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-slate-100 hover:bg-slate-200/70 focus-within:bg-slate-200/80 rounded-full px-3 h-[36px] border border-slate-200/60 transition-colors">
            <Hash className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <input
              type="text"
              inputMode="numeric"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Buscar código fijo..."
              className="border-0 bg-transparent text-xs text-foreground focus:ring-0 placeholder-slate-400 flex-1 min-w-0 p-0 outline-none font-sans"
            />
            {query && (
              <button
                type="button"
                onClick={onClear}
                aria-label="Limpiar búsqueda"
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <Button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="h-[36px] px-3.5 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold shrink-0 gap-1 transition-all shadow-none cursor-pointer disabled:opacity-50"
          >
            {isSearching ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5" />
            )}
            <span>Buscar</span>
          </Button>
        </form>
      </div>

      {/* Bottom Sheet Desplegable en Móviles */}
      <Sheet open={isOpen} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="rounded-t-[32px] p-0 max-h-[80vh] flex flex-col bg-white border-slate-200/80 select-none outline-none"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Resultados de búsqueda de códigos fijos</SheetTitle>
            <SheetDescription>
              Seleccione un código fijo para enfocarlo en el mapa o pulse agregar
            </SheetDescription>
          </SheetHeader>

          {/* Manija táctil (Drag Handle) */}
          <div className="pt-2.5 pb-1 flex justify-center shrink-0">
            <div className="w-10 h-1 bg-slate-300 rounded-full" />
          </div>

          {/* Fila de Encabezado: Botón Cerrar y Contador */}
          <div className="px-4 pb-2.5 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              {isSearching ? (
                <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-blue-600" />
              )}
              <h3 className="text-xs font-bold text-slate-800 tracking-tight font-sans">
                {isSearching
                  ? "Buscando en catálogo..."
                  : `Resultados encontrados (${candidates.length})`}
              </h3>
            </div>

            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer border-0 active:scale-95"
              aria-label="Cerrar resultados"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Lista de Resultados con Tarjetas */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 max-h-[60vh] overscroll-contain bg-white">
            {candidates.length === 0 ? (
              <div className="py-10 px-4 text-center text-xs text-muted-foreground flex flex-col items-center gap-1.5 font-sans">
                {isSearching ? (
                  <span>Consultando base de datos espacial...</span>
                ) : !query.trim() ? (
                  <span>Ingrese un código fijo y presione Buscar</span>
                ) : (
                  <span>No se encontraron códigos fijos para &quot;{query}&quot;</span>
                )}
              </div>
            ) : (
              candidates.map((cand) => (
                <RouteCreationResultCard
                  key={cand.id}
                  candidate={cand}
                  onSelect={(c) => {
                    onSelectCandidate(c);
                    onOpenChange(false);
                  }}
                  onAdd={onAddCandidate}
                  isAdded={addedCandidates.some((c) => c.id === cand.id)}
                />
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export default RouteCreationMobileSheet;
