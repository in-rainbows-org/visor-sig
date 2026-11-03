"use client";

import React from "react";
import { Calendar, Home, Scissors, RefreshCw, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import type { RouteAssignmentSummary } from "../../../../domain/entities/route-assignment.entity";

export type TechnicianAssignmentCardProps = {
  assignment: RouteAssignmentSummary;
};

function formatDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split("-");
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    return new Intl.DateTimeFormat("es-ES", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function TechnicianAssignmentCard({ assignment }: TechnicianAssignmentCardProps) {
  const isCut = assignment.assignmentType === "CUT" || (assignment as unknown as { assignment_type?: string }).assignment_type === "CORTE";

  const statusConfig = (() => {
    switch (assignment.status) {
      case "COMPLETED":
        return {
          label: "Completada",
          bg: "bg-emerald-50 text-emerald-700",
          dot: "bg-emerald-500",
          icon: CheckCircle2,
        };
      case "IN_PROGRESS":
        return {
          label: "En Progreso",
          bg: "bg-blue-50 text-blue-700",
          dot: "bg-blue-500",
          icon: Clock,
        };
      case "PENDING":
      default:
        return {
          label: "Pendiente",
          bg: "bg-amber-50 text-amber-700",
          dot: "bg-amber-500",
          icon: AlertCircle,
        };
    }
  })();

  const StatusIcon = statusConfig.icon;
  const displayRouteCode = assignment.routeCode || `RUT-${assignment.id.slice(0, 6).toUpperCase()}`;

  return (
    <div className="rounded-2xl sm:rounded-3xl bg-white p-5 sm:p-6 border-0 shadow-none space-y-4 select-none hover:bg-slate-50/90 transition-all">
      {/* 1. Cabecera de la tarjeta: Código de ruta y Estado */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
            {displayRouteCode}
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border-0 ${
              isCut
                ? "bg-rose-50 text-rose-700"
                : "bg-teal-50 text-teal-700"
            }`}
          >
            {isCut ? (
              <>
                <Scissors className="size-3" />
                <span>Corte</span>
              </>
            ) : (
              <>
                <RefreshCw className="size-3" />
                <span>Reconexión</span>
              </>
            )}
          </span>
        </div>

        {/* Badge de Estado Operativo */}
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border-0 shrink-0 ${statusConfig.bg}`}
        >
          <span className={`size-1.5 rounded-full ${statusConfig.dot}`} />
          <span>{statusConfig.label}</span>
        </span>
      </div>

      {/* 2. Información Operativa: Casas/Paradas y Fecha */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100/90 text-xs">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100/80 text-slate-800 font-semibold">
          <Home className="size-4 text-slate-500 shrink-0" />
          <span>
            {assignment.totalStops} {assignment.totalStops === 1 ? "casa asignada" : "casas asignadas"}
          </span>
        </div>

        <div className="inline-flex items-center gap-1.5 text-slate-500 font-medium">
          <Calendar className="size-3.5 text-slate-400 shrink-0" />
          <span>{formatDate(assignment.scheduledDate)}</span>
        </div>
      </div>
    </div>
  );
}
