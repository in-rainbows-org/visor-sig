"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { LayerColor } from "../../domain/entities/layer.entity";
import { LAYER_COLOR_MAP } from "./layer-theme-helper";

export type LayerColorSelectorProps = {
  value: LayerColor;
  onChange: (color: LayerColor) => void;
  disabled?: boolean;
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

export function LayerColorSelector({
  value,
  onChange,
  disabled = false,
}: LayerColorSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
        Color de Simbología
      </label>
      <div className="flex flex-wrap items-center gap-3 pt-1">
        {COLOR_KEYS.map((key) => {
          const config = LAYER_COLOR_MAP[key];
          const isSelected = value === key;

          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => onChange(key)}
              title={config.label}
              aria-label={`Seleccionar color ${config.label}`}
              className={cn(
                "w-8 h-8 rounded-full transition-transform hover:scale-110 shadow-xs flex items-center justify-center cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
                isSelected && "ring-2 ring-offset-2 ring-slate-800 scale-105"
              )}
              style={{ backgroundColor: config.hex }}
            >
              {isSelected && (
                <span className="w-2 h-2 rounded-full bg-white shadow-xs" />
              )}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-500">
        Color seleccionado:{" "}
        <strong className="text-slate-800 font-semibold">
          {LAYER_COLOR_MAP[value]?.label ?? "Azul"}
        </strong>
      </p>
    </div>
  );
}

export default LayerColorSelector;
