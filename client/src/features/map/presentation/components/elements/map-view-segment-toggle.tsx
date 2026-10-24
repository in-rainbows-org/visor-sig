"use client";

import React, { useState } from "react";
import { ChevronDown, Layers, MapPin } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useMapView } from "../../state/map-view-store";
import { cn } from "@/lib/utils";
import { MapLayersCard } from "./map-layers-card";
import { MapStatusCard } from "./map-status-card";

export type MapViewSegmentToggleProps = {
  className?: string;
};

export function MapViewSegmentToggle({ className = "" }: MapViewSegmentToggleProps) {
  const { state } = useMapView();
  const { visibleLayerKinds } = state;

  const [layersOpen, setLayersOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  return (
    <div
      className={cn(
        "hidden lg:inline-flex items-center bg-white rounded-full p-2 shadow-md shadow-slate-900/5 border-0 select-none",
        className
      )}
      data-purpose="view-segment-toggle"
    >
      {/* 1. Botón: Capas del Mapa */}
      <Popover open={layersOpen} onOpenChange={setLayersOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "h-11 px-5 text-xs font-semibold rounded-full transition-all duration-200 inline-flex items-center gap-2 cursor-pointer border-0 active:scale-[0.98]",
              layersOpen
                ? "text-blue-600 bg-blue-50/80 ring-2 ring-blue-500/20"
                : "text-slate-700 hover:text-slate-900 hover:bg-slate-100/80"
            )}
          >
            <Layers className="w-4 h-4 text-blue-600" />
            <span>Capas ({visibleLayerKinds.size})</span>
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 transition-transform duration-200",
                layersOpen ? "rotate-180 text-blue-600" : "text-slate-400"
              )}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={8}
          className="p-0 border-0 bg-transparent shadow-none w-auto"
        >
          <MapLayersCard />
        </PopoverContent>
      </Popover>

      {/* Separador vertical sutil */}
      <div className="h-5 w-px bg-slate-200/80 mx-1 shrink-0" />

      {/* 2. Botón: Estado del Código Fijo */}
      <Popover open={statusOpen} onOpenChange={setStatusOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "h-11 px-5 text-xs font-semibold rounded-full transition-all duration-200 inline-flex items-center gap-2 cursor-pointer border-0 active:scale-[0.98]",
              statusOpen
                ? "text-purple-600 bg-purple-50/80 ring-2 ring-purple-500/20"
                : "text-slate-700 hover:text-slate-900 hover:bg-slate-100/80"
            )}
          >
            <MapPin className="w-4 h-4 text-purple-600" />
            <span>Estado Código Fijo</span>
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 transition-transform duration-200",
                statusOpen ? "rotate-180 text-purple-600" : "text-slate-400"
              )}
            />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={8}
          className="p-0 border-0 bg-transparent shadow-none w-auto"
        >
          <MapStatusCard />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export default MapViewSegmentToggle;
