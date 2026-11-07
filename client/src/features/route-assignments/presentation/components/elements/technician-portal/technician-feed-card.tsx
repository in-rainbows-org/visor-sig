"use client";

import React from "react";
import Image from "next/image";
import { Calendar, Check, Home, Route } from "lucide-react";
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
    }).format(d);
    // Capitalizar la primera letra: "mar, 3 nov" -> "Mar, 3 nov"
    return formatted.charAt(0).toUpperCase() + formatted.slice(1).replace(".", "");
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

  return (
    <div
      onClick={onClick}
      className={`rounded-[24px] sm:rounded-[30px] bg-white p-4 sm:p-5.5 border-0 shadow-[0_2px_8px_rgba(15,23,42,0.04)] flex items-center justify-between gap-3 sm:gap-5 hover:bg-slate-50/80 hover:shadow-[0_4px_16px_rgba(15,23,42,0.06)] transition-all duration-200 select-none ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
    >
      {/* Columna Izquierda: Ilustración 3D del servicio */}
      <div className="relative size-14 sm:size-16 md:size-18 shrink-0 drop-shadow-sm flex items-center justify-center">
        <Image
          src={iconSrc}
          alt={isCut ? "Corte de servicio" : "Reconexión de servicio"}
          fill
          sizes="(max-width: 640px) 56px, (max-width: 768px) 64px, 72px"
          className="object-contain"
        />
      </div>

      {/* Línea divisoria vertical (Pipe) */}
      <div className="w-[1.5px] h-18 sm:h-22 bg-slate-200/90 shrink-0 mx-1 sm:mx-2 rounded-full" />

      {/* Columna Central: 3 filas con píldoras de información bien estructuradas */}
      <div className="flex flex-col gap-1.5 sm:gap-2 min-w-0 flex-1 justify-center">
        {/* Fila 1: Fecha (o Check con fecha y hora si está completada) */}
        <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1 rounded-full bg-[#eaf1fb] text-[#1e293b] text-[11px] sm:text-xs font-bold w-fit shadow-none">
          {tab === "COMPLETED" ? (
            <>
              <Check className="size-3.5 text-emerald-600 stroke-[2.5] shrink-0" />
              <span>{item.completedAt || formatDate(item.scheduledDate)}</span>
            </>
          ) : (
            <>
              <Calendar className="size-3.5 text-[#1a65f0] shrink-0" />
              <span>{formatDate(item.scheduledDate)}</span>
            </>
          )}
        </div>

        {/* Fila 2: Cantidad de casas */}
        <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1 rounded-full bg-[#eaf1fb] text-[#1e293b] text-[11px] sm:text-xs font-bold w-fit shadow-none">
          <Home className="size-3.5 text-[#475569] shrink-0" />
          <span>{item.totalStops} casas</span>
        </div>

        {/* Fila 3: Distancia en kilómetros */}
        <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1 rounded-full bg-[#eaf1fb] text-[#1e293b] text-[11px] sm:text-xs font-bold w-fit shadow-none">
          <Route className="size-3.5 text-[#475569] shrink-0" />
          <span>{item.distanceKm.toFixed(1)} km</span>
        </div>
      </div>

      {/* Columna Derecha: Tipo de servicio en dos líneas en negrita y color temático */}
      <div className="shrink-0 text-right sm:text-left pl-2 sm:pl-3">
        <h4
          className={`text-base sm:text-lg md:text-xl font-bold leading-[1.15] tracking-tight ${
            isCut ? "text-[#dc2626]" : "text-[#0055d4]"
          }`}
        >
          {isCut ? (
            <>
              Corte de
              <br />
              servicio
            </>
          ) : (
            <>
              Reconexión
              <br />
              de servicio
            </>
          )}
        </h4>
      </div>
    </div>
  );
}
