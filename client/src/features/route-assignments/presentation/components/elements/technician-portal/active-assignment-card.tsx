"use client";

import React from "react";
import Image from "next/image";
import { ArrowRight, CalendarClock } from "lucide-react";
import type { ActiveAssignmentProgress } from "../../../../domain/entities/technician-dashboard.entity";

export interface ActiveAssignmentCardProps {
  assignment?: ActiveAssignmentProgress | null;
  onNavigate?: (assignmentId: string) => void;
  className?: string;
}

function formatStartedAt(dateStr?: string | null): string {
  if (!dateStr) return "Sin fecha registrada";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const months = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];
    const month = months[d.getMonth()];
    const time = d
      .toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      .toUpperCase();
    return `${day} de ${month}, ${time}`;
  } catch {
    return dateStr;
  }
}

export function ActiveAssignmentCard({
  assignment,
  onNavigate,
  className = "",
}: ActiveAssignmentCardProps) {
  if (!assignment) {
    return null;
  }

  const isCut = assignment.serviceType === "CUT";
  const serviceLabel = isCut ? "Servicio de Corte" : "Servicio de Reconexión";

  const handleAction = () => {
    if (onNavigate) {
      onNavigate(assignment.id);
    } else if (assignment.targetUrl) {
      window.location.href = assignment.targetUrl;
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-[28px] sm:rounded-[36px] bg-gradient-to-r from-[#1862f1] via-[#2075f5] to-[#3487f8] text-white p-3.5 sm:p-5 md:p-5.5 shadow-md shadow-blue-500/10 select-none flex items-center justify-between gap-3 sm:gap-4 ${className}`}
    >
      {/* Resplandor sutil decorativo */}
      <div className="absolute -right-8 -top-8 size-40 rounded-full bg-white/10 blur-xl pointer-events-none" />

      {/* Lado izquierdo: Columna de imagen + Línea divisoria + Información esencial (delgada y compacta) */}
      <div className="flex items-center gap-3 sm:gap-4 md:gap-5 min-w-0 flex-1 z-10">
        {/* Ilustración 3D del mapa con pines */}
        <div className="relative size-18 sm:size-22 md:size-24 shrink-0 drop-shadow-md">
          <Image
            src="/technician-routes/in-progress.webp"
            alt="Asignación en progreso"
            fill
            sizes="(max-width: 640px) 72px, (max-width: 768px) 88px, 96px"
            className="object-contain"
            priority
          />
        </div>

        {/* Línea divisoria vertical más gruesa y proporcionada */}
        <div className="w-[2px] sm:w-[2.5px] h-14 sm:h-16 bg-white/45 shrink-0 rounded-full" />

        {/* Bloque central de texto: únicamente badge, tipo de servicio y fecha/hora */}
        <div className="space-y-1 min-w-0 flex-1">
          {/* Badge "En progreso" con play icon */}
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#dbeafe] text-[#1e40af] text-[11px] sm:text-xs font-bold shadow-none">
              <span className="text-[9px]">▶</span>
              <span>En progreso</span>
            </span>
          </div>

          {/* Titular del servicio (sin truncate para que haga wrap natural si es necesario) */}
          <h3 className="text-base sm:text-lg md:text-xl font-black text-white tracking-tight leading-[1.15] break-words">
            {serviceLabel}
          </h3>

          {/* Fecha y hora de inicio con icono */}
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-blue-100 font-medium leading-tight">
            <CalendarClock className="size-3.5 text-blue-200 shrink-0" />
            <span>{formatStartedAt(assignment.startedAt)}</span>
          </div>
        </div>
      </div>

      {/* Lado derecho: Botón circular plano sin sombra */}
      <div className="z-10 shrink-0 pl-1 sm:pl-2">
        <button
          type="button"
          onClick={handleAction}
          aria-label="Ir a la asignación en progreso"
          className="group relative size-11 sm:size-12 rounded-full bg-white text-[#1862f1] shadow-none border-0 flex items-center justify-center transition-all duration-200 hover:bg-blue-50 hover:scale-105 active:scale-95 cursor-pointer"
        >
          <ArrowRight className="size-5 sm:size-6 text-[#1862f1] stroke-[2.5] transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}
