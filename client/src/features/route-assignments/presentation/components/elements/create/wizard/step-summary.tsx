"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { ArrowLeft, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouteCreationWizard } from "@/features/route-assignments/presentation/state/route-creation-wizard-store";
import { FIXED_CODE_STATUSES, type FixedCodeStatusValue } from "@/features/map/domain/entities/fixed-code-status.entity";
import type { RouteCartStop, RouteStartingPoint } from "@/features/route-assignments/domain/entities/route-wizard.entity";
import { SlideConfirm } from "@/components/ui/slide-confirm";

const badgeColors: Record<number, { bg: string; dot: string }> = {
  1: { bg: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  2: { bg: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  3: { bg: "bg-rose-50 text-rose-700", dot: "bg-rose-500" },
  4: { bg: "bg-orange-50 text-orange-700", dot: "bg-orange-500" },
  5: { bg: "bg-slate-100 text-slate-700", dot: "bg-slate-400" },
};

const getStatusBadge = (statusValue: number) => {
  const def = FIXED_CODE_STATUSES[statusValue as FixedCodeStatusValue];
  const conf = badgeColors[statusValue] ?? {
    bg: "bg-slate-100 text-slate-700",
    dot: "bg-slate-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border-0 shadow-none ${conf.bg}`}
    >
      <span className={`size-1.5 rounded-full ${conf.dot} shrink-0`} />
      <span>{def?.label ?? `Estado ${statusValue}`}</span>
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

function formatSummaryDate(dateStr: string | null): string {
  if (!dateStr) return "Sin fecha asignada";
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
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

export function StepSummary() {
  const {
    scheduledDate,
    serviceType,
    selectedTechnician,
    startingPoint,
    cartStops,
    calculatedRoute,
    isSaving,
    saveAssignment,
    prevStep,
  } = useRouteCreationWizard();

  const totalDistanceKm = useMemo(() => {
    if (calculatedRoute?.totalDistanceKm !== undefined) {
      return calculatedRoute.totalDistanceKm;
    }
    return calculateTotalDistanceKm(startingPoint, cartStops);
  }, [calculatedRoute, startingPoint, cartStops]);

  return (
    <div className="flex flex-col h-full min-h-0 justify-between select-none px-6 pt-4 pb-6 sm:pb-4">
      {/* 1. Botón superior para volver al paso anterior y Título */}
      <div className="pb-2 shrink-0">
        <button
          type="button"
          onClick={prevStep}
          disabled={isSaving}
          className="h-8 px-3 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200/80 border-0 shadow-none inline-flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50 cursor-pointer"
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
        {/* Card 1: Técnico Responsable */}
        <div className="w-full bg-gradient-to-r from-[#0e4dcb] via-[#1a66e5] to-[#2579f6] text-white rounded-3xl p-3.5 flex items-center gap-3 border-0 shadow-none shrink-0">
          <div className="relative size-11 rounded-full overflow-hidden bg-white/20 shrink-0 ring-2 ring-white/30">
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
              <div className="size-full flex items-center justify-center text-white">
                <User className="size-5" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-100 block">
              Técnico asignado
            </span>
            <h4 className="text-sm font-bold text-white truncate">
              {selectedTechnician?.name ?? "Técnico no asignado"}
            </h4>
          </div>
        </div>

        {/* Card: Fecha de asignación */}
        <div className="w-full bg-[#ebf3ff] rounded-3xl p-3 sm:p-3.5 flex items-center border-0 shadow-none shrink-0 gap-3">
          <div className="relative w-12 sm:w-14 h-10 sm:h-11 shrink-0 flex items-center justify-center">
            <Image
              src="/assignment-route/fecha.webp"
              alt="Fecha programada"
              fill
              sizes="56px"
              priority
              unoptimized
              className="object-contain pointer-events-none"
            />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">
              Fecha programada
            </span>
            <h4 className="text-sm font-bold text-slate-900 truncate">
              {formatSummaryDate(scheduledDate)}
            </h4>
          </div>
        </div>

        {/* Card: Tipo de Servicio (Leve rojito para Corte, Leve verdoso para Reconexión) */}
        <div
          className={cn(
            "w-full rounded-3xl p-3 sm:p-3.5 flex items-center border-0 shadow-none shrink-0 gap-3 transition-colors",
            serviceType === "CUT" ? "bg-[#fef2f2]" : "bg-[#f0fdf4]"
          )}
        >
          <div className="relative w-14 sm:w-16 h-12 shrink-0 flex items-center justify-center">
            <Image
              src={
                serviceType === "CUT"
                  ? "/assignment-route/corte.webp"
                  : "/assignment-route/reconexion.webp"
              }
              alt={serviceType === "CUT" ? "Corte de servicio" : "Reconexión de servicio"}
              fill
              sizes="64px"
              priority
              unoptimized
              className="object-contain pointer-events-none"
            />
          </div>
          <div className="min-w-0 flex-1">
            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-wider block",
                serviceType === "CUT" ? "text-rose-700" : "text-emerald-700"
              )}
            >
              Tipo de servicio
            </span>
            <h4
              className={cn(
                "text-sm font-bold truncate",
                serviceType === "CUT" ? "text-rose-950" : "text-emerald-950"
              )}
            >
              {serviceType === "CUT" ? "Corte de servicio" : "Reconexión de servicio"}
            </h4>
          </div>
        </div>

        {/* Métricas: Dos cards independientes (Casas y Distancia) */}
        <div className="grid grid-cols-2 gap-2 sm:gap-2.5 shrink-0">
          {/* Card: Casas seleccionadas */}
          <div className="bg-[#ebf3ff] rounded-3xl p-2.5 sm:p-3 flex items-center border-0 shadow-none gap-2 sm:gap-2.5 min-w-0">
            <div className="relative w-10 sm:w-11 h-9 sm:h-10 shrink-0 flex items-center justify-center">
              <Image
                src="/assignment-route/casas.webp"
                alt="Casas seleccionadas"
                fill
                sizes="(max-width: 640px) 40px, 48px"
                priority
                unoptimized
                className="object-contain pointer-events-none"
              />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block leading-tight">
                Casas
              </span>
              <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-tight mt-0.5 break-words">
                {cartStops.length} {cartStops.length === 1 ? "casa" : "casas"}
              </h4>
            </div>
          </div>

          {/* Card: Distancia en kilómetros */}
          <div className="bg-[#f5f3ff] rounded-3xl p-2.5 sm:p-3 flex items-center border-0 shadow-none gap-2 sm:gap-2.5 min-w-0">
            <div className="relative w-10 sm:w-11 h-9 sm:h-10 shrink-0 flex items-center justify-center">
              <Image
                src="/assignment-route/distancia.webp"
                alt="Distancia en kilómetros"
                fill
                sizes="(max-width: 640px) 40px, 48px"
                priority
                unoptimized
                className="object-contain pointer-events-none"
              />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700/80 block leading-tight">
                Distancia
              </span>
              <h4 className="text-sm sm:text-base font-bold text-purple-950 leading-tight mt-0.5 break-words">
                {totalDistanceKm} km
              </h4>
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
                className="w-full bg-slate-100/90 rounded-2xl p-2.5 sm:p-3 flex items-center gap-4 border-0 shadow-none"
              >
                {/* Badge número */}
                <div className="size-6 rounded-full bg-[#0e4dcb] text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                  {stop.orderIndex}
                </div>

                {/* Info casa */}
                <div className="min-w-0 flex-1 space-y-1">
                  <span className="text-xs font-bold text-slate-900 font-mono block">
                    #{stop.fixedCode}
                  </span>
                  <p className="text-[11px] text-slate-600 truncate font-medium">
                    {stop.name || "Sin titular registrado"}
                  </p>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] sm:text-[11px] font-medium text-slate-500">
                      Estado actual:
                    </span>
                    {getStatusBadge(stop.status)}
                  </div>
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
          confirmedText={isSaving ? "Guardando en el servidor..." : "Asignación confirmada"}
          disabled={isSaving}
          variant="emerald"
          height={48}
          className="w-full"
        />
      </div>
    </div>
  );
}

export default StepSummary;
