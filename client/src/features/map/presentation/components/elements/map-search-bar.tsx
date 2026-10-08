import React, { useState, useEffect, useRef } from "react";
import { ChevronUp, Loader2, Hash, User } from "lucide-react";
import { MapSearchForm } from "../forms/map-search-form";
import type { SearchResultItem } from "@/features/map/domain/entities/map.entity";
import type { HighlightedMapEntity } from "@/features/map/domain/entities/highlighted-entity.entity";
import { useMapSearch } from "../../hooks/use-map-search";

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
      className={`absolute top-3 right-3 sm:top-4 sm:right-4 z-[1000] w-[calc(100vw-1.5rem)] sm:w-[480px] md:w-[500px] lg:w-[520px] max-w-[calc(100vw-1.5rem)] bg-white/95 backdrop-blur-md rounded-2xl shadow-float border border-slate-200/90 overflow-hidden transition-all duration-300 ease-in-out flex flex-col select-none ${className}`}
      data-purpose="top-search-panel"
      id="search-card-container"
    >
      {/* Search Inputs Header Row usando componente modular MapSearchForm */}
      <MapSearchForm
        query={query}
        onQueryChange={(val) => {
          setQuery(val);
          if (!isExpanded) setIsExpanded(true);
        }}
        onFocus={() => setIsExpanded(true)}
        filterType={filterType}
        onFilterTypeChange={handleFilterTypeChange}
        onSearch={handleSearchSubmit}
        onClear={handleClear}
        isSearching={isSearching}
      />

      {/* Integrated Expanding Results Container */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-out border-t bg-card ${
          isExpanded
            ? "max-h-[460px] opacity-100 border-slate-100"
            : "max-h-0 opacity-0 border-transparent pointer-events-none"
        }`}
        id="search-results-container"
      >
        {/* Header with Results Counter */}
        <div className="px-3.5 py-2 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700 flex items-center gap-1.5 font-label">
            {isSearching ? (
              <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            )}
            <span id="results-count-label">
              {isSearching
                ? "Buscando códigos fijos..."
                : `Resultados encontrados (${results.length})`}
            </span>
          </span>
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-0.5 transition font-medium font-label cursor-pointer"
            id="collapse-results-btn"
          >
            <span>Cerrar</span>
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Scrollable Results List con Data Completa */}
        <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-2 space-y-2 text-left">
          {results.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground font-sans">
              {isSearching
                ? "Buscando entidades en el catálogo..."
                : !query.trim()
                ? "Escriba un código o nombre para realizar una búsqueda rápida"
                : `No se encontraron códigos fijos para "${query}"`}
            </div>
          ) : (
            results.map((item, index) => (
              <div
                key={item.id ? `search-${item.id}` : `search-${item.code}-${index}`}
                onClick={() => handleResultClick(item)}
                className="p-3 hover:bg-slate-50/90 active:bg-slate-100 cursor-pointer transition flex flex-col gap-2 rounded-xl border border-slate-200/70 bg-card shadow-2xs group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="p-1 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                      <Hash className="size-3.5" />
                    </span>
                    <div className="min-w-0">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider font-label block">
                        {item.label || "Código Fijo"}
                      </span>
                      <h4 className="text-xs font-bold text-foreground font-headline truncate">
                        {item.fixedCode ? `#${item.fixedCode}` : item.code}
                      </h4>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-medium font-label px-2 py-0.5 rounded-full border shrink-0 ${item.tagColor}`}
                  >
                    {item.actionTag}
                  </span>
                </div>

                <div className="rounded-lg bg-muted/40 px-2.5 py-1.5 space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <User className="size-3 text-slate-400 shrink-0" />
                    <span className="font-medium text-[11px] truncate font-sans">
                      {item.name || "Sin titular registrado"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground pt-1 border-t border-border/40 text-[11px]">
                    <span className="font-label text-[10px]">Lote asociado:</span>
                    <span className="font-semibold text-foreground font-mono">
                      {item.lotNumber || "No asignado"}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default MapSearchBar;

