"use client";

import React from "react";
import { X } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import type { AssignmentStopDetail } from "@/features/route-assignments/domain/entities/assignment-detail.entity";
import { TechnicianStopsList } from "./technician-stops-list";
import { AssignmentDetailProgress } from "../detail/assignment-detail-progress";

export interface TechnicianStopsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stops: readonly AssignmentStopDetail[];
  selectedStop: AssignmentStopDetail | null;
  onSelectStop: (stop: AssignmentStopDetail) => void;
  totalStops?: number;
  completedStops?: number;
}

export function TechnicianStopsDrawer({
  open,
  onOpenChange,
  stops,
  selectedStop,
  onSelectStop,
  totalStops,
  completedStops,
}: TechnicianStopsDrawerProps) {
  const handleSelect = (stop: AssignmentStopDetail) => {
    onSelectStop(stop);
    onOpenChange(false);
  };

  const effectiveTotal = totalStops ?? stops.length;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[80vh] flex flex-col">
        {/* Título y descripción accesibles para lectores de pantalla */}
        <DrawerTitle className="sr-only">Paradas de la ruta</DrawerTitle>
        <DrawerDescription className="sr-only">
          Progreso y listado de paradas de la asignación
        </DrawerDescription>

        {/* Header totalmente blanco sin contenido */}
        <div className="w-full pt-1 shrink-0" />

        {/* Contenido scrolleable del Drawer */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-4 overscroll-contain scrollbar-thin scrollbar-thumb-slate-200">
          {/* Progreso de la asignación antes de la lista de paradas pendientes */}
          <AssignmentDetailProgress
            totalStops={effectiveTotal}
            stops={stops}
            completedStops={completedStops}
            title="Progreso de asignación"
            className="px-0.5 pt-0"
          />

          {/* Listado en dos secciones: Pendientes y Finalizadas */}
          <TechnicianStopsList
            stops={stops}
            selectedStop={selectedStop}
            onSelectStop={handleSelect}
            showHeader={false}
          />
        </div>

        {/* Footer del Drawer */}
        <DrawerFooter className="pt-2 pb-4 px-4 border-t border-slate-100 bg-white/50">
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
