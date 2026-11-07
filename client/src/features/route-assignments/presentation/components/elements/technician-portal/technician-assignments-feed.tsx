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
      {/* 1. Título de la sección alineado con el grosor de los títulos del Dashboard */}
      <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
        Mis asignaciones
      </h3>

      {/* 2. Switch de pestañas basado fielmente en last-section.png */}
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full sm:w-[380px] select-none">
          {/* Botón Asignadas */}
          <button
            type="button"
            onClick={() => setActiveTab("ASSIGNED")}
            className={`h-12 rounded-full inline-flex items-center justify-center gap-2.5 px-6 text-sm sm:text-base font-bold transition-all cursor-pointer border-0 shadow-none ${
              activeTab === "ASSIGNED"
                ? "bg-gradient-to-r from-[#0d5eed] to-[#2582fb] text-white"
                : "bg-[#eef4fc] text-[#62758d] hover:bg-[#e4effc] hover:text-slate-800"
            }`}
          >
            <Briefcase className="size-4 sm:size-5 stroke-[2.2]" />
            <span>Asignadas</span>
          </button>

          {/* Botón Completadas */}
          <button
            type="button"
            onClick={() => setActiveTab("COMPLETED")}
            className={`h-12 rounded-full inline-flex items-center justify-center gap-2.5 px-6 text-sm sm:text-base font-bold transition-all cursor-pointer border-0 shadow-none ${
              activeTab === "COMPLETED"
                ? "bg-gradient-to-r from-[#0d5eed] to-[#2582fb] text-white"
                : "bg-[#eef4fc] text-[#62758d] hover:bg-[#e4effc] hover:text-slate-800"
            }`}
          >
            <CheckCircle2 className="size-4 sm:size-5 stroke-[2.2]" />
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
        <div className="rounded-[28px] sm:rounded-[36px] border border-dashed border-slate-200 bg-white/80 p-10 text-center space-y-3">
          <div className="size-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <ClipboardList className="size-6" />
          </div>
          <h4 className="text-sm sm:text-base font-bold text-slate-800">
            {activeTab === "ASSIGNED"
              ? "No tienes asignaciones pendientes"
              : "Aún no tienes asignaciones completadas"}
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {activeTab === "ASSIGNED"
              ? "Todas tus rutas asignadas han sido iniciadas o completadas por el momento."
              : "Las rutas finalizadas se archivarán automáticamente en esta sección."}
          </p>
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
