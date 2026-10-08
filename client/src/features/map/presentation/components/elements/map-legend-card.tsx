"use client";

import React, { useState } from "react";
import { Info, Map as MapIcon, Plus, Minus } from "lucide-react";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ALL_FIXED_CODE_STATUS_VALUES,
  FIXED_CODE_STATUSES,
} from "../../../domain/entities/fixed-code-status.entity";
import { FIXED_CODE_THEME_MAP } from "./fixed-code-theme-helper";
import { useMapView } from "../../state/map-view-store";

export type MapLegendControlsProps = {
  className?: string;
};

export function MapLegendCard({ className = "" }: MapLegendControlsProps) {
  const { state, toggleBasemap, zoomIn, zoomOut } = useMapView();
  const { isBasemapVisible } = state;

  const [legendOpen, setLegendOpen] = useState(false);

  const legendCardContent = (
    <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-float border border-gray-100/90 w-48">
      <div className="mb-3 border-b border-gray-100/80 pb-2">
        <h4 className="text-xs font-bold text-gray-800 tracking-wide">
          Simbología Códigos Fijos
        </h4>
      </div>

      <div className="space-y-2 text-xs font-medium text-gray-700">
        {ALL_FIXED_CODE_STATUS_VALUES.map((statusVal) => {
          const item = FIXED_CODE_STATUSES[statusVal];
          const theme = FIXED_CODE_THEME_MAP[statusVal];
          return (
            <div
              key={item.value}
              className="flex items-center gap-2.5 py-1 px-1.5 rounded hover:bg-slate-50 transition"
            >
              <div
                className={`w-4 h-4 rounded-full ${theme.pinBgClass} border border-white shadow-2xs flex items-center justify-center shrink-0`}
              >
                <span className="w-1 h-1 rounded-full bg-white" />
              </div>
              <span className="text-xs font-medium text-slate-700">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div
      className={`absolute bottom-24 right-3 sm:right-4 md:right-6 lg:bottom-6 lg:right-4 z-[1000] flex flex-col items-end gap-2 select-none ${className}`}
      data-purpose="gis-map-controls"
    >
      <Popover open={legendOpen} onOpenChange={setLegendOpen}>
        <PopoverAnchor asChild>
          <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-float border border-gray-100/90 flex flex-col items-center overflow-hidden w-9">
            {/* 1. Botón Alternar Fondo Cartográfico */}
            <button
              type="button"
              onClick={toggleBasemap}
              aria-label={isBasemapVisible ? "Ocultar fondo cartográfico" : "Mostrar fondo cartográfico"}
              title={isBasemapVisible ? "Ocultar fondo cartográfico" : "Mostrar fondo cartográfico"}
              className={`w-9 h-9 flex items-center justify-center transition border-b border-gray-100 cursor-pointer ${
                isBasemapVisible
                  ? "text-blue-600 bg-blue-50/70 hover:bg-blue-100/70 active:bg-blue-100"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-50 active:bg-gray-100"
              }`}
            >
              <MapIcon className="w-4 h-4" />
            </button>

            {/* 2. Botón Dropdown Leyendas */}
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Abrir leyendas del mapa"
                title="Leyendas del mapa"
                className={`w-9 h-9 flex items-center justify-center transition border-b border-gray-100 cursor-pointer ${
                  legendOpen
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-700 hover:text-blue-600 hover:bg-gray-50 active:bg-gray-100"
                }`}
              >
                <Info className="w-4 h-4" />
              </button>
            </PopoverTrigger>

            {/* 3. Botón Zoom In (Acercar) */}
            <button
              type="button"
              onClick={zoomIn}
              aria-label="Acercar mapa"
              title="Acercar mapa"
              className="w-9 h-9 flex items-center justify-center transition border-b border-gray-100 text-gray-700 hover:text-blue-600 hover:bg-gray-50 active:bg-blue-50 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>

            {/* 4. Botón Zoom Out (Alejar) */}
            <button
              type="button"
              onClick={zoomOut}
              aria-label="Alejar mapa"
              title="Alejar mapa"
              className="w-9 h-9 flex items-center justify-center transition text-gray-700 hover:text-blue-600 hover:bg-gray-50 active:bg-blue-50 cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
          </div>
        </PopoverAnchor>

        <PopoverContent
          side="left"
          align="end"
          sideOffset={10}
          className="p-0 border-0 bg-transparent shadow-none w-auto"
        >
          {legendCardContent}
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default MapLegendCard;

