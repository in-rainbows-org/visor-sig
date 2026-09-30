"use client";

import React from "react";
import { Eye, EyeOff } from "lucide-react";
import {
  ALL_FIXED_CODE_STATUS_VALUES,
  FIXED_CODE_STATUSES,
} from "../../../domain/models/fixed-code-status.types";
import { useMapView } from "../../state/map-view-store";

export type MapStatusCardProps = {
  className?: string;
};

export function MapStatusCard({ className = "" }: MapStatusCardProps) {
  const { state, toggleFixedCodeStatus, setAllFixedCodeStatuses } = useMapView();
  const { visibleFixedCodeStatuses } = state;

  const allSelected = visibleFixedCodeStatuses.size === ALL_FIXED_CODE_STATUS_VALUES.length;

  return (
    <div
      className={`bg-white/95 backdrop-blur-md w-72 max-w-[calc(100vw-5rem)] rounded-2xl p-4 shadow-float border border-gray-100 select-none ${className}`}
      data-purpose="map-status-card"
    >
      <div className="flex items-center justify-between mb-3 border-b border-gray-100/80 pb-2">
        <h3 className="text-xs font-bold text-gray-800">
          Estado del Código Fijo
        </h3>
        <button
          type="button"
          onClick={() => setAllFixedCodeStatuses(!allSelected)}
          className="text-[10px] text-blue-600 hover:underline font-semibold cursor-pointer"
        >
          {allSelected ? "Ocultar todos" : "Mostrar todos"}
        </button>
      </div>

      <div className="space-y-1">
        {ALL_FIXED_CODE_STATUS_VALUES.map((statusVal) => {
          const item = FIXED_CODE_STATUSES[statusVal];
          const isVisible = visibleFixedCodeStatuses.has(statusVal);

          return (
            <div
              key={item.value}
              onClick={() => toggleFixedCodeStatus(item.value)}
              className="flex items-center justify-between py-1.5 hover:bg-gray-50/80 px-2 rounded-lg transition cursor-pointer group"
            >
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  aria-label={`Alternar estado ${item.label}`}
                  className="transition cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFixedCodeStatus(item.value);
                  }}
                >
                  {isVisible ? (
                    <Eye className="w-4 h-4 text-blue-500 hover:text-blue-600" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-300 hover:text-gray-500" />
                  )}
                </button>

                <div
                  className={`w-5 h-5 rounded-full ${item.pinBgClass} border border-white shadow-2xs flex items-center justify-center shrink-0`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>

                <span
                  className={`text-xs font-medium transition ${
                    isVisible
                      ? "text-gray-700 group-hover:text-gray-900"
                      : "text-gray-400 line-through"
                  }`}
                >
                  {item.label}
                </span>
              </div>

              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${item.badgeBgClass}`}
              >
                {item.badgeLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MapStatusCard;
