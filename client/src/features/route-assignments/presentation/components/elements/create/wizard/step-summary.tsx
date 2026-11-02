"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { ArrowLeft, Home, Route, User } from "lucide-react";
import { useRouteCreationWizard } from "@/features/route-assignments/presentation/state/route-creation-wizard-store";
import { FIXED_CODE_STATUSES, type FixedCodeStatusValue } from "@/features/map/domain/entities/fixed-code-status.entity";
import type { RouteCartStop, RouteStartingPoint } from "@/features/route-assignments/domain/entities/route-wizard.entity";
import { SlideConfirm } from "@/components/ui/slide-confirm";

const getStatusBadge = (statusValue: number) => {
  const def = FIXED_CODE_STATUSES[statusValue as FixedCodeStatusValue];
  if (!def) {
    return (
      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
        Estado {statusValue}
      </span>
    );
  }

  const badgeColors: Record<number, string> = {
    1: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    2: "bg-amber-50 text-amber-700 border-amber-200/60",
    3: "bg-rose-50 text-rose-700 border-rose-200/60",
    4: "bg-orange-50 text-orange-700 border-orange-200/60",
    5: "bg-slate-100 text-slate-700 border-slate-200/60",
  };

  return (
    <span
      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
        badgeColors[statusValue] ?? "bg-slate-100 text-slate-700"
      }`}
    >
      {def.label}
    </span>
  );
};

function calculateTotalDistanceKm(
  start: RouteStartingPoint | null,
  stops: RouteCartStop[]
): number {
  if (!start || stops.length === 0) return 0;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radio terrestre en km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  let dist = 0;
  let curLat = start.latitude;
  let curLon = start.longitude;

  for (const s of stops) {
    if (s.latitude && s.longitude) {
      dist += haversine(curLat, curLon, s.latitude, s.longitude);
      curLat = s.latitude;
      curLon = s.longitude;
    }
  }

  return Math.round(dist * 10) / 10;
}

export function StepSummary() {
  const {
    selectedTechnician,
    startingPoint,
    cartStops,
    saveAssignment,
    prevStep,
  } = useRouteCreationWizard();

  const totalDistanceKm = useMemo(
    () => calculateTotalDistanceKm(startingPoint, cartStops),
    [startingPoint, cartStops]
  );

  return (
    <div className="flex flex-col h-full min-h-0 justify-between select-none px-6 pt-4 pb-6 sm:pb-4">
      {/* 1. Botón superior para volver al paso anterior y Título */}
      <div className="pb-2 shrink-0">
        <button
          type="button"
          onClick={prevStep}
          className="h-8 px-3 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200/80 border-0 shadow-none inline-flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="size-3.5 stroke-[2.5]" />
          <span>Volver a paradas</span>
        </button>
        <h3 className="text-xl font-bold text-slate-900 tracking-tight mt-2.5">
          Resumen de asignación
        </h3>
      </div>

      {/* 2. Cuerpo del resumen */}
      <div className="flex-1 flex flex-col min-h-0 space-y-3 overflow-y-auto">
        {/* Card 1: Técnico Responsable (Tono celeste suave y redondeado) */}
        <div className="w-full bg-[#ebf3ff] rounded-3xl p-3.5 flex items-center gap-3 border-0 shadow-none shrink-0">
          <div className="relative size-11 rounded-full overflow-hidden bg-blue-100 shrink-0">
            {selectedTechnician?.avatarUrl ? (
              <Image
                src={selectedTechnician.avatarUrl}
                alt={selectedTechnician.name}
                fill
                sizes="44px"
                unoptimized
                className="object-cover"
              />
            ) : (
              <div className="size-full flex items-center justify-center text-blue-500">
                <User className="size-5" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
              Técnico
            </span>
            <h4 className="text-sm font-bold text-slate-900 truncate">
              {selectedTechnician?.name ?? "Técnico no asignado"}
            </h4>
          </div>
        </div>

        {/* Card 2: Métricas con Iconos y Tono Celeste Suave */}
        <div className="w-full bg-[#ebf3ff] rounded-3xl p-3.5 grid grid-cols-2 gap-2 border-0 shadow-none divide-x divide-blue-200/60 shrink-0">
          <div className="flex flex-col items-center justify-center text-center px-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Casas seleccionadas
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Home className="size-4 text-slate-700 stroke-[2.2]" />
              <span className="text-xl font-bold text-slate-900">
                {cartStops.length}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center text-center px-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
              Distancia en kilómetros
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Route className="size-4 text-slate-700 stroke-[2.2]" />
              <span className="text-xl font-bold text-slate-900">
                {totalDistanceKm} km
              </span>
            </div>
          </div>
        </div>

        {/* Listado de Casas Seleccionadas (solo lectura) */}
        <div className="flex-1 flex flex-col min-h-0 pt-1">
          <h5 className="text-xs font-bold text-slate-700 tracking-tight px-1 mb-2 shrink-0">
            Casas seleccionadas
          </h5>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-slate-200">
            {cartStops.map((stop) => (
              <div
                key={stop.id}
                className="w-full bg-slate-100/90 rounded-2xl p-2.5 flex items-center gap-2.5 border-0 shadow-none"
              >
                {/* Badge número */}
                <div className="size-6 rounded-full bg-[#0e4dcb] text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                  {stop.orderIndex}
                </div>

                {/* Info casa */}
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-900">
                      #{stop.fixedCode}
                    </span>
                    {getStatusBadge(stop.status)}
                  </div>
                  <p className="text-[11px] text-slate-600 truncate font-medium">
                    {stop.name || "Sin titular registrado"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Slide to Confirm ocupando el Full Width */}
      <div className="pt-3 pb-2 border-t border-slate-100 bg-white shrink-0">
        <SlideConfirm
          onConfirm={saveAssignment}
          text="Desliza para confirmar"
          confirmedText="Asignación confirmada"
          variant="emerald"
          height={48}
          className="w-full"
        />
      </div>
    </div>
  );
}

export default StepSummary;
