"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { StopsFilterOption } from "@/features/route-assignments/domain/entities/assignment-execution.entity";
import type { AssignmentStopDetail } from "@/features/route-assignments/domain/entities/assignment-detail.entity";

export interface TechnicianStopsFilterTabsProps {
  activeTab: StopsFilterOption;
  onChangeTab: (tab: StopsFilterOption) => void;
  stops: readonly AssignmentStopDetail[];
  className?: string;
}

export function TechnicianStopsFilterTabs({
  activeTab,
  onChangeTab,
  stops,
  className = "",
}: TechnicianStopsFilterTabsProps) {
  const pendingCount = stops.filter(
    (s) => s.status === "PENDING" || s.status === "IN_TRANSIT" || s.status === "ARRIVED"
  ).length;

  const failedCount = stops.filter((s) => s.status === "FAILED").length;
  const completedCount = stops.filter((s) => s.status === "COMPLETED").length;

  const normalizedTabs: { key: StopsFilterOption; label: string; count: number }[] = [
    { key: "PENDING", label: "Pendientes", count: pendingCount },
    { key: "FAILED", label: "Fallidas", count: failedCount },
    { key: "COMPLETED", label: "Completadas", count: completedCount },
  ];

  return (
    <div
      role="tablist"
      aria-label="Filtro de paradas"
      className={cn(
        "w-full grid grid-cols-3 p-1 rounded-full bg-slate-100/90 gap-1 select-none shadow-none border-0",
        className
      )}
    >
      {normalizedTabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChangeTab(tab.key)}
            className={cn(
              "flex items-center justify-center gap-1.5 py-2 px-2 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer border-0 outline-none shadow-none",
              isActive
                ? "bg-gradient-to-r from-[#0e4dcb] via-[#1a66e5] to-[#2579f6] text-white shadow-none"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
            )}
          >
            <span className="truncate">{tab.label}</span>
            <span
              className={cn(
                "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold",
                isActive
                  ? "bg-white/20 text-white backdrop-blur-xs"
                  : "bg-slate-200/90 text-slate-600"
              )}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default TechnicianStopsFilterTabs;
