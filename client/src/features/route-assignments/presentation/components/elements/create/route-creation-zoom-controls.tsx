"use client";

import React from "react";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export type RouteCreationZoomControlsProps = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  className?: string;
};

export function RouteCreationZoomControls({
  onZoomIn,
  onZoomOut,
  className = "",
}: RouteCreationZoomControlsProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl shadow-md shadow-slate-900/10 border border-slate-200/60 flex flex-col items-center overflow-hidden w-10 divide-y divide-slate-100 select-none",
        className
      )}
    >
      <button
        type="button"
        onClick={onZoomIn}
        aria-label="Acercar mapa"
        title="Acercar mapa"
        className="w-10 h-10 flex items-center justify-center transition text-slate-600 hover:text-blue-600 hover:bg-slate-50 active:bg-blue-50 active:scale-95 cursor-pointer"
      >
        <Plus className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={onZoomOut}
        aria-label="Alejar mapa"
        title="Alejar mapa"
        className="w-10 h-10 flex items-center justify-center transition text-slate-600 hover:text-blue-600 hover:bg-slate-50 active:bg-blue-50 active:scale-95 cursor-pointer"
      >
        <Minus className="w-4 h-4" />
      </button>
    </div>
  );
}

export default RouteCreationZoomControls;
