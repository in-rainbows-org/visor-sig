"use client";

import React from "react";
import {
  Calendar,
  CheckCircle2,
  Home,
  ListOrdered,
  MapPin,
  X,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import type {
  AssignmentStopDetail,
  AssignmentStopStatus,
} from "@/features/route-assignments/domain/entities/assignment-detail.entity";

export interface TechnicianStopDetailDrawerProps {
  stop: AssignmentStopDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewAllStops?: () => void;
}

function formatTime(date: Date | null): string {
  if (!date) return "--";
  try {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  } catch {
    return "--";
  }
}

function StopStatusBadge({ status }: { status: AssignmentStopStatus }) {
  const normalized = (status ? String(status).toUpperCase().trim() : "PENDING") as AssignmentStopStatus;
  switch (normalized) {
    case "COMPLETED":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shrink-0">
          <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
          <span>Completa</span>
        </span>
      );
    case "ARRIVED":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/60 shrink-0">
          <span className="size-2 rounded-full bg-amber-500 shrink-0" />
          <span>En proceso</span>
        </span>
      );
    case "IN_TRANSIT":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200/60 shrink-0">
          <span className="size-2 rounded-full bg-sky-500 shrink-0" />
          <span>En tránsito</span>
        </span>
      );
    case "FAILED":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/60 shrink-0">
          <span className="size-2 rounded-full bg-rose-500 shrink-0" />
          <span>Fallida</span>
        </span>
      );
    case "PENDING":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200/60 shrink-0">
          <span className="size-2 rounded-full bg-slate-400 shrink-0" />
          <span>Pendiente</span>
        </span>
      );
  }
}

export function TechnicianStopDetailDrawer({
  stop,
  open,
  onOpenChange,
  onViewAllStops,
}: TechnicianStopDetailDrawerProps) {
  if (!stop) return null;

  let llegadaText = "--";
  let completadoText = "--";

  if (stop.status === "COMPLETED") {
    llegadaText = formatTime(stop.arrivedAt ?? stop.inTransitAt);
    completadoText = formatTime(stop.completedAt);
  } else if (stop.status === "IN_TRANSIT" || stop.status === "ARRIVED") {
    llegadaText = formatTime(stop.arrivedAt ?? stop.inTransitAt);
    completadoText = "--";
  } else if (stop.status === "FAILED") {
    llegadaText = formatTime(stop.arrivedAt ?? stop.inTransitAt);
    completadoText = formatTime(stop.completedAt);
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] flex flex-col">
        {/* Cabecera del Drawer */}
        <DrawerHeader className="px-5 pt-2 pb-3 border-b border-slate-100/90 text-left">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center size-7 rounded-full bg-blue-600 text-white font-bold text-xs">
                {stop.orderIndex}
              </span>
              <DrawerTitle className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Parada #{stop.orderIndex}
              </DrawerTitle>
            </div>
            <StopStatusBadge status={stop.status} />
          </div>
          <DrawerDescription className="text-xs text-slate-500 mt-1">
            Código Fijo: #{stop.fixedCode ?? "S/C"}
          </DrawerDescription>
        </DrawerHeader>

        {/* Cuerpo de la información */}
        <div className="p-4 space-y-3.5 overflow-y-auto">
          {/* Tarjeta de Titular y Predio */}
          <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Home className="size-3.5 text-slate-400 shrink-0" />
              <span>Titular / Referencia</span>
            </div>
            <h4 className="text-sm font-bold text-slate-900 leading-snug">
              {stop.name || "Sin titular registrado"}
            </h4>
          </div>

          {/* Grid de Horarios */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                <Calendar className="size-3.5 text-slate-400 shrink-0" />
                <span>Llegada</span>
              </div>
              <p className="text-xs font-bold text-slate-800">{llegadaText}</p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                <span>Conclusión</span>
              </div>
              <p className="text-xs font-bold text-slate-800">{completadoText}</p>
            </div>
          </div>

          {/* Ubicación GPS */}
          <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-500 font-medium">
              <MapPin className="size-3.5 text-blue-600 shrink-0" />
              <span>Coordenadas</span>
            </div>
            <span className="font-mono text-slate-700 font-semibold text-[11px]">
              {stop.latitude.toFixed(5)}, {stop.longitude.toFixed(5)}
            </span>
          </div>
        </div>

        {/* Footer con acciones */}
        <DrawerFooter className="pt-2 pb-4 px-4 border-t border-slate-100 bg-white/50 flex flex-col gap-2">
          {onViewAllStops && (
            <button
              type="button"
              onClick={onViewAllStops}
              className="w-full h-10 rounded-full bg-gradient-to-r from-[#0e4dcb] via-[#1a66e5] to-[#2579f6] text-white font-semibold text-xs transition active:scale-95 cursor-pointer border-0 flex items-center justify-center gap-1.5 shadow-sm"
            >
              <ListOrdered className="size-3.5 stroke-[2.2]" />
              <span>Ver todas las paradas</span>
            </button>
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

export default TechnicianStopDetailDrawer;
