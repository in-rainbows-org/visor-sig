"use client";

import React from "react";
import { ListOrdered } from "lucide-react";

export interface TechnicianViewStopsButtonProps {
  totalStops: number;
  onClick: () => void;
  className?: string;
}

export function TechnicianViewStopsButton({
  totalStops,
  onClick,
  className = "",
}: TechnicianViewStopsButtonProps) {
  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-auto select-none w-full max-w-xs px-3 flex justify-center ${className}`}
    >
      <button
        type="button"
        onClick={onClick}
        aria-label={`Ver lista de ${totalStops} paradas`}
        className="w-full h-12 px-6 rounded-full bg-gradient-to-r from-[#0e4dcb] via-[#1a66e5] to-[#2579f6] text-white font-semibold text-sm shadow-xl hover:shadow-2xl active:scale-95 transition-all duration-200 flex items-center justify-between cursor-pointer border-0 ring-0 outline-none"
      >
        <div className="flex items-center gap-2.5">
          <ListOrdered className="size-4.5 stroke-[2.2]" />
          <span>Ver paradas</span>
        </div>
        <span className="inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-xs">
          {totalStops}
        </span>
      </button>
    </div>
  );
}

export default TechnicianViewStopsButton;
