"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Layer, LayerColor } from "../../domain/entities/layer.entity";
import { GEOMETRY_LABEL_MAP } from "./layer-theme-helper";
import { LayerColorSelector } from "./layer-color-selector";

export type LayerColorFormData = {
  color: LayerColor;
};

export type LayerColorFormProps = {
  layer: Layer;
  onSubmit: (data: LayerColorFormData) => Promise<void>;
  onCancel?: () => void;
  isPending?: boolean;
  errorMessage?: string | null;
};

export function LayerColorForm({
  layer,
  onSubmit,
  onCancel,
  isPending = false,
  errorMessage,
}: LayerColorFormProps) {
  const [color, setColor] = useState<LayerColor>(layer.color);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({ color });
  };

  const geometryLabel = GEOMETRY_LABEL_MAP[layer.geometryType] ?? "Capa";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errorMessage && (
        <div className="p-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
          {errorMessage}
        </div>
      )}

      {/* Información de solo lectura */}
      <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 space-y-3">
        <div>
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Nombre de la Capa (Fijo)
          </span>
          <p className="text-sm font-bold text-slate-800 mt-0.5">{layer.name}</p>
        </div>

        <div>
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Geometría (Inmutable)
          </span>
          <p className="text-sm font-medium text-slate-700 mt-0.5">{geometryLabel}</p>
        </div>
      </div>

      {/* Selector de Paleta Cromática */}
      <LayerColorSelector
        value={color}
        onChange={setColor}
        disabled={isPending}
      />

      {/* Acciones del formulario */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-xl text-xs font-semibold"
          >
            Cancelar
          </Button>
        )}
        <Button
          type="submit"
          disabled={isPending}
          className="rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs px-5"
        >
          {isPending ? "Guardando..." : "Guardar Color"}
        </Button>
      </div>
    </form>
  );
}

export default LayerColorForm;
