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

import { cn } from "@/lib/utils";

export type MapLegendControlsProps = {
  className?: string;
};

export function MapLegendCard({ className = "" }: MapLegendControlsProps) {
  const { state, toggleBasemap, zoomIn, zoomOut } = useMapView();
  const { isBasemapVisible } = state;

  const [legendOpen, setLegendOpen] = useState(false);

  const legendCardContent = (
    <div className="bg-white rounded-2xl sm:rounded-3xl p-4 shadow-xl shadow-slate-900/10 border-0 w-52 select-none">
      <div className="mb-3 border-b border-slate-100 pb-2">
        <h4 className="text-xs font-bold text-slate-800 tracking-wide">
          Simbología Códigos Fijos
        </h4>
      </div>

      <div className="space-y-2 text-xs font-medium text-slate-700">
        {ALL_FIXED_CODE_STATUS_VALUES.map((statusVal) => {
          const item = FIXED_CODE_STATUSES[statusVal];
          const theme = FIXED_CODE_THEME_MAP[statusVal];
          return (
            <div
              key={item.value}
              className="flex items-center gap-2.5 py-1.5 px-2 rounded-xl hover:bg-slate-50 transition"
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
      className={cn(
        "absolute bottom-28 right-3 sm:right-4 md:right-6 lg:bottom-6 lg:right-6 z-[1000] flex flex-col items-end gap-2.5 select-none touch-none",
        className
      )}
      data-purpose="gis-map-controls"
    >
      {/* 1. Isla Superior: Herramientas del Mapa (Fondo Cartográfico y Leyenda) */}
      <Popover open={legendOpen} onOpenChange={setLegendOpen}>
        <div className="bg-white rounded-2xl shadow-md shadow-slate-900/5 border-0 flex flex-col items-center overflow-hidden w-10 divide-y divide-slate-100">
          {/* Botón Alternar Fondo Cartográfico */}
          <button
            type="button"
            onClick={toggleBasemap}
            aria-label={isBasemapVisible ? "Ocultar fondo cartográfico" : "Mostrar fondo cartográfico"}
            title={isBasemapVisible ? "Ocultar fondo cartográfico" : "Mostrar fondo cartográfico"}
            className={cn(
              "w-10 h-10 flex items-center justify-center transition cursor-pointer active:scale-95",
              isBasemapVisible
                ? "text-blue-600 bg-blue-50/80 hover:bg-blue-100/80"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            )}
          >
            <MapIcon className="w-4 h-4" />
          </button>

          {/* Botón Dropdown Leyendas con PopoverTrigger */}
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Abrir leyendas del mapa"
              title="Leyendas del mapa"
              className={cn(
                "w-10 h-10 flex items-center justify-center transition cursor-pointer active:scale-95",
                legendOpen
                  ? "text-blue-600 bg-blue-50/80"
                  : "text-slate-600 hover:text-blue-600 hover:bg-slate-50"
              )}
            >
              <Info className="w-4 h-4" />
            </button>
          </PopoverTrigger>
        </div>

        <PopoverContent
          side="left"
          align="center"
          sideOffset={12}
          className="p-0 border-0 bg-transparent shadow-none w-auto"
        >
          {legendCardContent}
        </PopoverContent>
      </Popover>

      {/* 2. Isla Inferior: Controles de Zoom (+ y -) */}
      <div className="bg-white rounded-2xl shadow-md shadow-slate-900/5 border-0 flex flex-col items-center overflow-hidden w-10 divide-y divide-slate-100">
        <button
          type="button"
          onClick={zoomIn}
          aria-label="Acercar mapa"
          title="Acercar mapa"
          className="w-10 h-10 flex items-center justify-center transition text-slate-600 hover:text-blue-600 hover:bg-slate-50 active:bg-blue-50 active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={zoomOut}
          aria-label="Alejar mapa"
          title="Alejar mapa"
          className="w-10 h-10 flex items-center justify-center transition text-slate-600 hover:text-blue-600 hover:bg-slate-50 active:bg-blue-50 active:scale-95 cursor-pointer"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default MapLegendCard;

