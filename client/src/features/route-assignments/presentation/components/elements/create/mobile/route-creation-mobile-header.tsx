"use client";

import React from "react";
import { Search, X, Loader2, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RouteCreationMobileHeaderProps } from "./types";
import { cn } from "@/lib/utils";

export function RouteCreationMobileHeader({
  query,
  onQueryChange,
  onSearch,
  onClear,
  isSearching,
  candidatesCount,
  className = "",
}: RouteCreationMobileHeaderProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isSearching) return;
    onSearch(e);
  };

  return (
    <div
      className={cn(
        "absolute top-0 left-0 right-0 z-[500] select-none flex flex-col pointer-events-none lg:hidden",
        className
      )}
      data-purpose="route-creation-mobile-header"
    >
      {/* Contenedor Banner Azul: Estilo idéntico a MapMobileHeader con degradado oficial */}
      <div
        className="w-full pt-[84px] sm:pt-[88px] px-4 pb-3.5 transition-all duration-300 pointer-events-auto touch-none overscroll-none rounded-b-[40px] sm:rounded-b-[48px] shadow-none border-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, #0e4dcb 0%, #135ad6 28%, #1c6ee7 68%, #3392f9 100%)",
          backgroundSize: "100vw 100%",
        }}
      >
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 w-full max-w-full overflow-hidden animate-in fade-in-0 duration-200"
        >
          {/* Input de búsqueda blanco redondeado con min-w-0 estricto para evitar que crezca */}
          <div className="flex-1 min-w-0 flex items-center gap-2 bg-white rounded-full px-3.5 h-11 shadow-none border-0 overflow-hidden">
            <Hash className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              id="route-creation-mobile-search-input"
              type="text"
              inputMode="numeric"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Buscar código fijo..."
              className="border-0 bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:ring-0 flex-1 min-w-0 w-full p-0 outline-none font-sans"
            />

            {query && (
              <button
                type="button"
                id="route-creation-mobile-clear-search-btn"
                onClick={onClear}
                aria-label="Limpiar búsqueda"
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full transition cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Botón de búsqueda oscuro para alto contraste sobre el banner azul */}
          <Button
            type="submit"
            id="route-creation-mobile-search-btn"
            disabled={isSearching || !query.trim()}
            className="h-11 px-4 sm:px-5 rounded-full bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-semibold font-sans shadow-none border-0 cursor-pointer transition-all shrink-0 gap-1.5 disabled:opacity-50"
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
    </div>
  );
}

export default RouteCreationMobileHeader;
