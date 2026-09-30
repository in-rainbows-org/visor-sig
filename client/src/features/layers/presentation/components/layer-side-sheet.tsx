"use client";

import React, { ReactNode } from "react";
import {
  Layers,
  MapPin,
  Route,
  Hexagon,
  Upload,
} from "lucide-react";
import { AppSheet } from "@/features/shared/presentation/components/dialogs/app-sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Layer, LayerColor } from "../../domain/entities/layer.entity";
import {
  GEOMETRY_LABEL_MAP,
  LAYER_COLOR_MAP,
} from "./layer-theme-helper";
import { LayerColorPopover } from "./layer-color-popover";

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

  const colorConfig =
    LAYER_COLOR_MAP[layer.color] ?? LAYER_COLOR_MAP.BLUE;
  const geometryLabel =
    GEOMETRY_LABEL_MAP[layer.geometryType] ?? "Capa";

  const renderGeometryIcon = () => {
    switch (layer.geometryType) {
      case "POINT":
        return <MapPin className="w-7 h-7" />;
      case "LINE":
        return <Route className="w-7 h-7" />;
      case "POLYGON":
        return <Hexagon className="w-7 h-7" />;
      default:
        return <Layers className="w-7 h-7" />;
    }
  };

  return (
    <AppSheet
      open={open}
      onOpenChange={onOpenChange}
      title={layer.name}
      description="Detalles de la capa e historial de importaciones"
      side="right"
      width="lg"
      hideHeader
      showCloseButton
    >
      <div className="flex flex-col h-full">
        {/* Cabecera integrada de la capa */}
        <div className="p-6 border-b border-slate-100 bg-white space-y-5 relative">
          <div className="flex items-start gap-4 pr-8">
            {/* Ícono cromático representativo */}
            <div
              className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xs border transition-transform duration-300",
                colorConfig.iconBox
              )}
            >
              {renderGeometryIcon()}
            </div>

            {/* Identidad de la Capa */}
            <div className="flex-1 min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight truncate">
                {layer.name}
              </h2>

              <div className="flex flex-col items-start gap-2.5 mt-2.5">
                {/* Badge Geometría */}
                <span
                  className={cn(
                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold shadow-2xs border",
                    colorConfig.badge
                  )}
                >
                  {geometryLabel}
                </span>

                {/* Popover de Selector de Color Silencioso debajo del badge */}
                <LayerColorPopover
                  layer={layer}
                  onColorChanged={(newColor) => onColorChanged?.(layer.id, newColor)}
                />
              </div>
            </div>
          </div>

          {/* Botón de Importar Datos */}
          {onOpenImport && (
            <div className="pt-2">
              <Button
                onClick={() => onOpenImport(layer)}
                className="w-full gap-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs py-2.5"
              >
                <Upload className="w-4 h-4" />
                Importar Nuevo Dataset (ZIP)
              </Button>
            </div>
          )}
        </div>

        {/* Historial de importaciones de datos */}
        <div className="flex-1 p-6 bg-slate-50/50 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Historial de Importaciones de Datos
            </h3>
          </div>

          {historyContent}
        </div>
      </div>
    </AppSheet>
  );
}

export default LayerSideSheet;
