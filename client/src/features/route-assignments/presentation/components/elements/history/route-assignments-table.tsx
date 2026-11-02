"use client";

import React from "react";
import Image from "next/image";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Home,
} from "lucide-react";
import type { RouteAssignment, AssignmentStatus } from "../../../../domain/entities/route-assignment.entity";

export type RouteAssignmentsTableProps = {
  assignments: RouteAssignment[];
  onSelectAssignment?: (assignment: RouteAssignment) => void;
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function getWorkerEmail(name: string, explicitEmail?: string): string {
  if (explicitEmail) return explicitEmail;
  const clean = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, ".");
  return `${clean}@gisvisor.com`;
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

export function StatusBadge({ status }: { status: AssignmentStatus }) {
  switch (status) {
    case "COMPLETED":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border-0 shadow-none">
          <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
          <span>Completada</span>
        </span>
      );
    case "IN_PROGRESS":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border-0 shadow-none">
          <span className="inline-flex rounded-full size-2 bg-amber-500 shrink-0" />
          <span>En Proceso</span>
        </span>
      );
    case "CANCELLED":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border-0 shadow-none">
          <AlertCircle className="size-3.5 text-rose-500 shrink-0" />
          <span>Cancelada</span>
        </span>
      );
    case "PENDING":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border-0 shadow-none">
          <Clock className="size-3.5 text-slate-500 shrink-0" />
          <span>Pendiente</span>
        </span>
      );
  }
}

export function RouteAssignmentsTable({
  assignments,
}: RouteAssignmentsTableProps) {
  return (
    <div className="w-full overflow-hidden rounded-[24px] sm:rounded-[32px] bg-white border-0 shadow-none">
      <Table>
        <TableHeader className="bg-slate-50/70 border-b border-slate-100">
          <TableRow className="border-none hover:bg-transparent">
            <TableHead className="py-4 pl-6 pr-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Técnico Asignado
            </TableHead>
            <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Paradas / Casas
            </TableHead>
            <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Fecha Programada
            </TableHead>
            <TableHead className="py-4 pr-6 pl-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">
              Estado
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {assignments.map((assignment) => (
            <TableRow
              key={assignment.id}
              className="border-b border-slate-100/70 hover:bg-slate-50/50 transition-colors last:border-b-0"
            >
              {/* Técnico Asignado: Avatar + Nombre + Correo debajo */}
              <TableCell className="py-3.5 pl-6 pr-4">
                <div className="flex items-center gap-3">
                  <div className="relative size-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0 border-0 shadow-none overflow-hidden">
                    {assignment.technicianImage || assignment.workerAvatar ? (
                      <Image
                        src={assignment.technicianImage || assignment.workerAvatar!}
                        alt={assignment.workerName}
                        fill
                        sizes="40px"
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      getInitials(assignment.workerName)
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-semibold text-slate-900 truncate block">
                      {assignment.workerName}
                    </span>
                    <span className="text-xs text-slate-400 font-normal truncate block">
                      {getWorkerEmail(assignment.workerName, assignment.workerEmail)}
                    </span>
                  </div>
                </div>
              </TableCell>

              {/* Cantidad de Paradas / Casas con icono de casa */}
              <TableCell className="py-3.5 px-4 whitespace-nowrap">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100/80 text-slate-700 text-xs font-semibold">
                  <Home className="size-3.5 text-slate-500 shrink-0" />
                  <span>{assignment.totalStops} casas</span>
                </div>
              </TableCell>

              {/* Fecha Programada */}
              <TableCell className="py-3.5 px-4 whitespace-nowrap">
                <div className="inline-flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                  <Calendar className="size-3.5 text-slate-400 shrink-0" />
                  <span>{formatDate(assignment.scheduledDate)}</span>
                </div>
              </TableCell>

              {/* Estado (sin animación) */}
              <TableCell className="py-3.5 pr-6 pl-4 text-right whitespace-nowrap">
                <StatusBadge status={assignment.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
