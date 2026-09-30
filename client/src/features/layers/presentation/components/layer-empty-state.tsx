"use client";

import React from "react";
import { Layers, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export type LayerEmptyStateProps = {
  onCreateClick: () => void;
};

export function LayerEmptyState({ onCreateClick }: LayerEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 max-w-lg mx-auto my-8">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 shadow-xs">
        <Layers className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-slate-800 tracking-tight">
        No hay capas registradas
      </h3>
      <p className="text-xs text-slate-500 mt-1.5 max-w-sm leading-relaxed mb-6">
        Aún no se han configurado capas cartográficas en la plataforma. Crea la
        primera capa para comenzar a estructurar los datos espaciales.
      </p>
      <Button
        onClick={onCreateClick}
        className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs"
      >
        <Plus className="w-4 h-4" />
        Crear Primera Capa
      </Button>
    </div>
  );
}

export default LayerEmptyState;
