"use client";

import React from "react";
import { Eye, EyeOff, Layers, Route, Hexagon, MapPin } from "lucide-react";
import type { LayerKind } from "../../../domain/models/map.types";
import { useMapView } from "../../state/map-view-store";

export type LayerConfigItem = {
  kind: LayerKind;
  name: string;
  defaultColor: string;
  icon: React.ReactNode;
};

const LAYER_CONFIGS: LayerConfigItem[] = [
  {
    kind: "VIAS",
    name: "Vías",
    defaultColor: "#2563eb",
    icon: <Route className="w-3.5 h-3.5 text-blue-600" />,
  },
  {
    kind: "MANZANAS",
    name: "Manzanas",
    defaultColor: "#ea580c",
    icon: <Hexagon className="w-3.5 h-3.5 text-orange-600" />,
  },
  {
    kind: "LOTES",
    name: "Lotes",
    defaultColor: "#059669",
    icon: <Layers className="w-3.5 h-3.5 text-emerald-600" />,
  },
  {
    kind: "CODIGOS_FIJOS",
    name: "Códigos Fijos",
    defaultColor: "#7c3aed",
    icon: <MapPin className="w-3.5 h-3.5 text-purple-600" />,
  },
];

export type MapLayersCardProps = {
  className?: string;
};

export function MapLayersCard({ className = "" }: MapLayersCardProps) {
  const { state, toggleLayer } = useMapView();
  const { visibleLayerKinds, layerLoads } = state;

  return (
    <div
      className={`bg-white/95 backdrop-blur-md w-72 max-w-[calc(100vw-5rem)] rounded-2xl p-4 shadow-float border border-gray-100 select-none ${className}`}
      data-purpose="map-layers-card"
    >
      <div className="flex items-center justify-between mb-3 border-b border-gray-100/80 pb-2">
        <h3 className="text-xs font-bold text-gray-800">Capas del mapa</h3>
        <span className="text-[10px] text-gray-400 font-medium">
          {visibleLayerKinds.size}/{LAYER_CONFIGS.length} activas
        </span>
      </div>

      <div className="space-y-1">
        {LAYER_CONFIGS.map((layer) => {
          const isVisible = visibleLayerKinds.has(layer.kind);
          const loadState = layerLoads[layer.kind];

          return (
            <div
              key={layer.kind}
              onClick={() => toggleLayer(layer.kind)}
              className="flex items-center justify-between py-1.5 hover:bg-gray-50/80 px-2 rounded-lg transition cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  aria-label={`Alternar capa ${layer.name}`}
                  className="transition cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleLayer(layer.kind);
                  }}
                >
                  {isVisible ? (
                    <Eye className="w-4 h-4 text-blue-500 hover:text-blue-600" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-300 hover:text-gray-500" />
                  )}
                </button>

                <div className="w-6 h-6 rounded-md bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                  {layer.icon}
                </div>

                <div className="flex flex-col">
                  <span
                    className={`text-xs font-medium transition ${
                      isVisible
                        ? "text-gray-800 group-hover:text-gray-900"
                        : "text-gray-400 line-through"
                    }`}
                  >
                    {layer.name}
                  </span>
                  {isVisible && loadState && loadState.loadStatus === "ZOOM_REQUIRED" && (
                    <span className="text-[9px] text-amber-600 font-medium">
                      Acerca el mapa (zoom ≥ {loadState.minZoom})
                    </span>
                  )}
                  {isVisible && loadState && loadState.loadStatus === "FEATURE_LIMIT_REACHED" && (
                    <span className="text-[9px] text-amber-600 font-medium">
                      Área muy grande para mostrar
                    </span>
                  )}
                  {isVisible && loadState && loadState.loadStatus === "NO_ACTIVE_VERSION" && (
                    <span className="text-[9px] text-slate-400 font-medium">
                      Sin datos activos
                    </span>
                  )}
                </div>
              </div>

              <span
                className="w-2.5 h-2.5 rounded-full transition-opacity"
                style={{
                  backgroundColor: isVisible ? layer.defaultColor : "#cbd5e1",
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MapLayersCard;
