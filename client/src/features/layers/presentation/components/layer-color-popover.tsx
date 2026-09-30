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
import type { Layer, LayerColor } from "../../domain/entities/layer.entity";
import { changeLayerColorAction } from "../actions/change-layer-color.action";
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
          "Error",
          result.errors?.[0] ?? "No se pudo actualizar el color de la capa."
        );
        return;
      }
      appToast.success(`Color cambiado a ${LAYER_COLOR_MAP[color].label}.`);
    } catch {
      onColorChanged?.(previousColor);
      appToast.error("Error", "Error de conexión al cambiar el color.");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Cambiar color de la capa"
          className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200/90 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer group select-none text-slate-700",
            className
          )}
        >
          <span
            className="w-3.5 h-3.5 rounded-full shadow-2xs flex-shrink-0 transition-transform group-hover:scale-110"
            style={{ backgroundColor: activeConfig.hex }}
          />
          <span className="font-medium text-slate-800">{activeConfig.label}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        sideOffset={sideOffset}
        className="w-72 p-4 rounded-3xl bg-white border border-slate-200/90 shadow-xl space-y-3 z-50"
      >
        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-800">
            <Palette className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold uppercase tracking-wide">
              Color de Capa
            </span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">
            {activeConfig.label}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2.5 pt-1">
          {COLOR_KEYS.map((key) => {
            const config = LAYER_COLOR_MAP[key];
            const isCurrent = layer.color === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelectColor(key)}
                title={config.label}
                aria-label={`Seleccionar ${config.label}`}
                className={cn(
                  "h-11 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-200 cursor-pointer border relative group",
                  isCurrent
                    ? "border-slate-800/80 bg-slate-50 shadow-xs ring-2 ring-slate-800/10 scale-105"
                    : "border-transparent hover:border-slate-200 hover:bg-slate-50/80 hover:scale-105"
                )}
              >
                <span
                  className="w-5 h-5 rounded-full shadow-2xs flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: config.hex }}
                >
                  {isCurrent && (
                    <Check className="w-3 h-3 text-white stroke-[3]" />
                  )}
                </span>
                <span className="text-[10px] font-medium text-slate-600 leading-none truncate max-w-full px-1">
                  {config.label}
                </span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default LayerColorPopover;
