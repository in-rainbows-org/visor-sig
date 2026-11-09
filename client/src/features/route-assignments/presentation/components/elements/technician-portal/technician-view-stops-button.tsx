"use client";

import React from "react";
import { ListOrdered, Play } from "lucide-react";
import type { AssignmentStatus } from "@/features/route-assignments/domain/entities/route-assignment.entity";

export interface TechnicianViewStopsButtonProps {
  totalStops: number;
  assignmentStatus?: AssignmentStatus | string;
  onClick: () => void;
  className?: string;
}

export function TechnicianViewStopsButton({
  totalStops,
  assignmentStatus,
  onClick,
  className = "",
}: TechnicianViewStopsButtonProps) {
  const isAssigned = assignmentStatus === "ASSIGNED";
  const label = isAssigned ? "Comenzar" : "Ver detalles";

  return (
    <div
      className={`fixed bottom-6 inset-x-3 sm:inset-x-4 z-40 pointer-events-auto select-none flex justify-center ${className}`}
    >
      <button
        type="button"
        onClick={onClick}
        aria-label={`${label} - ${totalStops} paradas`}
        className="relative w-full h-12 px-6 rounded-full bg-gradient-to-r from-[#0e4dcb] via-[#1660dc] to-[#2d83f3] text-white font-semibold text-sm shadow-xl hover:shadow-2xl active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer border-0 ring-0 outline-none"
      >
        <div className="flex items-center justify-center gap-2.5">
          {isAssigned ? (
            <Play className="size-4.5 stroke-[2.2] fill-current" />
          ) : (
            <ListOrdered className="size-4.5 stroke-[2.2]" />
          )}
          <span>{label}</span>
        </div>
        <span className="absolute right-4 sm:right-5 inline-flex items-center justify-center min-w-6 h-6 px-2 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-xs">
          {totalStops}
        </span>
      </button>
    </div>
  );
}

export default TechnicianViewStopsButton;
