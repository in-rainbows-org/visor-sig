"use client";

import React, { useState } from "react";
import { ChevronDown, Layers, MapPin } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useMapView } from "../../state/map-view-store";
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
      className={`bg-gray-100/90 backdrop-blur-md p-1 rounded-xl shadow-xs hidden lg:inline-flex w-fit border border-white/60 select-none gap-1 ${className}`}
      data-purpose="view-segment-toggle"
    >
      {/* 1. Dropdown: Capas del Mapa */}
      <Popover open={layersOpen} onOpenChange={setLayersOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer ${
              layersOpen
                ? "text-blue-600 bg-white shadow-xs"
                : "text-gray-700 hover:text-gray-900 hover:bg-white/50"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Capas ({visibleLayerKinds.size})</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                layersOpen ? "rotate-180 text-blue-600" : "text-gray-400"
              }`}
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

      {/* 2. Dropdown: Estado del Código Fijo */}
      <Popover open={statusOpen} onOpenChange={setStatusOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition inline-flex items-center gap-1.5 cursor-pointer ${
              statusOpen
                ? "text-blue-600 bg-white shadow-xs"
                : "text-gray-700 hover:text-gray-900 hover:bg-white/50"
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-purple-600" />
            <span>Estado Código Fijo</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                statusOpen ? "rotate-180 text-blue-600" : "text-gray-400"
              }`}
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
