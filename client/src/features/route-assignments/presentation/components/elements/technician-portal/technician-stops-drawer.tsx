"use client";

import React, { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { SlideConfirm } from "@/components/ui/slide-confirm";
import type { AssignmentStopDetail } from "@/features/route-assignments/domain/entities/assignment-detail.entity";
import type { AssignmentStatus } from "@/features/route-assignments/domain/entities/route-assignment.entity";
import type { StopsFilterOption } from "@/features/route-assignments/domain/entities/assignment-execution.entity";
import { TechnicianStopsList } from "./technician-stops-list";
import { TechnicianStopsFilterTabs } from "./technician-stops-filter-tabs";
import { AssignmentDetailProgress } from "../detail/assignment-detail-progress";

export interface TechnicianStopsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stops: readonly AssignmentStopDetail[];
  selectedStop?: AssignmentStopDetail | null;
  onSelectStop?: (stop: AssignmentStopDetail) => void;
  totalStops?: number;
  completedStops?: number;
  scheduledDate?: string;
  totalDistanceKm?: number;
  assignmentStatus?: AssignmentStatus | string;
  onStartAssignment?: () => Promise<boolean | void>;
  isStarting?: boolean;
}

function formatSummaryDate(dateStr?: string | null): string {
  if (!dateStr) return "Sin fecha asignada";
  try {
    const parts = dateStr.split("T")[0].split("-").map(Number);
    if (parts.length < 3) return dateStr;
    const [year, month, day] = parts;
    const date = new Date(year, month - 1, day);
    const formatted = new Intl.DateTimeFormat("es-BO", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  } catch {
    return dateStr;
  }
}

export function TechnicianStopsDrawer({
  open,
  onOpenChange,
  stops,
  selectedStop,
  onSelectStop,
  totalStops,
  completedStops,
  scheduledDate,
  totalDistanceKm,
  assignmentStatus,
  onStartAssignment,
  isStarting = false,
}: TechnicianStopsDrawerProps) {
  const [activeTab, setActiveTab] = useState<StopsFilterOption>("PENDING");

  const handleSelect = (stop: AssignmentStopDetail) => {
    onSelectStop?.(stop);
    onOpenChange(false);
  };

  const effectiveTotal = totalStops ?? stops.length;
  const isAssigned = assignmentStatus === "ASSIGNED";

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] flex flex-col">
        {/* Título y descripción accesibles para lectores de pantalla */}
        <DrawerTitle className="sr-only">Paradas de la ruta</DrawerTitle>
        <DrawerDescription className="sr-only">
          Progreso, métricas y listado de paradas de la asignación
        </DrawerDescription>

        {/* Header totalmente blanco sin contenido */}
        <div className="w-full pt-1 shrink-0" />

        {/* Contenido scrolleable del Drawer dividido por secciones */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-6 overscroll-contain scrollbar-thin scrollbar-thumb-slate-200">
          
          {/* SECCIÓN 1: DETALLES */}
          <section className="space-y-2.5">
            <h4 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
              Detalles
            </h4>

            {/* Fila 1: Card de Fecha programada (color celeste sin contorno) */}
            <div className="w-full bg-sky-50 rounded-2xl p-3.5 flex items-center justify-between shadow-none border-0">
              <div className="space-y-0.5 min-w-0 pr-2">
                <span className="text-[10px] sm:text-[11px] font-bold text-sky-700 uppercase tracking-wider block">
                  Fecha programada
                </span>
                <span className="text-xs sm:text-sm font-bold text-sky-950 truncate block">
                  {formatSummaryDate(scheduledDate)}
                </span>
              </div>
              <div className="relative size-10 shrink-0">
                <Image
                  src="/assignment-route/fecha.webp"
                  alt="Fecha programada"
                  fill
                  className="object-contain"
                  sizes="40px"
                />
              </div>
            </div>

            {/* Fila 2: Dos tarjetas (Total Casas más azul sin contorno, Distancia Total violeta sin contorno) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-100/70 rounded-2xl p-3 flex items-center justify-between shadow-none border-0">
                <div className="space-y-0.5 min-w-0 pr-1">
                  <span className="text-[10px] sm:text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
                    Total casas
                  </span>
                  <span className="text-sm sm:text-base font-bold text-blue-950 truncate block">
                    {effectiveTotal} {effectiveTotal === 1 ? "casa" : "casas"}
                  </span>
                </div>
                <div className="relative size-9 sm:size-10 shrink-0">
                  <Image
                    src="/assignment-route/casas.webp"
                    alt="Total casas"
                    fill
                    className="object-contain"
                    sizes="40px"
                  />
                </div>
              </div>

              <div className="bg-purple-50/90 rounded-2xl p-3 flex items-center justify-between shadow-none border-0">
                <div className="space-y-0.5 min-w-0 pr-1">
                  <span className="text-[10px] sm:text-[11px] font-bold text-purple-700 uppercase tracking-wider block">
                    Distancia total
                  </span>
                  <span className="text-sm sm:text-base font-bold text-purple-950 truncate block">
                    {Number(totalDistanceKm ?? 0).toFixed(1)} km
                  </span>
                </div>
                <div className="relative size-9 sm:size-10 shrink-0">
                  <Image
                    src="/assignment-route/distancia.webp"
                    alt="Distancia total"
                    fill
                    className="object-contain"
                    sizes="40px"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* SECCIÓN 2: PROGRESO DE ASIGNACIÓN */}
          <section className="space-y-2">
            <AssignmentDetailProgress
              totalStops={effectiveTotal}
              stops={stops}
              completedStops={completedStops}
              title="Progreso de asignación"
              titleClassName="text-base sm:text-lg font-bold text-slate-800 tracking-tight"
              className="px-0.5 pt-0 space-y-2.5"
            />
          </section>

          {/* SECCIÓN 3: PARADAS */}
          <section className="space-y-3">
            <h4 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
              Paradas
            </h4>

            {/* Segmented switch de 3 pestañas más redondas y sin sombra */}
            <TechnicianStopsFilterTabs
              activeTab={activeTab}
              onChangeTab={setActiveTab}
              stops={stops}
            />

            {/* Listado filtrado de paradas con estado vacío dedicado */}
            <TechnicianStopsList
              stops={stops}
              selectedStop={selectedStop ?? null}
              onSelectStop={onSelectStop ? handleSelect : undefined}
              activeFilter={activeTab}
              showHeader={false}
            />
          </section>
        </div>

        {/* Footer del Drawer */}
        <DrawerFooter className="pt-2 pb-4 px-4 border-t border-slate-100 bg-white/50 space-y-2 shadow-none">
          {/* Slider de confirmación de inicio para estado ASSIGNED */}
          {isAssigned && onStartAssignment && (
            <div className="w-full">
              <SlideConfirm
                height={49}
                text="Desliza para comenzar la asignación"
                confirmedText="Comenzando asignación..."
                variant="blue"
                disabled={isStarting}
                onConfirm={async () => {
                  await onStartAssignment();
                }}
              />
            </div>
          )}

          <DrawerClose asChild>
            <button
              type="button"
              className="w-full h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition active:scale-95 cursor-pointer border-0 inline-flex items-center justify-center gap-1.5"
            >
              <X className="size-3.5 stroke-[2.5]" />
              <span>Cerrar</span>
            </button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export default TechnicianStopsDrawer;
