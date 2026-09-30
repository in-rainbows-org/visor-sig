"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Layers, MapPin, Map as MapIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useMapView } from "../../state/map-view-store";
import { MapLayersCard } from "./map-layers-card";
import { MapStatusCard } from "./map-status-card";

export type MapMobileHeaderProps = {
  className?: string;
};

export function MapMobileHeader({ className = "" }: MapMobileHeaderProps) {
  const { state, toggleBasemap } = useMapView();
  const { visibleLayerKinds, isBasemapVisible } = state;

  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [capasOpen, setCapasOpen] = useState(false);
  const [estadoOpen, setEstadoOpen] = useState(false);

  return (
    <div
      className={`w-full bg-white border-b border-gray-200/80 shadow-sm relative z-30 rounded-b-[24px] flex flex-col lg:hidden select-none transition-all duration-300 ${className}`}
      data-purpose="map-mobile-header"
    >
      {/* 1. Contenido Colapsable del Panel */}
      <div
        className={`transition-all duration-300 ease-in-out flex flex-col ${
          isPanelCollapsed
            ? "max-h-0 opacity-0 overflow-hidden pointer-events-none"
            : "max-h-[850px] opacity-100"
        }`}
      >
        {/* Barra Segmentada con Conmutadores de Capas, Estados y Fondo */}
        <div
          className="bg-white px-3.5 py-2 flex items-center justify-center relative gap-2"
          data-purpose="sub-header-bar"
        >
          <div className="bg-gray-100/90 p-1 rounded-xl shadow-xs inline-flex w-fit border border-gray-200/80 gap-1">
            {/* Dropdown 1: Capas del Mapa */}
            <Popover open={capasOpen} onOpenChange={setCapasOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer ${
                    capasOpen
                      ? "text-blue-600 bg-white shadow-xs"
                      : "text-gray-700 hover:text-gray-900 hover:bg-white/50"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>Capas ({visibleLayerKinds.size})</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      capasOpen ? "rotate-180 text-blue-600" : "text-gray-400"
                    }`}
                  />
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="center"
                sideOffset={14}
                className="p-0 border-0 bg-transparent shadow-none w-auto max-w-[calc(100vw-2rem)]"
              >
                <MapLayersCard />
              </PopoverContent>
            </Popover>

            {/* Dropdown 2: Estado del Código Fijo */}
            <Popover open={estadoOpen} onOpenChange={setEstadoOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer ${
                    estadoOpen
                      ? "text-blue-600 bg-white shadow-xs"
                      : "text-gray-700 hover:text-gray-900 hover:bg-white/50"
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 text-purple-600" />
                  <span>Estados</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      estadoOpen ? "rotate-180 text-blue-600" : "text-gray-400"
                    }`}
                  />
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="center"
                sideOffset={14}
                className="p-0 border-0 bg-transparent shadow-none w-auto max-w-[calc(100vw-2rem)]"
              >
                <MapStatusCard />
              </PopoverContent>
            </Popover>

            {/* Botón 3: Alternar Fondo Cartográfico */}
            <button
              type="button"
              onClick={toggleBasemap}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition inline-flex items-center gap-1 cursor-pointer ${
                isBasemapVisible
                  ? "text-blue-700 bg-blue-50/80 border border-blue-200/60"
                  : "text-gray-500 bg-white/70 hover:bg-white border border-transparent"
              }`}
              title={isBasemapVisible ? "Ocultar fondo cartográfico" : "Mostrar fondo cartográfico"}
              aria-label={isBasemapVisible ? "Ocultar fondo cartográfico" : "Mostrar fondo cartográfico"}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Fondo</span>
            </button>
          </div>
        </div>

        {/* Botón para Ocultar Panel */}
        <div className="pt-0.5 pb-1 flex justify-center border-t border-gray-100/80 bg-white rounded-b-[24px]">
          <button
            type="button"
            onClick={() => {
              setCapasOpen(false);
              setEstadoOpen(false);
              setIsPanelCollapsed(true);
            }}
            className="text-[11px] font-medium text-gray-500 hover:text-blue-600 py-0.5 px-3 rounded-full hover:bg-gray-100/80 transition inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
            aria-label="Ocultar panel"
          >
            <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
            <span>Ocultar panel</span>
          </button>
        </div>
      </div>

      {/* Barra Compacta cuando el panel está Oculto / Colapsado */}
      {isPanelCollapsed && (
        <div className="py-1 px-3 flex justify-center items-center bg-white rounded-b-[24px] animate-in fade-in-0 duration-200">
          <button
            type="button"
            onClick={() => setIsPanelCollapsed(false)}
            className="text-[11px] font-medium text-gray-500 hover:text-blue-600 py-0.5 px-3 rounded-full hover:bg-gray-100/80 transition inline-flex items-center gap-1.5 cursor-pointer active:scale-95"
            aria-label="Mostrar panel"
          >
            <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
            <span>Mostrar panel</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default MapMobileHeader;
