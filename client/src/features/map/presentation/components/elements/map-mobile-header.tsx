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
import { useMapSearch } from "../../hooks/use-map-search";
import type { HighlightedMapEntity } from "@/features/map/domain/entities/highlighted-entity.entity";

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
        className={`w-full z-30 select-none flex flex-col ${className}`}
        data-purpose="map-mobile-header"
      >
        <div className="bg-white/95 backdrop-blur-md shadow-float border-b border-gray-200/80 rounded-b-2xl w-full px-4 pt-2 pb-2 transition-all duration-300 pointer-events-auto touch-none overscroll-none">
          {/* 1. Contenido Colapsable del Panel */}
          <div
            className={`transition-all duration-300 ease-in-out flex flex-col gap-2.5 overflow-hidden ${
              isPanelCollapsed
                ? "max-h-0 opacity-0 pointer-events-none"
                : "max-h-[850px] opacity-100 pt-1"
            }`}
          >
            {/* 1.1 Campo de Búsqueda Integrado: Fila 1 (Input + Select), Fila 2 (Botón Buscar) */}
            <form onSubmit={handleSearchSubmit} className="flex flex-col gap-2">
              <div className="flex items-center gap-2 w-full">
                {/* Input más largo */}
                <div className="flex-1 min-w-0 flex items-center gap-2 bg-slate-50/90 rounded-xl border border-slate-200/80 px-3 h-10 shadow-2xs">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    id="gis-mobile-search-input"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={
                      filterType === "codigo"
                        ? "Buscar código..."
                        : "Buscar por titular..."
                    }
                    className="border-0 bg-transparent text-xs text-foreground focus:ring-0 placeholder-muted-foreground flex-1 min-w-0 p-0 outline-none font-sans"
                  />

                  {query && (
                    <button
                      type="button"
                      id="mobile-clear-search-btn"
                      onClick={handleClear}
                      aria-label="Limpiar búsqueda"
                      className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Select en la misma fila */}
                <Select
                  value={filterType}
                  onValueChange={(val) =>
                    handleFilterTypeChange(val as "codigo" | "nombre")
                  }
                >
                  <SelectTrigger className="h-10 w-[130px] rounded-xl bg-slate-50/90 border-slate-200/80 text-xs font-medium font-sans shrink-0">
                    <SelectValue placeholder="Parámetro" />
                  </SelectTrigger>
                  <SelectContent className="z-[2000] font-sans text-xs">
                    <SelectItem value="codigo">Código Fijo</SelectItem>
                    <SelectItem value="nombre">Nombre / Titular</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Botón Buscar a Ancho Completo */}
              <Button
                type="submit"
                id="mobile-buscar-button"
                disabled={isSearching}
                className="w-full h-10 rounded-xl bg-app-primary hover:bg-app-primary/90 text-app-primary-foreground text-xs font-semibold font-sans shadow-xs cursor-pointer"
              >
                {isSearching ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Search className="w-3.5 h-3.5 mr-1.5" />
                )}
                <span>{isSearching ? "Buscando..." : "Buscar"}</span>
              </Button>
            </form>

            {/* 1.3 Fila de Filtros con Popovers (Capas y Estados - Fondo eliminado) */}
            <div className="pt-1 border-t border-gray-100 flex items-center justify-between gap-2 relative">
              <div className="bg-gray-100/90 p-1 shadow-xs inline-flex items-center border border-gray-200/80 rounded-full w-full justify-between">
                {/* Dropdown 1: Capas del Mapa */}
                <Popover open={capasOpen} onOpenChange={setCapasOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      id="btn-toggle-capas"
                      className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-full transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        capasOpen
                          ? "text-blue-600 bg-white shadow-xs font-semibold"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5 text-blue-600" />
                      <span>Capas ({visibleLayerKinds.size})</span>
                      <ChevronDown
                        className={`w-3 h-3 transition-transform duration-200 ${
                          capasOpen ? "rotate-180 text-blue-600" : "text-gray-400"
                        }`}
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

                <div className="h-3.5 w-px bg-gray-300" />

                {/* Dropdown 2: Estados del Código */}
                <Popover open={estadoOpen} onOpenChange={setEstadoOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      id="btn-toggle-estado"
                      className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-full transition flex items-center justify-center gap-1.5 cursor-pointer ${
                        estadoOpen
                          ? "text-blue-600 bg-white shadow-xs font-semibold"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5 text-purple-600" />
                      <span>Estados</span>
                      <ChevronDown
                        className={`w-3 h-3 transition-transform duration-200 ${
                          estadoOpen ? "rotate-180 text-blue-600" : "text-gray-400"
                        }`}
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
            </div>

            {/* 1.4 Botón para Ocultar Panel */}
            <div className="pt-0.5 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setCapasOpen(false);
                  setEstadoOpen(false);
                  setIsPanelCollapsed(true);
                }}
                id="btn-close-filter-panel"
                className="text-[11px] font-medium text-gray-500 hover:text-blue-600 py-1 px-3 rounded-full hover:bg-gray-100/80 transition inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
                aria-label="Ocultar panel"
              >
                <ChevronUp className="w-3 h-3 text-gray-500" />
                <span>Ocultar panel</span>
              </button>
            </div>
          </div>

          {/* 2. Barra Compacta cuando el panel está Oculto / Colapsado */}
          {isPanelCollapsed && (
            <div className="py-1 flex justify-center items-center animate-in fade-in-0 duration-200">
              <button
                type="button"
                onClick={() => setIsPanelCollapsed(false)}
                id="btn-open-filter-panel"
                className="text-[11px] font-medium text-gray-500 hover:text-blue-600 py-0.5 px-3 rounded-full hover:bg-gray-100/80 transition inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
                aria-label="Mostrar panel"
              >
                <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
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
          showCloseButton={true}
          className="p-0 rounded-t-3xl max-h-[78vh] flex flex-col bg-white border-t border-gray-200/80 shadow-float"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Resultados de búsqueda en el mapa</SheetTitle>
            <SheetDescription>
              Lista de entidades encontradas para la consulta realizada
            </SheetDescription>
          </SheetHeader>

          {/* Drag Handle */}
          <div className="pt-3 pb-1 flex justify-center shrink-0">
            <div className="w-12 h-1 bg-gray-300 rounded-full" />
          </div>

          {/* Encabezado con Contador */}
          <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between shrink-0 pr-12">
            <div className="flex items-center gap-2">
              {isSearching ? (
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              ) : (
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              )}
              <h3 className="text-xs font-bold text-gray-900 tracking-tight">
                {isSearching
                  ? "Buscando en catálogo..."
                  : `Resultados encontrados (${results.length})`}
              </h3>
            </div>
            {query.trim() && (
              <span className="text-[10px] text-gray-400 font-medium truncate max-w-[100px]">
                &quot;{query.trim()}&quot;
              </span>
            )}
          </div>

          {/* Lista de Resultados Desplazable */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-[55vh] overscroll-contain">
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
                <div
                  key={item.id ? `mobile-search-${item.id}` : `mobile-search-${item.code}-${index}`}
                  onClick={() => {
                    handleSelectResult(item);
                    setIsBottomSheetOpen(false);
                  }}
                  className="p-3.5 hover:bg-slate-50 active:bg-slate-100 cursor-pointer transition flex flex-col gap-2.5 rounded-2xl border border-slate-200/80 bg-card shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="p-1.5 rounded-xl bg-blue-50 text-blue-600 shrink-0">
                        <Hash className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-label block">
                          {item.label || "Código Fijo"}
                        </span>
                        <h4 className="text-sm font-bold text-foreground font-headline truncate">
                          {item.fixedCode ? `#${item.fixedCode}` : item.code}
                        </h4>
                      </div>
                    </div>

                    <span
                      className={`text-xs font-medium font-label px-2.5 py-0.5 rounded-full border shrink-0 ${item.tagColor}`}
                    >
                      {item.actionTag}
                    </span>
                  </div>

                  <div className="rounded-xl bg-muted/40 p-2.5 space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 text-slate-700">
                      <User className="size-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium truncate font-sans">
                        {item.name || "Sin titular registrado"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground pt-1 border-t border-border/50">
                      <span className="font-label text-xs">Lote asociado:</span>
                      <span className="font-semibold text-foreground font-mono">
                        {item.lotNumber || "No asignado"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

export default MapMobileHeader;
