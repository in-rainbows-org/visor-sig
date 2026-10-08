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
        "cursor-pointer rounded-3xl border border-slate-200/70 bg-white p-4 sm:p-5 lg:p-6 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col justify-between group relative select-none bg-gradient-to-b min-h-[220px] sm:min-h-[240px] lg:min-h-[260px]",
        colorConfig.bgGradient,
        colorConfig.cardBg,
        isSelected && "ring-2 ring-blue-500 shadow-md"
      )}
      data-layer-id={layer.id}
    >
      {/* Esquina superior derecha: Badge de Geometría */}
      <div className="w-full flex justify-end">
        <span
          className={cn(
            "text-[11px] font-semibold px-2.5 py-0.5 rounded-full border shadow-2xs transition-colors",
            colorConfig.badge
          )}
        >
          {geometryLabel}
        </span>
      </div>

      {/* Imagen centrada de la capa */}
      <div className="my-3 flex items-center justify-center">
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 transition-transform duration-300 group-hover:scale-105">
          <Image
            src={imageSrc}
            alt={layer.name}
            fill
            sizes="(max-width: 640px) 96px, 112px"
            className="object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
          />
        </div>
      </div>

      {/* Información de la capa (Nombre y Fecha de actualización) */}
      <div className="w-full text-center space-y-1">
        <h3 className="font-bold text-slate-900 text-sm sm:text-base tracking-tight truncate group-hover:text-blue-600 transition-colors">
          {layer.name}
        </h3>
        <div className="text-xs text-slate-500 font-sans flex flex-col lg:flex-row items-center justify-center lg:gap-1">
          <span>
            Actualizado<span className="hidden lg:inline">:</span>
          </span>
          <span className="font-medium text-slate-700">
            {formatUpdatedDate(layer.updatedAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default LayerCard;
