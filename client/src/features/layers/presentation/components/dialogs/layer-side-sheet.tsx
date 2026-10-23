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
      {/* Botón de cierre superior derecho: círculo gris con X */}
      <div className="absolute top-4 right-4 z-20">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onOpenChange(false)}
          className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors border-0 shadow-none cursor-pointer"
          aria-label="Cerrar panel lateral"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
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

          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {layer.name}
          </h2>

          <div className="mt-2 flex items-center justify-center">
            <span className="text-xs font-semibold px-3.5 py-1 rounded-full bg-blue-50 text-blue-600 border-0 shadow-none">
              {geometryLabel}
            </span>
          </div>
        </div>

        {/* Acciones principales: Selector de color en card gris y Botón de Importar */}
        <div className="space-y-4 pt-1">
          {/* Card gris contenedor redondeado para el selector de color */}
          <div className="bg-slate-100/75 rounded-2xl sm:rounded-3xl p-4 flex flex-col items-center gap-2.5 text-center border-0 shadow-none">
            <span className="text-xs sm:text-sm font-medium text-slate-700">
              Color de renderizado en el mapa
            </span>
            <LayerColorPopover
              layer={layer}
              onColorChanged={(newColor) => onColorChanged?.(layer.id, newColor)}
              className="w-full"
            />
          </div>

          {/* Botón de Importación con degradado por defecto de Shadcn */}
          <Button
            onClick={() => onOpenImport?.(layer)}
            className="w-full h-12 rounded-full text-sm font-semibold flex items-center justify-center gap-2 shadow-none cursor-pointer"
          >
            <Upload className="w-4 h-4 text-white shrink-0" />
            <span>Importar ZIP Shapefile</span>
          </Button>
        </div>

        {/* Historial de Versiones */}
        <div className="space-y-3 pt-2">
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">
            Historial de versiones
          </h3>

          <div className="space-y-2.5">{historyContent}</div>
        </div>
      </div>
    </AppSheet>
  );
}

export default LayerSideSheet;
