"use client";

import React from "react";
import Image from "next/image";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  AssignmentDetailStatus,
  AssignmentDetailType,
} from "@/features/route-assignments/domain/entities/assignment-detail.entity";

export type AssignmentDetailSummaryProps = {
  technicianName: string | null;
  technicianImage: string | null;
  scheduledDate: string;
  assignmentType: AssignmentDetailType;
  totalStops: number;
  totalDistanceKm: number;
  status: AssignmentDetailStatus;
  showMetricsCards?: boolean;
};

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

export function AssignmentDetailSummary({
  technicianName,
  technicianImage,
  scheduledDate,
  assignmentType,
  totalStops,
  totalDistanceKm,
  showMetricsCards = true,
}: AssignmentDetailSummaryProps) {
  const isCut = assignmentType === "CUT";

  return (
    <div className="space-y-3 shrink-0">
      {/* 1. Card Técnico Responsable (degradado azul oficial del wizard) */}
      <div className="w-full bg-gradient-to-r from-[#0e4dcb] via-[#1a66e5] to-[#2579f6] text-white rounded-3xl p-3.5 flex items-center gap-3 border-0 shadow-none shrink-0">
        <div className="relative size-11 rounded-full overflow-hidden bg-white/20 shrink-0 ring-2 ring-white/30">
          {technicianImage ? (
            <Image
              src={technicianImage}
              alt={technicianName || "Técnico"}
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
            {technicianName ?? "Técnico no asignado"}
          </h4>
        </div>
      </div>

      {/* 2. Card: Fecha de asignación */}
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

      {/* 3. Card: Tipo de Servicio */}
      <div
        className={cn(
          "w-full rounded-3xl p-3 sm:p-3.5 flex items-center border-0 shadow-none shrink-0 gap-3 transition-colors",
          isCut ? "bg-[#fef2f2]" : "bg-[#f0fdf4]"
        )}
      >
        <div className="relative w-14 sm:w-16 h-12 shrink-0 flex items-center justify-center">
          <Image
            src={isCut ? "/assignment-route/corte.webp" : "/assignment-route/reconexion.webp"}
            alt={isCut ? "Corte de servicio" : "Reconexión de servicio"}
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
              isCut ? "text-rose-700" : "text-emerald-700"
            )}
          >
            Tipo de servicio
          </span>
          <h4
            className={cn(
              "text-sm font-bold truncate",
              isCut ? "text-rose-950" : "text-emerald-950"
            )}
          >
            {isCut ? "Corte de servicio" : "Reconexión de servicio"}
          </h4>
        </div>
      </div>

      {/* 4. Métricas: Dos cards en grid de 2 columnas (Casas y Distancia) */}
      {showMetricsCards && (
        <div className="grid grid-cols-2 gap-2 sm:gap-2.5 shrink-0">
          {/* Card Casas */}
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
                {totalStops} {totalStops === 1 ? "casa" : "casas"}
              </h4>
            </div>
          </div>

          {/* Card Distancia */}
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
      )}
    </div>
  );
}

export default AssignmentDetailSummary;
