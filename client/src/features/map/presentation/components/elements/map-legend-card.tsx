"use client";

import React, { useState } from "react";
import { Info, Map as MapIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ALL_FIXED_CODE_STATUS_VALUES, FIXED_CODE_STATUSES } from "../../../domain/models/fixed-code-status.types";
import { useMapView } from "../../state/map-view-store";

export type MapLegendControlsProps = {
  className?: string;
};

export function MapLegendCard({ className = "" }: MapLegendControlsProps) {
  const { state, toggleBasemap } = useMapView();
  const { isBasemapVisible } = state;

  const [legendOpenMobile, setLegendOpenMobile] = useState(false);
  const [legendOpenDesktop, setLegendOpenDesktop] = useState(false);

  const legendCardContent = (
    <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-float border border-gray-100/90 w-52">
      <div className="flex items-center justify-between mb-3 border-b border-gray-100/80 pb-2">
        <h4 className="text-xs font-bold text-gray-800 tracking-wide">
          Simbología Códigos Fijos
        </h4>
        <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
      </div>

      <div className="space-y-2 text-xs font-medium text-gray-700">
        {ALL_FIXED_CODE_STATUS_VALUES.map((statusVal) => {
          const item = FIXED_CODE_STATUSES[statusVal];
          return (
            <div
              key={item.value}
              className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-slate-50 transition"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-4 h-4 rounded-full ${item.pinBgClass} border border-white shadow-2xs flex items-center justify-center shrink-0`}
                >
                  <span className="w-1 h-1 rounded-full bg-white" />
                </div>
                <span className="text-xs font-medium text-slate-700">
                  {item.label}
                </span>
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded border font-semibold ${item.badgeBgClass}`}>
                {item.badgeLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Versión Móvil y Tablet (< 1024px): Botón circular flotante de leyenda */}
      <div
        className={`absolute bottom-20 right-4 md:right-6 z-[1000] flex flex-col items-end gap-2 select-none lg:hidden ${className}`}
        data-purpose="mobile-gis-controls"
      >
        <Popover open={legendOpenMobile} onOpenChange={setLegendOpenMobile}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Abrir leyendas del mapa"
              title="Leyendas del mapa"
              className={`w-10 h-10 bg-white/95 backdrop-blur-md rounded-full shadow-lg border border-gray-200/80 flex items-center justify-center transition active:scale-95 cursor-pointer ${
                legendOpenMobile
                  ? "text-blue-600 bg-blue-50 ring-2 ring-blue-500/20"
                  : "text-blue-600 hover:text-blue-700 hover:bg-white"
              }`}
            >
              <Info className="w-5 h-5" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="end"
            sideOffset={12}
            className="p-0 border-0 bg-transparent shadow-none w-auto"
          >
            {legendCardContent}
          </PopoverContent>
        </Popover>
      </div>

      {/* 2. Versión Escritorio (>= 1024px): Botón de fondo cartográfico y botón de leyendas */}
      <div
        className={`hidden lg:flex absolute bottom-24 right-4 z-[1000] flex-col items-end gap-2 select-none ${className}`}
        data-purpose="desktop-gis-controls"
      >
        <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-float border border-gray-100 flex flex-col items-center overflow-hidden w-9">
          {/* Botón Alternar Fondo Cartográfico */}
          <button
            type="button"
            onClick={toggleBasemap}
            aria-label={isBasemapVisible ? "Ocultar fondo cartográfico" : "Mostrar fondo cartográfico"}
            title={isBasemapVisible ? "Ocultar fondo cartográfico" : "Mostrar fondo cartográfico"}
            className={`w-9 h-9 flex items-center justify-center transition border-b border-gray-100 cursor-pointer ${
              isBasemapVisible
                ? "text-blue-600 bg-blue-50/70 hover:bg-blue-100/70"
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
            }`}
          >
            <MapIcon className="w-4 h-4" />
          </button>

          {/* Botón Dropdown Leyendas */}
          <Popover open={legendOpenDesktop} onOpenChange={setLegendOpenDesktop}>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Abrir leyendas del mapa"
                title="Leyendas del mapa"
                className={`w-9 h-9 flex items-center justify-center transition cursor-pointer ${
                  legendOpenDesktop
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                }`}
              >
                <Info className="w-4 h-4" />
              </button>
            </PopoverTrigger>
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
      </div>
    </>
  );
}

export default MapLegendCard;
