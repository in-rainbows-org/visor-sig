"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Layers,
  MapPin,
  Search,
  X,
  Loader2,
  Hash,
  User,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useMapView } from "../../state/map-view-store";
import { MapLayersCard } from "./map-layers-card";
import { MapStatusCard } from "./map-status-card";
import { MapSearchResultCard } from "./map-search-result-card";
import { useMapSearch } from "../../hooks/use-map-search";
import type { HighlightedMapEntity } from "@/features/map/domain/entities/highlighted-entity.entity";

import { cn } from "@/lib/utils";

export type MapMobileHeaderProps = {
  highlightedEntity?: HighlightedMapEntity | null;
  onSelectEntity?: (entity: HighlightedMapEntity) => void;
  onClear?: () => void;
  className?: string;
};

export function MapMobileHeader({
  highlightedEntity,
  onSelectEntity,
  onClear,
  className = "",
}: MapMobileHeaderProps) {
  const { state } = useMapView();
  const { visibleLayerKinds } = state;

  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [capasOpen, setCapasOpen] = useState(false);
  const [estadoOpen, setEstadoOpen] = useState(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

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
  });

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    executeSearch(query, filterType);
    setIsBottomSheetOpen(true);
  };

  return (
    <>
      <div
        className={cn("w-full z-30 select-none flex flex-col pointer-events-none lg:hidden", className)}
        data-purpose="map-mobile-header"
      >
        {/* Contenedor Banner Azul: Permanece en azul con bordes redondeados idénticos a AppHeader tanto expandido como colapsado */}
        <div
          className="w-full pt-[84px] sm:pt-[88px] px-4 pb-3 transition-all duration-300 pointer-events-auto touch-none overscroll-none rounded-b-[40px] sm:rounded-b-[48px] shadow-none border-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, #0e4dcb 0%, #135ad6 28%, #1c6ee7 68%, #3392f9 100%)",
            backgroundSize: "100vw 100%",
          }}
        >
          {!isPanelCollapsed ? (
            <div className="flex flex-col gap-2.5 animate-in fade-in-0 duration-200">
              <form onSubmit={handleSearchSubmit} className="flex flex-col gap-2.5">
                {/* Fila 1: Input de búsqueda (60%) + Selector de parámetro (40%) */}
                <div className="flex items-center gap-2 w-full">
                  {/* Input de búsqueda blanco 60% */}
                  <div className="w-[60%] flex items-center gap-2 bg-white rounded-full px-3.5 h-11 shadow-none border-0">
                    <Search className="w-4 h-4 text-slate-400 shrink-0" />
                    <input
                      id="gis-mobile-search-input"
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={
                        filterType === "codigo"
                          ? "Buscar código..."
                          : "Buscar titular..."
                      }
                      className="border-0 bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:ring-0 flex-1 min-w-0 p-0 outline-none font-sans"
                    />

                    {query && (
                      <button
                        type="button"
                        id="mobile-clear-search-btn"
                        onClick={handleClear}
                        aria-label="Limpiar búsqueda"
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-full transition cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Selector blanco 40% */}
                  <div className="w-[40%]">
                    <Select
                      value={filterType}
                      onValueChange={(val) =>
                        handleFilterTypeChange(val as "codigo" | "nombre")
                      }
                    >
                      <SelectTrigger className="h-11 w-full rounded-full bg-white hover:bg-slate-50 border-0 text-slate-800 text-xs font-medium font-sans px-3.5 shadow-none focus:ring-0 transition-colors cursor-pointer">
                        <SelectValue placeholder="Parámetro" />
                      </SelectTrigger>
                      <SelectContent
                        position="popper"
                        className="z-[2000] font-sans text-xs rounded-2xl border-0 shadow-2xl shadow-slate-900/10 bg-white p-1.5"
                      >
                        <SelectItem value="codigo" className="rounded-xl cursor-pointer">Código Fijo</SelectItem>
                        <SelectItem value="nombre" className="rounded-xl cursor-pointer">Nombre / Titular</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Fila 2: Botón de búsqueda oscuro para alto contraste sobre el fondo azul */}
                <Button
                  type="submit"
                  id="mobile-buscar-button"
                  disabled={isSearching}
                  className="w-full h-11 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold font-sans shadow-none border-0 cursor-pointer active:scale-[0.98] transition-all"
                >
                  {isSearching ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  <span>{isSearching ? "Buscando..." : "Buscar"}</span>
                </Button>
              </form>

              {/* Fila 3: Selectores de Capas y Estados a 2 columnas en una sola fila */}
              <div className="grid grid-cols-2 gap-2 w-full pt-1">
                {/* Dropdown 1: Capas del Mapa */}
                <Popover open={capasOpen} onOpenChange={setCapasOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      id="btn-toggle-capas"
                      className={cn(
                        "h-10 px-3 text-xs font-semibold rounded-full transition flex items-center justify-center gap-1.5 cursor-pointer bg-white text-slate-700 shadow-none border-0 active:scale-[0.98]",
                        capasOpen && "ring-2 ring-white/50 bg-blue-50/90 text-blue-700"
                      )}
                    >
                      <Layers className="w-3.5 h-3.5 text-blue-600" />
                      <span className="truncate">Capas ({visibleLayerKinds.size})</span>
                      <ChevronDown
                        className={cn(
                          "w-3 h-3 transition-transform duration-200 shrink-0",
                          capasOpen ? "rotate-180 text-blue-600" : "text-slate-400"
                        )}
                      />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    sideOffset={8}
                    className="p-0 border-0 bg-transparent shadow-none w-auto max-w-[calc(100vw-2rem)] z-[1100]"
                  >
                    <MapLayersCard />
                  </PopoverContent>
                </Popover>

                {/* Dropdown 2: Estados del Código */}
                <Popover open={estadoOpen} onOpenChange={setEstadoOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      id="btn-toggle-estado"
                      className={cn(
                        "h-10 px-3 text-xs font-semibold rounded-full transition flex items-center justify-center gap-1.5 cursor-pointer bg-white text-slate-700 shadow-none border-0 active:scale-[0.98]",
                        estadoOpen && "ring-2 ring-white/50 bg-purple-50/90 text-purple-700"
                      )}
                    >
                      <MapPin className="w-3.5 h-3.5 text-purple-600" />
                      <span className="truncate">Estados</span>
                      <ChevronDown
                        className={cn(
                          "w-3 h-3 transition-transform duration-200 shrink-0",
                          estadoOpen ? "rotate-180 text-purple-600" : "text-slate-400"
                        )}
                      />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    sideOffset={8}
                    className="p-0 border-0 bg-transparent shadow-none w-auto max-w-[calc(100vw-2rem)] z-[1100]"
                  >
                    <MapStatusCard />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Fila 4: Opción para Ocultar Panel */}
              <div className="pt-1 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setCapasOpen(false);
                    setEstadoOpen(false);
                    setIsPanelCollapsed(true);
                  }}
                  id="btn-close-filter-panel"
                  className="text-xs font-medium text-white/90 hover:text-white py-1 px-3 transition-colors inline-flex items-center gap-1.5 cursor-pointer active:scale-95 bg-transparent border-0 shadow-none"
                  aria-label="Ocultar panel"
                >
                  <ChevronUp className="w-3.5 h-3.5 text-white/80" />
                  <span>Ocultar panel</span>
                </button>
              </div>
            </div>
          ) : (
            /* Estado Colapsado: Mostrar panel como texto simple sin aspecto de botón */
            <div className="flex justify-center pt-0.5 pb-0.5 animate-in fade-in-0 duration-200">
              <button
                type="button"
                onClick={() => setIsPanelCollapsed(false)}
                id="btn-open-filter-panel"
                className="text-xs font-medium text-white/90 hover:text-white py-1 px-3 transition-colors inline-flex items-center gap-1.5 cursor-pointer active:scale-95 bg-transparent border-0 shadow-none"
                aria-label="Mostrar panel"
              >
                <ChevronDown className="w-3.5 h-3.5 text-white/80" />
                <span>Mostrar panel</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Bottom Sheet de Resultados de Búsqueda Móvil */}
      <Sheet open={isBottomSheetOpen} onOpenChange={setIsBottomSheetOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="p-0 rounded-t-3xl max-h-[78vh] flex flex-col bg-white border-t border-slate-100 shadow-float"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Resultados de búsqueda en el mapa</SheetTitle>
            <SheetDescription>
              Lista de entidades encontradas para la consulta realizada
            </SheetDescription>
          </SheetHeader>

          {/* Drag Handle */}
          <div className="pt-2.5 pb-1 flex justify-center shrink-0">
            <div className="w-10 h-1 bg-slate-200 rounded-full" />
          </div>

          {/* Fila 1: Botón X de cerrar en círculo gris en la esquina superior derecha */}
          <div className="px-4 pb-1 flex justify-end shrink-0">
            <button
              type="button"
              onClick={() => setIsBottomSheetOpen(false)}
              className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer border-0 active:scale-95"
              aria-label="Cerrar resultados"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Fila 2: Encabezado con Contador y Resultados Encontrados de forma simple */}
          <div className="px-4 pb-3 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              {isSearching ? (
                <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-blue-600" />
              )}
              <h3 className="text-xs font-bold text-slate-800 tracking-tight font-sans">
                {isSearching
                  ? "Buscando en catálogo..."
                  : `Resultados encontrados (${results.length})`}
              </h3>
            </div>
            {query.trim() && (
              <span className="text-[11px] text-slate-400 font-medium truncate max-w-[120px]">
                &quot;{query.trim()}&quot;
              </span>
            )}
          </div>

          {/* Fila 3: Lista de Resultados Desplazable con Tarjetas Unificadas */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 max-h-[55vh] overscroll-contain bg-white">
            {results.length === 0 ? (
              <div className="py-10 px-4 text-center text-xs text-muted-foreground flex flex-col items-center gap-1.5 font-sans">
                {isSearching ? (
                  <span>Consultando base de datos espacial...</span>
                ) : !query.trim() ? (
                  <span>Escriba un término y pulse Buscar</span>
                ) : (
                  <span>No se encontraron códigos fijos para &quot;{query}&quot;</span>
                )}
              </div>
            ) : (
              results.map((item, index) => (
                <MapSearchResultCard
                  key={item.id ? `mobile-search-${item.id}` : `mobile-search-${item.code}-${index}`}
                  item={item}
                  onClick={() => {
                    handleSelectResult(item);
                    setIsBottomSheetOpen(false);
                  }}
                />
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export default MapMobileHeader;
