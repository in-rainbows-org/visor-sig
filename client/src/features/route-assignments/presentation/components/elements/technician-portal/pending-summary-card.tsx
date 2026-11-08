"use client";

import React from "react";
import Image from "next/image";
import type { PendingAssignmentsSummary } from "../../../../domain/entities/technician-dashboard.entity";

export interface PendingSummaryCardProps {
  summary: PendingAssignmentsSummary;
  className?: string;
}

export function PendingSummaryCard({
  summary,
  className = "",
}: PendingSummaryCardProps) {
  return (
    <div
      className={`rounded-[28px] sm:rounded-[36px] bg-white p-5 sm:p-7 md:p-8 border-0 shadow-none flex items-center justify-between gap-3 sm:gap-4 select-none ${className}`}
    >
      {/* Columna Izquierda: Protegida con shrink-0 para que la imagen no comprima su contenido */}
      <div className="flex flex-col justify-center shrink-0">
        <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 tracking-tight leading-[1.15]">
          Asignaciones
          <br />
          pendientes
        </h3>

        <div className="text-5xl sm:text-6xl md:text-7xl font-black text-[#0a1224] tracking-tight leading-none my-2 sm:my-3">
          {summary.totalPending}
        </div>

        <div>
          <span className="inline-flex items-center px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-[#e3efff] text-[#1862f1] text-xs sm:text-sm font-semibold border-0">
            {summary.todayCount} para hoy
          </span>
        </div>
      </div>

      {/* Columna Derecha: Ilustración 3D de mayor escala que aprovecha el espacio disponible */}
      <div className="relative w-32 h-32 sm:w-42 sm:h-42 md:w-48 md:h-48 lg:w-52 lg:h-52 shrink-0 drop-shadow-sm ml-auto">
        <Image
          src="/technician-routes/pending-assignment.webp"
          alt="Ilustración de asignaciones pendientes"
          fill
          sizes="(max-width: 640px) 128px, (max-width: 768px) 168px, 208px"
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
}
