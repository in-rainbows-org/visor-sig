"use client";

import React, { useState } from "react";
import { Briefcase, CheckCircle2, ClipboardList } from "lucide-react";
import type { TechnicianFeedItem } from "../../../../domain/entities/technician-dashboard.entity";
import { TechnicianFeedCard, type FeedTab } from "./technician-feed-card";

export interface TechnicianAssignmentsFeedProps {
  assignedItems: TechnicianFeedItem[];
  completedItems: TechnicianFeedItem[];
  defaultTab?: FeedTab;
  onSelectAssignment?: (item: TechnicianFeedItem) => void;
  className?: string;
}

export function TechnicianAssignmentsFeed({
  assignedItems,
  completedItems,
  defaultTab = "ASSIGNED",
  onSelectAssignment,
  className = "",
}: TechnicianAssignmentsFeedProps) {
  const [activeTab, setActiveTab] = useState<FeedTab>(defaultTab);

  const currentItems = activeTab === "ASSIGNED" ? assignedItems : completedItems;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 1. Título de la sección */}
      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
        Mis asignaciones
      </h3>

      {/* 2. Switch de pestañas contenido en una tarjeta/píldora ovalada */}
      <div className="flex flex-col gap-2">
        <div className="inline-flex p-1.5 rounded-full bg-slate-200/70 border border-slate-200/60 w-full sm:w-[380px] select-none shadow-xs">
          {/* Botón Asignadas */}
          <button
            type="button"
            onClick={() => setActiveTab("ASSIGNED")}
            className={`flex-1 h-11 rounded-full inline-flex items-center justify-center gap-2 px-4 text-sm sm:text-base font-bold transition-all duration-200 cursor-pointer border-0 shadow-none ${
              activeTab === "ASSIGNED"
                ? "bg-gradient-to-r from-[#0d5eed] to-[#2582fb] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Briefcase className="size-4 sm:size-4.5 stroke-[2.2]" />
            <span>Asignadas</span>
          </button>

          {/* Botón Completadas */}
          <button
            type="button"
            onClick={() => setActiveTab("COMPLETED")}
            className={`flex-1 h-11 rounded-full inline-flex items-center justify-center gap-2 px-4 text-sm sm:text-base font-bold transition-all duration-200 cursor-pointer border-0 shadow-none ${
              activeTab === "COMPLETED"
                ? "bg-gradient-to-r from-[#0d5eed] to-[#2582fb] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <CheckCircle2 className="size-4 sm:size-4.5 stroke-[2.2]" />
            <span>Completadas</span>
          </button>
        </div>

        {/* Texto gris simple indicando el total encontradas */}
        <p className="text-xs font-semibold text-slate-400 px-1 pt-0.5">
          {currentItems.length} encontradas
        </p>
      </div>

      {/* 3. Listado de tarjetas de asignación o Estado Vacío */}
      {currentItems.length === 0 ? (
        <div className="rounded-[28px] sm:rounded-[36px] border border-dashed border-slate-200 bg-white/70 p-8 sm:p-10 text-center space-y-2">
          <ClipboardList className="size-8 text-slate-300 stroke-[1.5] mx-auto" />
          <h4 className="text-sm sm:text-base font-semibold text-slate-700">
            {activeTab === "ASSIGNED"
              ? "No tienes asignaciones pendientes"
              : "Aún no hay asignaciones completadas"}
          </h4>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-3.5 pt-1">
          {currentItems.map((item) => (
            <TechnicianFeedCard
              key={item.id}
              item={item}
              tab={activeTab}
              onClick={onSelectAssignment ? () => onSelectAssignment(item) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
