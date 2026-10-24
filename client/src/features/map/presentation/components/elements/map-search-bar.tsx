import React, { useState, useEffect, useRef } from "react";
import { X, Loader2 } from "lucide-react";
import { MapSearchForm } from "../forms/map-search-form";
import { MapSearchResultCard } from "./map-search-result-card";
import type { SearchResultItem } from "@/features/map/domain/entities/map.entity";
import type { HighlightedMapEntity } from "@/features/map/domain/entities/highlighted-entity.entity";
import { useMapSearch } from "../../hooks/use-map-search";

import { cn } from "@/lib/utils";

export type MapSearchBarProps = {
  results?: SearchResultItem[];
  onSearch?: (query: string, filterType: "codigo" | "nombre") => void;
  onSelectResult?: (item: SearchResultItem) => void;
  onSelectEntity?: (entity: HighlightedMapEntity) => void;
  onClear?: () => void;
  className?: string;
  initialQuery?: string;
  highlightedEntity?: HighlightedMapEntity | null;
};

export function MapSearchBar({
  onSearch,
  onSelectResult,
  onSelectEntity,
  onClear,
  className = "",
  initialQuery,
  highlightedEntity,
}: MapSearchBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    query,
    setQuery,
    filterType,
    results,
    isSearching,
    executeSearch,
    handleClear,
    handleFilterTypeChange,
    handleSelectResult,
  } = useMapSearch({
    highlightedEntity,
    onSelectEntity,
    onClear,
    initialQuery,
  });

  // Manejo de atajo de teclado Escape para cerrar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsExpanded(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Cierre al hacer clic fuera del panel de búsqueda
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsExpanded(true);
    executeSearch(query, filterType);
    onSearch?.(query, filterType);
  };

  const handleResultClick = (item: SearchResultItem) => {
    setIsExpanded(false);
    onSelectResult?.(item);
    handleSelectResult(item);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute top-3 right-3 sm:top-4 sm:right-4 lg:top-[93px] lg:right-6 z-[1000] w-[calc(100vw-1.5rem)] sm:w-[520px] md:w-[580px] lg:w-[620px] xl:w-[660px] max-w-[calc(100vw-1.5rem)] bg-white shadow-md shadow-slate-900/5 border-0 overflow-hidden rounded-[30px] transition-[box-shadow] duration-200 flex flex-col select-none",
        className
      )}
      data-purpose="top-search-panel"
      id="search-card-container"
    >
      {/* Search Inputs Header Row usando componente modular MapSearchForm */}
      <MapSearchForm
        query={query}
        onQueryChange={(val) => setQuery(val)}
        filterType={filterType}
        onFilterTypeChange={handleFilterTypeChange}
        onSearch={handleSearchSubmit}
        onClear={() => {
          handleClear();
          setIsExpanded(false);
        }}
        isSearching={isSearching}
      />

      {/* Integrated Expanding Results Container */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-out bg-white ${
          isExpanded
            ? "max-h-[460px] opacity-100 border-t border-slate-100"
            : "max-h-0 opacity-0 pointer-events-none"
        }`}
        id="search-results-container"
      >
        {/* Header with Results Counter (Fila blanca limpia con Cerrar en óvalo gris) */}
        <div className="px-4 py-3 bg-white border-b border-slate-100 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2">
            {isSearching ? (
              <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-blue-600" />
            )}
            <span className="font-semibold text-slate-800 font-sans tracking-tight" id="results-count-label">
              {isSearching
                ? "Buscando códigos fijos..."
                : `Resultados encontrados (${results.length})`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="h-7 px-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 text-[11px] font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer border-0 active:scale-95"
            id="collapse-results-btn"
            aria-label="Cerrar resultados"
          >
            <span>Cerrar</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Scrollable Results List con Tarjetas Limpias */}
        <div className="max-h-[360px] overflow-y-auto p-3 space-y-2.5 text-left bg-white">
          {results.length === 0 ? (
            <div className="py-8 px-4 text-center text-xs text-muted-foreground font-sans">
              {isSearching
                ? "Buscando entidades en el catálogo..."
                : !query.trim()
                ? "Escriba un código o nombre y pulse Buscar"
                : `No se encontraron códigos fijos para "${query}"`}
            </div>
          ) : (
            results.map((item, index) => (
              <MapSearchResultCard
                key={item.id ? `search-${item.id}` : `search-${item.code}-${index}`}
                item={item}
                onClick={() => handleResultClick(item)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default MapSearchBar;

