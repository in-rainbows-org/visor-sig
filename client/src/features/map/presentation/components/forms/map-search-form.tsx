"use client";

import React from "react";
import { Search, X, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

export type MapSearchFormProps = {
  query: string;
  onQueryChange: (query: string) => void;
  filterType: "codigo" | "nombre";
  onFilterTypeChange: (filterType: "codigo" | "nombre") => void;
  onSearch: (e?: React.FormEvent) => void;
  onClear: () => void;
  isSearching: boolean;
  className?: string;
  onFocus?: () => void;
};

export function MapSearchForm({
  query,
  onQueryChange,
  filterType,
  onFilterTypeChange,
  onSearch,
  onClear,
  isSearching,
  className = "",
  onFocus,
}: MapSearchFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(e);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("p-1.5 sm:p-2 flex items-center gap-2 sm:gap-2.5 shrink-0 bg-transparent", className)}
    >
      <div className="flex-1 flex items-center gap-2.5 bg-slate-100/80 hover:bg-slate-100 focus-within:bg-slate-100 rounded-full px-4 h-11 border-0 shadow-none transition-colors">
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          id="gis-search-input"
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={onFocus}
          placeholder={
            filterType === "codigo"
              ? "Buscar código fijo..."
              : "Buscar por titular..."
          }
          className="border-0 bg-transparent text-xs sm:text-sm text-foreground focus:ring-0 placeholder-slate-400 flex-1 min-w-0 p-0 outline-none font-sans"
        />

        {query && (
          <button
            type="button"
            id="clear-search-btn"
            onClick={onClear}
            aria-label="Limpiar búsqueda"
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Shadcn Select para Parámetro de Búsqueda */}
      <Select
        value={filterType}
        onValueChange={(val) => onFilterTypeChange(val as "codigo" | "nombre")}
      >
        <SelectTrigger className="h-11 w-[150px] sm:w-[160px] rounded-full bg-slate-100/80 hover:bg-slate-100 border-0 shadow-none text-xs font-semibold font-sans shrink-0 px-4 focus:ring-0 transition-colors cursor-pointer">
          <SelectValue placeholder="Parámetro" />
        </SelectTrigger>
        <SelectContent
          position="item-aligned"
          className="font-sans text-xs rounded-2xl border-0 shadow-2xl shadow-slate-900/10 p-1.5"
        >
          <SelectItem value="codigo" className="rounded-xl cursor-pointer">Código Fijo</SelectItem>
          <SelectItem value="nombre" className="rounded-xl cursor-pointer">Nombre / Titular</SelectItem>
        </SelectContent>
      </Select>

      <Button
        type="submit"
        id="buscar-button"
        size="sm"
        disabled={isSearching}
        className="h-11 px-6 rounded-full text-xs font-semibold font-sans bg-gradient-to-r from-[#0e4dcb] via-[#1a66e5] to-[#2579f6] hover:opacity-95 text-white shadow-none border-0 shrink-0 cursor-pointer transition-all active:scale-[0.98]"
      >
        {isSearching ? (
          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
        ) : (
          <Search className="w-3.5 h-3.5 mr-1.5" />
        )}
        <span>{isSearching ? "Buscando..." : "Buscar"}</span>
      </Button>
    </form>
  );
}

export default MapSearchForm;
