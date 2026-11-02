"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, Loader2, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RouteCreationResultCard } from "./route-creation-result-card";
import type { FixedCodeCandidate } from "../../../../domain/entities/fixed-code-candidate.entity";
import { cn } from "@/lib/utils";

export type RouteCreationSearchBarProps = {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: (query: string) => void;
  onClear: () => void;
  candidates: FixedCodeCandidate[];
  isSearching: boolean;
  isExpanded: boolean;
  onToggleExpand: (expanded: boolean) => void;
  onSelectCandidate: (candidate: FixedCodeCandidate) => void;
  onAddCandidate: (candidate: FixedCodeCandidate) => void;
  addedCandidates: FixedCodeCandidate[];
  className?: string;
};

export function RouteCreationSearchBar({
  query,
  onQueryChange,
  onSearch,
  onClear,
  candidates,
  isSearching,
  isExpanded,
  onToggleExpand,
  onSelectCandidate,
  onAddCandidate,
  addedCandidates,
  className = "",
}: RouteCreationSearchBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Atajo de teclado Escape para cerrar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onToggleExpand(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onToggleExpand]);

  // Cierre al hacer clic fuera del panel
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onToggleExpand(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onToggleExpand]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onToggleExpand(true);
    onSearch(query);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "hidden lg:flex absolute lg:top-[93px] lg:right-6 z-[1000] lg:w-[560px] max-w-[calc(100vw-1.5rem)] bg-white shadow-md shadow-slate-900/10 border border-slate-200/60 overflow-hidden rounded-[28px] transition-[box-shadow] duration-200 flex-col select-none",
        className
      )}
    >
      {/* Fila de Input y Botón de Búsqueda */}
      <form
        onSubmit={handleSubmit}
        className="p-1.5 flex items-center gap-2 sm:gap-2.5 shrink-0 bg-transparent"
      >
        <div className="flex-1 flex items-center gap-2 bg-slate-100 hover:bg-slate-200/70 focus-within:bg-slate-200/80 rounded-full px-3.5 h-[38px] border border-slate-200/60 transition-colors">
          <Hash className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <input
            type="text"
            inputMode="numeric"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={() => {
              if (candidates.length > 0) onToggleExpand(true);
            }}
            placeholder="Buscar por código fijo (ej. 1024)..."
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
          className="h-[38px] px-4 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold shrink-0 gap-1.5 transition-all shadow-none cursor-pointer disabled:opacity-50"
        >
          {isSearching ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Search className="w-3.5 h-3.5" />
          )}
          <span>Buscar</span>
        </Button>
      </form>

      {/* Desplegable integrado de resultados */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-out bg-white",
          isExpanded
            ? "max-h-[460px] opacity-100 border-t border-slate-100"
            : "max-h-0 opacity-0 pointer-events-none"
        )}
      >
        {/* Encabezado con contador y botón cerrar */}
        <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2">
            {isSearching ? (
              <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-blue-600" />
            )}
            <span className="font-semibold text-slate-800 font-sans tracking-tight">
              {isSearching
                ? "Buscando códigos fijos..."
                : `Resultados encontrados (${candidates.length})`}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onToggleExpand(false)}
            className="h-7 px-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 text-[11px] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer border-0 active:scale-95"
            aria-label="Cerrar resultados"
          >
            <span>Cerrar</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Lista de resultados scrolleable */}
        <div className="max-h-[360px] overflow-y-auto p-3 space-y-2.5 text-left bg-white">
          {candidates.length === 0 ? (
            <div className="py-8 px-4 text-center text-xs text-muted-foreground font-sans">
              {isSearching
                ? "Consultando catálogo de conexiones..."
                : !query.trim()
                ? "Ingrese un código fijo y presione Buscar"
                : `No se encontraron códigos fijos para "${query}"`}
            </div>
          ) : (
            candidates.map((cand) => (
              <RouteCreationResultCard
                key={cand.id}
                candidate={cand}
                onSelect={onSelectCandidate}
                onAdd={onAddCandidate}
                isAdded={addedCandidates.some((c) => c.id === cand.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default RouteCreationSearchBar;
