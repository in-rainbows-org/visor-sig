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
      className={`p-2 flex items-center gap-2 shrink-0 bg-card ${className}`}
    >
      <div className="flex-1 flex items-center gap-2 bg-slate-50/90 rounded-xl border border-slate-200/80 px-3 h-9 shadow-2xs">
        <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
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
          className="border-0 bg-transparent text-xs text-foreground focus:ring-0 placeholder-muted-foreground flex-1 min-w-0 p-0 outline-none font-sans"
        />

        {query && (
          <button
            type="button"
            id="clear-search-btn"
            onClick={onClear}
            aria-label="Limpiar búsqueda"
            className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition cursor-pointer"
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
        <SelectTrigger className="h-9 w-[140px] rounded-xl bg-slate-50/90 border-slate-200/80 text-xs font-medium font-sans shrink-0">
          <SelectValue placeholder="Parámetro" />
        </SelectTrigger>
        <SelectContent className="font-sans text-xs">
          <SelectItem value="codigo">Código Fijo</SelectItem>
          <SelectItem value="nombre">Nombre / Titular</SelectItem>
        </SelectContent>
      </Select>

      <Button
        type="submit"
        id="buscar-button"
        size="sm"
        disabled={isSearching}
        className="h-9 px-3.5 rounded-xl text-xs font-semibold font-sans bg-app-primary hover:bg-app-primary/90 text-app-primary-foreground shadow-xs shrink-0 cursor-pointer"
      >
        {isSearching ? (
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        ) : (
          <Search className="w-3 h-3 mr-1" />
        )}
        <span>{isSearching ? "Buscando..." : "Buscar"}</span>
      </Button>
    </form>
  );
}

export default MapSearchForm;
