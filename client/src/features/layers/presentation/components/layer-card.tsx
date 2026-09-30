"use client";

import React from "react";
import { Layers, MapPin, Route, Hexagon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Layer } from "../../domain/entities/layer.entity";
import {
  formatUpdatedDate,
  GEOMETRY_LABEL_MAP,
  LAYER_COLOR_MAP,
} from "./layer-theme-helper";

export type LayerCardProps = {
  layer: Layer;
  onSelect: (layer: Layer) => void;
  isSelected?: boolean;
};

export function LayerCard({ layer, onSelect, isSelected = false }: LayerCardProps) {
  const colorConfig = LAYER_COLOR_MAP[layer.color] ?? LAYER_COLOR_MAP.BLUE;
  const geometryLabel = GEOMETRY_LABEL_MAP[layer.geometryType] ?? "Capa";

  // Ícono representativo de la geometría
  const renderGeometryIcon = () => {
    switch (layer.geometryType) {
      case "POINT":
        return <MapPin className="w-8 h-8" />;
      case "LINE":
        return <Route className="w-8 h-8" />;
      case "POLYGON":
        return <Hexagon className="w-8 h-8" />;
      default:
        return <Layers className="w-8 h-8" />;
    }
  };

  return (
    <div
      onClick={() => onSelect(layer)}
      className={cn(
        "cursor-pointer rounded-3xl border border-slate-200/80 bg-white shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col min-h-[290px] group relative select-none",
        isSelected && "ring-2 ring-blue-500 shadow-md"
      )}
      data-layer-id={layer.id}
    >
      {/* Cabecera cromática con gradiente e ícono */}
      <div
        className={cn(
          "relative h-44 sm:h-48 bg-gradient-to-b flex items-center justify-center p-6 border-b",
          colorConfig.bgGradient
        )}
      >
        <div
          className={cn(
            "w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-all duration-300",
            colorConfig.iconBox
          )}
        >
          {renderGeometryIcon()}
        </div>

        {/* Badge tipo de geometría */}
        <div className="absolute top-3 right-3">
          <span
            className={cn(
              "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/95 border shadow-xs",
              colorConfig.badge
            )}
          >
            {geometryLabel}
          </span>
        </div>
      </div>

      {/* Cuerpo de la tarjeta con nombre y fecha */}
      <div className="p-5 flex flex-col items-center justify-center text-center flex-1">
        <h3 className="text-base font-bold text-slate-800 tracking-tight group-hover:text-blue-600 transition truncate max-w-[200px]">
          {layer.name}
        </h3>
        <p className="text-[11px] text-gray-500 mt-1">
          Actualizado: {formatUpdatedDate(layer.updatedAt)}
        </p>
      </div>
    </div>
  );
}

export default LayerCard;
