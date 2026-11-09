"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AssignmentDetail } from "@/features/route-assignments/domain/entities/assignment-detail.entity";
import { AssignmentDetailProgress } from "../detail/assignment-detail-progress";

export interface TechnicianAssignmentMobileHeaderProps {
  assignment: AssignmentDetail;
  className?: string;
}

function formatStartTime(date: Date | string | null | undefined): string {
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
          <span>En proceso</span>
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

export function TechnicianAssignmentMobileHeader({
  assignment,
  className = "",
}: TechnicianAssignmentMobileHeaderProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isCut = assignment.assignmentType === "CUT";

  return (
    <div
      className={cn(
        "bg-white rounded-3xl p-3.5 sm:p-4 border-0 shadow-none space-y-3.5 select-none pointer-events-auto transition-all duration-300 ease-in-out",
        isCollapsed && "space-y-2 pb-3.5",
        className
      )}
    >
      {/* 1. Fila superior: Botón volver, Badge de estatus y Botón para compactar/expandir */}
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/mis-asignaciones"
          className="inline-flex items-center gap-1 h-8 px-2.5 sm:px-3 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border-0 shadow-none transition active:scale-95 cursor-pointer shrink-0"
        >
          <ChevronLeft className="size-4 stroke-[2.5] shrink-0" />
          <span className="truncate">Volver</span>
          <span className="hidden min-[390px]:inline">a mis asignaciones</span>
        </Link>

        {/* Grupo derecho: Estado + Botón touch de compactar/desplegar */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <AssignmentStatusBadge status={assignment.status} />

          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="size-8 sm:size-8.5 rounded-full bg-slate-100 hover:bg-slate-200 active:bg-slate-300 active:scale-95 flex items-center justify-center transition-all cursor-pointer text-slate-600 hover:text-slate-900 border-0 shadow-none touch-manipulation"
            aria-label={isCollapsed ? "Desplegar información de cabecera" : "Compactar cabecera"}
            title={isCollapsed ? "Desplegar información" : "Compactar información"}
          >
            <ChevronDown
              className={cn(
                "size-4 sm:size-4.5 stroke-[2.5] transition-transform duration-300 ease-out",
                !isCollapsed ? "rotate-180" : "rotate-0"
              )}
            />
          </button>
        </div>
      </div>

      {/* 2. Fila con dos columnas: Tipo de servicio e Inicio de ruta (colapsable de forma suave) */}
      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          isCollapsed
            ? "grid-rows-[0fr] opacity-0 pointer-events-none -mt-1 sm:-mt-1.5"
            : "grid-rows-[1fr] opacity-100"
        )}
      >
        <div className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 pt-0.5 px-2.5 pb-0.5">
            {/* Columna Izquierda: Imagen y Tipo de servicio */}
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="relative size-10 shrink-0 flex items-center justify-center">
                <Image
                  src={isCut ? "/assignment-route/corte.webp" : "/assignment-route/reconexion.webp"}
                  alt={isCut ? "Corte" : "Reconexión"}
                  fill
                  sizes="40px"
                  priority
                  unoptimized
                  className="object-contain pointer-events-none"
                />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block leading-tight">
                  Tipo de servicio
                </span>
                <h4 className="text-sm font-bold text-slate-900 leading-tight mt-0.5 truncate">
                  {isCut ? "Corte" : "Reconexión"}
                </h4>
              </div>
            </div>

            {/* Divisor vertical */}
            <div className="h-8 w-px bg-slate-200/80 shrink-0" />

            {/* Columna Derecha: Inicio de ruta */}
            <div className="min-w-0 flex-1 pl-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block leading-tight">
                Inicio de ruta
              </span>
              <h4 className="text-sm font-bold text-slate-900 font-mono leading-tight mt-0.5 truncate">
                {formatStartTime(assignment.startedAt)}
              </h4>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Sección de progreso de la asignación */}
      <AssignmentDetailProgress
        totalStops={assignment.totalStops}
        stops={assignment.stops}
        completedStops={assignment.completedStops}
        title="Progreso de asignación"
        className={cn(
          "px-2.5 transition-all duration-300",
          isCollapsed ? "pt-0 space-y-1.5" : "pt-0.5 space-y-2"
        )}
      />
    </div>
  );
}

export default TechnicianAssignmentMobileHeader;
