"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, ChevronUp, MapPin } from "lucide-react";
import {
  DEFAULT_SEARCH_RESULTS,
  type SearchResultItem,
} from "@/features/map/domain/models/map.types";

export type MapSearchBarProps = {
  results?: SearchResultItem[];
  onSearch?: (query: string, filterType: "codigo" | "nombre") => void;
  onSelectResult?: (item: SearchResultItem) => void;
  className?: string;
};

export function MapSearchBar({
  results = DEFAULT_SEARCH_RESULTS,
  onSearch,
  onSelectResult,
  className = "",
}: MapSearchBarProps) {
  const [query, setQuery] = useState("CF-");
  const [filterType, setFilterType] = useState<"codigo" | "nombre">("codigo");
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filtrado de resultados basado en la query y el filtro
  const filteredResults = results.filter((item) => {
    if (!query.trim()) return true;
    const cleanQuery = query.toLowerCase().trim();
    if (filterType === "codigo") {
      return item.code.toLowerCase().includes(cleanQuery);
    }
    return item.name.toLowerCase().includes(cleanQuery);
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
    onSearch?.(query, filterType);
  };

  const handleClear = () => {
    setQuery("");
  };

  const handleResultClick = (item: SearchResultItem) => {
    setIsExpanded(false);
    onSelectResult?.(item);
  };

  return (
    <div
      ref={containerRef}
      className={`absolute top-3 right-3 sm:top-4 sm:right-4 z-[1000] w-[calc(100vw-1.5rem)] sm:w-[360px] md:w-[420px] max-w-[calc(100vw-1.5rem)] bg-white/95 backdrop-blur-md rounded-xl shadow-float border border-gray-100/90 overflow-hidden transition-all duration-300 ease-in-out flex flex-col select-none ${className}`}
      data-purpose="top-search-panel"
      id="search-card-container"
    >
      {/* Search Inputs Header Row */}
      <form
        onSubmit={handleSearchSubmit}
        className="h-10 px-3 flex items-center gap-2 shrink-0"
      >
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          id="gis-search-input"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isExpanded) setIsExpanded(true);
          }}
          onFocus={() => setIsExpanded(true)}
          placeholder="Buscar código o nombre..."
          className="border-0 bg-transparent text-xs text-gray-700 focus:ring-0 placeholder-gray-400 flex-1 min-w-0 p-0 outline-none"
        />

        {query && (
          <button
            type="button"
            id="clear-search-btn"
            onClick={handleClear}
            aria-label="Limpiar búsqueda"
            className="text-gray-400 hover:text-gray-600 p-0.5 rounded transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        <div className="h-4 w-px bg-gray-200" />

        <select
          id="gis-search-filter"
          value={filterType}
          onChange={(e) =>
            setFilterType(e.target.value as "codigo" | "nombre")
          }
          className="border-0 bg-transparent text-xs font-medium text-gray-700 focus:ring-0 outline-none cursor-pointer py-1 pr-4 pl-1"
        >
          <option value="codigo">Código Fijo</option>
          <option value="nombre">Nombre</option>
        </select>

        <button
          type="submit"
          id="buscar-button"
          className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition ml-1 shrink-0 inline-flex items-center gap-1 cursor-pointer"
        >
          Buscar
        </button>
      </form>

      {/* Integrated Expanding Results Container */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-out border-t bg-white ${
          isExpanded
            ? "max-h-96 opacity-100 border-gray-100"
            : "max-h-0 opacity-0 border-transparent pointer-events-none"
        }`}
        id="search-results-container"
      >
        {/* Header with Results Counter */}
        <div className="px-3.5 py-2 bg-slate-50/80 border-b border-gray-100 flex items-center justify-between text-[11px]">
          <span className="font-semibold text-gray-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span id="results-count-label">
              Resultados encontrados ({filteredResults.length})
            </span>
          </span>
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="text-[11px] text-gray-400 hover:text-gray-600 flex items-center gap-0.5 transition font-medium cursor-pointer"
            id="collapse-results-btn"
          >
            <span>Cerrar</span>
            <ChevronUp className="w-3 h-3" />
          </button>
        </div>

        {/* Scrollable Results List */}
        <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 text-left">
          {filteredResults.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-400">
              No se encontraron coincidencias para &quot;{query}&quot;
            </div>
          ) : (
            filteredResults.map((item) => (
              <div
                key={item.code}
                onClick={() => handleResultClick(item)}
                className="p-3 hover:bg-blue-50/40 cursor-pointer transition flex items-start justify-between gap-3 group"
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-100/70 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900 group-hover:text-blue-600 transition">
                        {item.code}
                      </span>
                      <span className="text-xs text-gray-600 font-medium">
                        {item.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1.5">
                      <span>
                        {item.zone} • Lat {item.lat.toFixed(3)}, Lng{" "}
                        {item.lng.toFixed(3)}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${item.tagColor}`}
                  >
                    {item.actionTag}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {Math.round(item.score * 100)}% score
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick Footer Bar inside card */}
        <div className="px-3.5 py-2 bg-slate-50/90 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
          <span>Presione Esc para cerrar</span>
          <span className="text-blue-600 hover:underline cursor-pointer font-medium">
            Ver en tabla completa →
          </span>
        </div>
      </div>
    </div>
  );
}

export default MapSearchBar;
