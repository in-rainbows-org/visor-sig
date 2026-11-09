"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  AssignmentDetail,
  AssignmentDetailStatus,
  AssignmentStopDetail,
} from "@/features/route-assignments/domain/entities/assignment-detail.entity";
import { AssignmentDetailSummary } from "./assignment-detail-summary";
import { AssignmentDetailProgress } from "./assignment-detail-progress";
import { AssignmentDetailStopsList } from "./assignment-detail-stops-list";

export type AssignmentDetailCardProps = {
  assignment: AssignmentDetail;
  selectedStop?: AssignmentStopDetail | null;
  onSelectStop?: (stop: AssignmentStopDetail) => void;
  showBackButton?: boolean;
  backHref?: string;
  backLabel?: string;
  className?: string;
  showMetricsCards?: boolean;
  showScheduledDate?: boolean;
  twoColumnTechnicianDate?: boolean;
  headerExtra?: React.ReactNode;
  customStopsList?: React.ReactNode;
  children?: React.ReactNode;
};

function StatusBadge({ status }: { status: AssignmentDetailStatus }) {
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
    case "ASSIGNED":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border-0 shadow-none">
          <Clock className="size-3.5 text-blue-600 shrink-0" />
          <span>Asignada</span>
        </span>
      );
  }
}

export function AssignmentDetailCard({
  assignment,
  selectedStop = null,
  onSelectStop,
  showBackButton = true,
  backHref = "/asignacion-rutas",
  backLabel = "Volver a asignaciones",
  className = "",
  showMetricsCards = true,
  showScheduledDate = true,
  twoColumnTechnicianDate = false,
  headerExtra,
  customStopsList,
  children,
}: AssignmentDetailCardProps) {
  return (
    <div
      className={cn(
        "hidden lg:flex absolute lg:left-[96px] lg:w-[468px] top-[93px] bottom-4 z-[1000] pointer-events-auto flex-col bg-white rounded-2xl border-0 shadow-none overflow-hidden transition-all duration-300 select-none",
        className
      )}
    >
      <div className="flex flex-col h-full min-h-0 justify-between px-6 pt-4 pb-6 sm:pb-4 overflow-hidden">
        {/* 1. Cabecera fija superior con botón volver y título con badge */}
        <div className="pb-3 shrink-0 border-b border-slate-100/80">
          {showBackButton && (
            <Link
              href={backHref}
              className="hidden lg:inline-flex h-8 px-3 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200/80 border-0 shadow-none items-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <ArrowLeft className="size-3.5 stroke-[2.5]" />
              <span>{backLabel}</span>
            </Link>
          )}

          <div
            className={cn(
              "flex items-center justify-between gap-3",
              showBackButton ? "mt-1 lg:mt-3" : "mt-0"
            )}
          >
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              Detalle de asignación
            </h3>
            <div className="flex items-center gap-2 shrink-0">
              {headerExtra}
              <StatusBadge status={assignment.status} />
            </div>
          </div>
        </div>

        {/* 2. Todo el contenido restante debajo del título es scrolleable de manera fluida */}
        <div className="flex-1 flex flex-col min-h-0 space-y-4 overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-slate-200 pt-3 overscroll-contain">
          {/* Tarjetas de Resumen (Técnico, Fecha, Servicio, Casas, Distancia) */}
          <AssignmentDetailSummary
            technicianName={assignment.technicianName}
            technicianImage={assignment.technicianImage}
            scheduledDate={assignment.scheduledDate}
            assignmentType={assignment.assignmentType}
            totalStops={assignment.totalStops}
            totalDistanceKm={assignment.totalDistanceKm}
            status={assignment.status}
            showMetricsCards={showMetricsCards}
            showScheduledDate={showScheduledDate}
            twoColumnTechnicianDate={twoColumnTechnicianDate}
          />

          {/* Barra de Progreso */}
          <AssignmentDetailProgress
            totalStops={assignment.totalStops}
            completedStops={assignment.completedStops}
            stops={assignment.stops}
          />

          {/* Contenedor ampliado de Detalle de Paradas (scrolleable) */}
          {customStopsList ? (
            customStopsList
          ) : (
            <AssignmentDetailStopsList
              stops={assignment.stops}
              selectedStop={selectedStop}
              onSelectStop={onSelectStop}
            />
          )}

          {children}
        </div>
      </div>
    </div>
  );
}

export default AssignmentDetailCard;
