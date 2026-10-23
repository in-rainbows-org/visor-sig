"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Layer } from "../../../domain/entities/layer.entity";
import {
  formatUpdatedDate,
  GEOMETRY_LABEL_MAP,
  getLayerDashboardAsset,
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
  const imageSrc = getLayerDashboardAsset(layer.kind, layer.name);

  return (
    <div
      onClick={() => onSelect(layer)}
      className={cn(
        "cursor-pointer rounded-[28px] sm:rounded-[32px] p-5 sm:p-6 transition-all duration-200 overflow-hidden flex flex-col justify-between group relative select-none bg-gradient-to-br min-h-[220px] sm:min-h-[240px] lg:min-h-[260px] border-0 shadow-none hover:scale-[1.02] active:scale-[0.98]",
        colorConfig.bgGradient,
        isSelected && "ring-4 ring-white/90 ring-offset-2 ring-offset-blue-600"
      )}
      data-layer-id={layer.id}
    >
      {/* Esquina superior derecha: Badge de Geometría estilo degree */}
      <div className="w-full flex justify-end">
        <span
          className={cn(
            "text-[11px] font-bold px-3 py-1 rounded-full shadow-2xs backdrop-blur-xs transition-colors",
            colorConfig.cardBadge
          )}
        >
          {geometryLabel}
        </span>
      </div>

      {/* Imagen centrada de la capa */}
      <div className="my-2 sm:my-3 flex items-center justify-center">
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 transition-transform duration-300 group-hover:scale-105">
          <Image
            src={imageSrc}
            alt={layer.name}
            fill
            sizes="(max-width: 640px) 96px, 112px"
            className="object-contain drop-shadow-[0_6px_16px_rgba(0,0,0,0.14)]"
          />
        </div>
      </div>

      {/* Información de la capa (Nombre y Fecha de actualización en blanco) */}
      <div className="w-full text-center space-y-1">
        <h3 className="font-bold text-white text-base sm:text-lg lg:text-xl tracking-tight truncate">
          {layer.name}
        </h3>
        <div className="text-xs text-white/80 font-sans flex flex-col items-center justify-center leading-tight">
          <span>Actualizado</span>
          <span className="font-semibold text-white/95 mt-0.5">
            {formatUpdatedDate(layer.updatedAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default LayerCard;
