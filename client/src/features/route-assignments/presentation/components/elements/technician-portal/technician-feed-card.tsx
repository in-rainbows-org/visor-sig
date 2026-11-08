"use client";

import React from "react";
import Image from "next/image";
import { Calendar, CheckCircle2, ChevronRight, Home, Route } from "lucide-react";
import type { TechnicianFeedItem } from "../../../../domain/entities/technician-dashboard.entity";

export type FeedTab = "ASSIGNED" | "COMPLETED";

export interface TechnicianFeedCardProps {
  item: TechnicianFeedItem;
  tab: FeedTab;
  onClick?: () => void;
  className?: string;
}

function formatDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split("-");
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    const formatted = new Intl.DateTimeFormat("es-ES", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1).replace(".", "");
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat("es-ES", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(d);
  } catch {
    return dateStr;
  }
}

function formatTime(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d
      .toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      .toUpperCase();
  } catch {
    return dateStr;
  }
}

export function TechnicianFeedCard({
  item,
  tab,
  onClick,
  className = "",
}: TechnicianFeedCardProps) {
  const isCut = item.serviceType === "CUT";
  const iconSrc = isCut
    ? "/technician-routes/servicio-corte.webp"
    : "/technician-routes/servicio-reconexion.webp";
  const serviceLabel = isCut ? "Servicio de Corte" : "Servicio de Reconexión";

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-[24px] sm:rounded-[30px] bg-white p-4 sm:p-5 border-0 shadow-none flex items-center justify-between gap-3 sm:gap-5 hover:bg-slate-50/80 transition-all duration-200 select-none ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
    >
      {/* 1. Lado Izquierdo: Ilustración 3D del servicio */}
      <div className="relative size-14 sm:size-16 md:size-18 shrink-0 flex items-center justify-center">
        <Image
          src={iconSrc}
          alt={serviceLabel}
          fill
          sizes="(max-width: 640px) 56px, (max-width: 768px) 64px, 72px"
          className="object-contain"
        />
      </div>

      {/* Línea divisoria vertical sutil */}
      <div className="w-[1.5px] h-16 sm:h-20 bg-slate-200/80 shrink-0 mx-0.5 sm:mx-1 rounded-full" />

      {/* 2. Centro: Estructura vertical (Tipo servicio superior, fecha centro, badges inferior) */}
      <div className="flex flex-col gap-1.5 sm:gap-2 min-w-0 flex-1 justify-center">
        {/* Parte superior: Tipo de servicio */}
        <div className="flex items-center gap-2">
          <h4 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
            {serviceLabel}
          </h4>
          {item.status === "IN_PROGRESS" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
              En progreso
            </span>
          )}
        </div>

        {/* Centro: Fecha agendada (Asignadas) o Finalizada + Inicio (Completadas) */}
        <div className="min-w-0">
          {tab === "COMPLETED" ? (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-600 font-medium">
              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                {item.completedAt
                  ? `Completada: ${formatDateTime(item.completedAt)}`
                  : `Completada (${formatDate(item.scheduledDate)})`}
              </span>
              {item.startedAt && (
                <span className="text-slate-400 text-[11px]">
                  • Inicio: {formatTime(item.startedAt)}
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <Calendar className="size-3.5 text-[#1a65f0] shrink-0" />
              <span>Agendada: {formatDate(item.scheduledDate)}</span>
            </div>
          )}
        </div>

        {/* Parte inferior: Badges de cantidad de casas y distancia en una sola fila */}
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] sm:text-xs font-semibold">
            <Home className="size-3 text-slate-500 shrink-0" />
            <span>{item.totalStops} casas</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] sm:text-xs font-semibold">
            <Route className="size-3 text-slate-500 shrink-0" />
            <span>{item.distanceKm.toFixed(1)} km</span>
          </span>
        </div>
      </div>

      {/* 3. Lado Derecho: Icono simple de flecha mayor que hacia la derecha */}
      <div className="shrink-0 pl-1 sm:pl-2 flex items-center justify-center">
        <ChevronRight className="size-5 sm:size-6 text-slate-300 group-hover:text-slate-600 transition-all duration-200 stroke-[2.5] group-hover:translate-x-0.5" />
      </div>
    </div>
  );
}
