"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { AssignmentDetail } from "@/features/route-assignments/domain/entities/assignment-detail.entity";

export interface AssignmentDetailScheduleCardProps {
  assignment: AssignmentDetail;
  className?: string;
}

function formatSummaryDate(dateStr: string | null): string {
  if (!dateStr) return "Sin fecha";
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

interface ScheduleItemProps {
  label: string;
  value: string;
  imageSrc?: string;
  className?: string;
}

function ScheduleItem({
  label,
  value,
  imageSrc = "/assignment-route/fecha.webp",
  className = "",
}: ScheduleItemProps) {
  return (
    <div
      className={cn(
        "bg-slate-100/80 rounded-2xl px-3.5 py-2.5 flex items-center gap-2.5 border-0 shadow-none shrink-0 min-h-[58px]",
        className
      )}
    >
      <div className="relative size-9 sm:size-10 shrink-0 flex items-center justify-center">
        <Image
          src={imageSrc}
          alt={label}
          fill
          sizes="40px"
          priority
          unoptimized
          className="object-contain pointer-events-none"
        />
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block leading-tight">
          {label}
        </span>
        <h4 className="text-xs sm:text-[13px] font-bold text-slate-900 leading-tight mt-0.5 truncate font-mono">
          {value}
        </h4>
      </div>
    </div>
  );
}

export function AssignmentDetailScheduleCard({
  assignment,
  className = "",
}: AssignmentDetailScheduleCardProps) {
  return (
    <div
      className={cn(
        "hidden lg:flex absolute top-[93px] right-6 z-[1000] pointer-events-auto select-none bg-white rounded-3xl p-3 border-0 shadow-none items-center gap-2.5",
        className
      )}
    >
      {/* 1. Fecha Programada */}
      <ScheduleItem
        label="Fecha programada"
        value={formatSummaryDate(assignment.scheduledDate)}
      />

      {/* 2. Hora de Inicio de Ruta */}
      <ScheduleItem
        label="Inicio de ruta"
        value={formatTime(assignment.startedAt)}
      />

      {/* 3. Hora de Fin de Ruta */}
      <ScheduleItem
        label="Fin de ruta"
        value={formatTime(assignment.completedAt)}
      />
    </div>
  );
}

export default AssignmentDetailScheduleCard;
