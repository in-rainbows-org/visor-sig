"use client";

import React from "react";
import { Calendar, Home } from "lucide-react";
import type { RouteAssignment } from "../../../../domain/entities/route-assignment.entity";
import { StatusBadge, getWorkerEmail } from "./route-assignments-table";

export type RouteAssignmentCardProps = {
  assignment: RouteAssignment;
  onSelect?: (assignment: RouteAssignment) => void;
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function formatDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split("-");
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function RouteAssignmentCard({
  assignment,
}: RouteAssignmentCardProps) {
  const email = getWorkerEmail(assignment.workerName, assignment.workerEmail);

  return (
    <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-5 border-0 shadow-none space-y-3.5 select-none hover:bg-white/95 transition-all">
      {/* Cabecera: Avatar del Técnico + Nombre + Correo debajo + Estado */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 border-0 shadow-none">
            {getInitials(assignment.workerName)}
          </div>
          <div className="min-w-0">
            <span className="text-sm font-semibold text-slate-900 truncate block">
              {assignment.workerName}
            </span>
            <span className="text-xs text-slate-400 font-normal truncate block">
              {email}
            </span>
          </div>
        </div>
        <StatusBadge status={assignment.status} />
      </div>

      {/* Contenido: Paradas/Casas con icono Home y Fecha Programada */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100/80">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/80 text-slate-700 text-xs font-semibold">
          <Home className="size-3.5 text-slate-500 shrink-0" />
          <span>{assignment.totalStops} casas</span>
        </div>

        <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Calendar className="size-3.5 text-slate-400 shrink-0" />
          <span>{formatDate(assignment.scheduledDate)}</span>
        </div>
      </div>
    </div>
  );
}
