"use client";

import React, { useState } from "react";
import { Check, Palette, ChevronDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import { cn } from "@/lib/utils";
import type { Layer, LayerColor } from "../../../domain/entities/layer.entity";
import { changeLayerColorAction } from "../../actions/layer.action";
import { LAYER_COLOR_MAP } from "./layer-theme-helper";

export type LayerColorPopoverProps = {
  layer: Layer;
  onColorChanged?: (newColor: LayerColor) => void;
  align?: "start" | "center" | "end";
  sideOffset?: number;
  className?: string;
};

const COLOR_KEYS: LayerColor[] = [
  "BLUE",
  "ORANGE",
  "GREEN",
  "VIOLET",
  "RED",
  "LIGHT_BLUE",
  "YELLOW",
];

export function LayerColorPopover({
  layer,
  onColorChanged,
  align = "center",
  sideOffset = 8,
  className,
}: LayerColorPopoverProps) {
  const [open, setOpen] = useState(false);
  const activeConfig = LAYER_COLOR_MAP[layer.color] ?? LAYER_COLOR_MAP.BLUE;

  const handleSelectColor = async (color: LayerColor) => {
    if (color === layer.color) {
      setOpen(false);
      return;
    }

    const previousColor = layer.color;
    // 1. Actualización optimista instantánea
    setOpen(false);
    onColorChanged?.(color);

    // 2. Disparo silencioso de la acción en segundo plano
    try {
      const result = await changeLayerColorAction(layer.id, { color });
      if (!result.ok) {
        // Rollback ante fallo
        onColorChanged?.(previousColor);
        appToast.error(
          "Error al actualizar color",
          result.errors?.[0] ?? "No se pudo cambiar el color de la capa."
        );
      } else {
        appToast.success(
          `Color de "${layer.name}" actualizado a ${
            LAYER_COLOR_MAP[color]?.label ?? color
          }.`
        );
      }
    } catch {
      onColorChanged?.(previousColor);
      appToast.error(
        "Error de conexión",
        "Ocurrió un error de red al intentar cambiar el color."
      );
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Cambiar color de la capa ${layer.name}`}
          className={cn(
            "group/btn inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 shadow-2xs hover:border-slate-300 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20",
            className
          )}
        >
          {/* Muestra circular cromática viva */}
          <span
            className="w-3.5 h-3.5 rounded-full shadow-2xs transition-transform group-hover/btn:scale-110 flex-shrink-0"
            style={{ backgroundColor: activeConfig.hex }}
          />
          <span className="text-xs font-semibold text-slate-700">
            {activeConfig.label}
          </span>
          <ChevronDown className="w-3 h-3 text-slate-400 group-hover/btn:text-slate-600 transition-colors" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align={align}
        sideOffset={sideOffset}
        className="w-64 p-3 rounded-2xl bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-xl space-y-2.5 z-[2500]"
      >
        <div className="flex items-center gap-1.5 px-1 text-[11px] font-semibold text-slate-500">
          <Palette className="w-3.5 h-3.5 text-slate-400" />
          <span>Simbología de Capa</span>
        </div>

        {/* Retícula de opciones cromáticas */}
        <div className="grid grid-cols-2 gap-1.5">
          {COLOR_KEYS.map((colorKey) => {
            const config = LAYER_COLOR_MAP[colorKey];
            const isSelected = layer.color === colorKey;

            return (
              <button
                key={colorKey}
                type="button"
                onClick={() => handleSelectColor(colorKey)}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-left transition-all border text-xs font-medium cursor-pointer select-none",
                  isSelected
                    ? "bg-slate-100 border-slate-300 text-slate-900 font-semibold shadow-2xs"
                    : "bg-transparent border-transparent hover:bg-slate-50 hover:border-slate-200 text-slate-600"
                )}
              >
                <span
                  className="w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center shadow-2xs"
                  style={{ backgroundColor: config.hex }}
                >
                  {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                </span>
                <span className="truncate">{config.label}</span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default LayerColorPopover;
