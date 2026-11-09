"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AssignmentDetail } from "@/features/route-assignments/domain/entities/assignment-detail.entity";
import { AssignmentDetailProgress } from "./assignment-detail-progress";

export interface AssignmentDetailMobileHeaderProps {
  assignment: AssignmentDetail;
  headerExtra?: React.ReactNode;
  className?: string;
}

function formatSummaryDate(dateStr: string | null): string {
  if (!dateStr) return "Sin fecha asignada";
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    const formatted = new Intl.DateTimeFormat("es-BO", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  } catch {
    return dateStr;
  }
}

function formatTime(date: Date | string | null | undefined): string {
  if (!date) return "--:--";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "--:--";
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  } catch {
    return "--:--";
  }
}

function AssignmentStatusBadge({ status }: { status: AssignmentDetail["status"] }) {
  switch (status) {
    case "COMPLETED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border-0 shadow-none shrink-0">
          <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span>Completada</span>
        </span>
      );
    case "IN_PROGRESS":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border-0 shadow-none shrink-0">
          <span className="size-1.5 rounded-full bg-amber-500 shrink-0" />
          <span>En Proceso</span>
        </span>
      );
    case "CANCELLED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border-0 shadow-none shrink-0">
          <span className="size-1.5 rounded-full bg-rose-500 shrink-0" />
          <span>Cancelada</span>
        </span>
      );
    case "ASSIGNED":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border-0 shadow-none shrink-0">
          <span className="size-1.5 rounded-full bg-slate-400 shrink-0" />
          <span>Pendiente</span>
        </span>
      );
  }
}

export function AssignmentDetailMobileHeader({
  assignment,
  headerExtra,
  className = "",
}: AssignmentDetailMobileHeaderProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-3xl p-3.5 sm:p-4 border-0 shadow-none space-y-3 select-none pointer-events-auto",
        className
      )}
    >
      {/* 1. Fila superior: Botón volver y Badge de estatus alineado a la derecha */}
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/asignacion-rutas"
          className="inline-flex items-center gap-1 h-8 px-3 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border-0 shadow-none transition active:scale-95 cursor-pointer shrink-0"
        >
          <ChevronLeft className="size-4 stroke-[2.5]" />
          <span>Volver a asignaciones</span>
        </Link>

        <div className="flex items-center gap-2 shrink-0">
          {headerExtra}
          <AssignmentStatusBadge status={assignment.status} />
        </div>
      </div>

      {/* 2. Sección de Fechas y Horas */}
      <div className="space-y-2 pt-0.5">
        {/* Fecha programada: ancho completo */}
        <div className="bg-slate-100/80 rounded-2xl p-2.5 flex items-center gap-2.5 border-0 shadow-none">
          <div className="relative size-9 shrink-0 flex items-center justify-center">
            <Image
              src="/assignment-route/fecha.webp"
              alt="Fecha programada"
              fill
              sizes="36px"
              priority
              unoptimized
              className="object-contain pointer-events-none"
            />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block leading-tight">
              Fecha programada
            </span>
            <h4 className="text-xs sm:text-[13px] font-bold text-slate-900 leading-tight mt-0.5 truncate">
              {formatSummaryDate(assignment.scheduledDate)}
            </h4>
          </div>
        </div>

        {/* Inicio y Fin de ruta: 2 columnas lado a lado */}
        <div className="grid grid-cols-2 gap-2">
          {/* Inicio de ruta */}
          <div className="bg-slate-100/80 rounded-2xl p-2.5 flex items-center gap-2 border-0 shadow-none">
            <div className="relative size-8 shrink-0 flex items-center justify-center">
              <Image
                src="/assignment-route/fecha.webp"
                alt="Inicio de ruta"
                fill
                sizes="32px"
                priority
                unoptimized
                className="object-contain pointer-events-none"
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-500 block leading-tight truncate">
                Inicio de ruta
              </span>
              <h4 className="text-xs sm:text-[13px] font-bold text-slate-900 leading-tight mt-0.5 font-mono truncate">
                {formatTime(assignment.startedAt)}
              </h4>
            </div>
          </div>

          {/* Fin de ruta */}
          <div className="bg-slate-100/80 rounded-2xl p-2.5 flex items-center gap-2 border-0 shadow-none">
            <div className="relative size-8 shrink-0 flex items-center justify-center">
              <Image
                src="/assignment-route/fecha.webp"
                alt="Fin de ruta"
                fill
                sizes="32px"
                priority
                unoptimized
                className="object-contain pointer-events-none"
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-500 block leading-tight truncate">
                Fin de ruta
              </span>
              <h4 className="text-xs sm:text-[13px] font-bold text-slate-900 leading-tight mt-0.5 font-mono truncate">
                {formatTime(assignment.completedAt)}
              </h4>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Sección de progreso de la asignación (idéntica a escritorio) */}
      <AssignmentDetailProgress
        totalStops={assignment.totalStops}
        stops={assignment.stops}
        completedStops={assignment.completedStops}
        title="Progreso de asignación"
        className="px-1 pt-0.5"
      />
    </div>
  );
}

export default AssignmentDetailMobileHeader;
