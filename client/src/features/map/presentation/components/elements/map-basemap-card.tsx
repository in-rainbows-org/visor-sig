"use client";

import React from "react";
import { Check, Mountain, Map as MapIcon, Globe, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BASEMAP_PROVIDERS,
  type BasemapProviderId,
} from "../../../domain/entities/basemap.entity";
import { useMapView } from "../../state/map-view-store";

export type MapBasemapCardProps = {
  className?: string;
  onSelectOption?: (id: BasemapProviderId) => void;
};

interface BasemapOptionUI {
  id: BasemapProviderId;
  name: string;
  icon: React.ReactNode;
}

const BASEMAP_OPTIONS: BasemapOptionUI[] = [
  {
    id: "osm",
    name: BASEMAP_PROVIDERS.osm.name,
    icon: <MapIcon className="w-4 h-4 text-blue-600" />,
  },
  {
    id: "opentopo",
    name: BASEMAP_PROVIDERS.opentopo.name,
    icon: <Mountain className="w-4 h-4 text-emerald-600" />,
  },
  {
    id: "satellite",
    name: BASEMAP_PROVIDERS.satellite.name,
    icon: <Globe className="w-4 h-4 text-amber-600" />,
  },
];

export function MapBasemapCard({
  className = "",
  onSelectOption,
}: MapBasemapCardProps) {
  const { state, setBasemapProvider } = useMapView();
  const { activeBasemapId, isBasemapVisible } = state;

  const handleSelect = (id: BasemapProviderId) => {
    setBasemapProvider(id);
    if (onSelectOption) {
      onSelectOption(id);
    }
  };

  const isNoneActive = !isBasemapVisible || activeBasemapId === "none";

  return (
    <div
      className={cn(
        "bg-white w-52 max-w-[calc(100vw-5rem)] rounded-2xl sm:rounded-3xl p-3.5 shadow-xl shadow-slate-900/10 border-0 select-none",
        className
      )}
      data-purpose="map-basemap-card"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2 border-b border-gray-100/80 pb-2">
        <h3 className="text-xs font-bold text-gray-800">Fondo Cartográfico</h3>
      </div>

      {/* Map Providers */}
      <div className="space-y-1">
        {BASEMAP_OPTIONS.map((item) => {
          const isSelected = !isNoneActive && activeBasemapId === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              className={cn(
                "w-full flex items-center justify-between py-2 px-2.5 rounded-xl transition cursor-pointer text-left group",
                isSelected
                  ? "bg-blue-50/80 text-blue-700 font-semibold"
                  : "text-slate-700 hover:bg-slate-50/80"
              )}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <span className="text-xs">{item.name}</span>
              </div>

              {isSelected && (
                <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-2" />
              )}
            </button>
          );
        })}
      </div>

      {/* Separator */}
      <div className="my-1.5 border-t border-slate-100" />

      {/* Hide Basemap Option */}
      <button
        type="button"
        onClick={() => handleSelect("none")}
        className={cn(
          "w-full flex items-center justify-between py-2 px-2.5 rounded-xl transition cursor-pointer text-left group",
          isNoneActive
            ? "bg-slate-100 text-slate-800 font-semibold"
            : "text-slate-600 hover:bg-slate-50/80"
        )}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 flex items-center justify-center shrink-0">
            <EyeOff className="w-4 h-4 text-slate-500" />
          </div>
          <span className="text-xs">Ocultar mapa</span>
        </div>

        {isNoneActive && (
          <Check className="w-3.5 h-3.5 text-slate-700 shrink-0 ml-2" />
        )}
      </button>
    </div>
  );
}
