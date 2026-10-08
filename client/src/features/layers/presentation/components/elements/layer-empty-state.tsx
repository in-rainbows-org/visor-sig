"use client";

import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export type LayerEmptyStateProps = {
  onRetry?: () => void;
};

export function LayerEmptyState({ onRetry }: LayerEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-3xl border border-dashed border-slate-300 max-w-lg mx-auto my-8">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 shadow-xs">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-slate-800 tracking-tight">
        Catálogo de capas no disponible
      </h3>
      <p className="text-xs text-slate-500 mt-1.5 max-w-sm leading-relaxed mb-6">
        No se pudo recuperar el catálogo de capas fijas del sistema. Verifique la conexión con el servidor o actualice la página.
      </p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          className="gap-2 rounded-xl shadow-xs"
        >
          <RefreshCw className="w-4 h-4" />
          Reintentar
        </Button>
      )}
    </div>
  );
}

export default LayerEmptyState;
