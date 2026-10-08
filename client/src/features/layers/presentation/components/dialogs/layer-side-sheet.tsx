"use client";

import React, { ReactNode } from "react";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import { AppSheet } from "@/features/shared/presentation/components/dialogs/app-sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Layer, LayerColor } from "../../../domain/entities/layer.entity";
import {
  GEOMETRY_LABEL_MAP,
  getLayerDashboardAsset,
  LAYER_COLOR_MAP,
} from "../elements/layer-theme-helper";
import { LayerColorPopover } from "../elements/layer-color-popover";

export type LayerSideSheetProps = {
  layer: Layer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onColorChanged?: (layerId: string, newColor: LayerColor) => void;
  onOpenImport?: (layer: Layer) => void;
  historyContent?: ReactNode;
};

export function LayerSideSheet({
  layer,
  open,
  onOpenChange,
  onColorChanged,
  onOpenImport,
  historyContent,
}: LayerSideSheetProps) {
  if (!layer) return null;

  const colorConfig = LAYER_COLOR_MAP[layer.color] ?? LAYER_COLOR_MAP.BLUE;
  const geometryLabel = GEOMETRY_LABEL_MAP[layer.geometryType] ?? "Capa";
  const imageSrc = getLayerDashboardAsset(layer.kind, layer.name);

  return (
    <AppSheet
      open={open}
      onOpenChange={onOpenChange}
      title={layer.name}
      description="Configuración y versiones de la capa cartográfica"
      side="right"
      hideHeader={true}
      className="sm:max-w-md w-full p-0 flex flex-col bg-white border-l border-slate-200 shadow-2xl"
    >
      {/* Botón de cierre superior derecho */}
      <div className="absolute top-4 right-4 z-20">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onOpenChange(false)}
          className="rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          aria-label="Cerrar panel lateral"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Encabezado limpio: Imagen centrada, Nombre de la capa y Tipo de Geometría */}
        <div className="flex flex-col items-center text-center pt-2 pb-1">
          <div className="relative w-28 h-28 mb-3 transition-transform duration-300">
            <Image
              src={imageSrc}
              alt={layer.name}
              fill
              sizes="112px"
              className="object-contain drop-shadow-[0_6px_16px_rgba(0,0,0,0.12)]"
            />
          </div>

          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {layer.name}
          </h2>

          <div className="mt-1.5 flex items-center gap-1.5">
            <span
              className={cn(
                "text-xs font-semibold px-3 py-0.5 rounded-full border shadow-2xs",
                colorConfig.badge
              )}
            >
              {geometryLabel}
            </span>
          </div>
        </div>

        {/* Acciones principales: Selector de color centrado y Botón de Importar */}
        <div className="space-y-4 pt-1">
          {/* Selector de Simbología Cromática Centrado */}
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="text-xs font-medium text-slate-500">
              Color de renderizado en el mapa
            </span>
            <LayerColorPopover
              layer={layer}
              onColorChanged={(newColor) => onColorChanged?.(layer.id, newColor)}
            />
          </div>

          {/* Botón de Importación */}
          <Button
            onClick={() => onOpenImport?.(layer)}
            className="w-full gap-2 rounded-2xl h-11 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
          >
            <Upload className="w-4 h-4" />
            Importar ZIP Shapefile
          </Button>
        </div>

        {/* Historial de Versiones */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Historial de Versiones
            </h4>
          </div>

          <div className="space-y-2.5">{historyContent}</div>
        </div>
      </div>
    </AppSheet>
  );
}

export default LayerSideSheet;
