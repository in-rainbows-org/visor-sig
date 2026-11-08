"use client";

import React from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, CheckCircle2, X } from "lucide-react";
import type {
  AssignmentStopDetail,
  AssignmentStopStatus,
} from "@/features/route-assignments/domain/entities/assignment-detail.entity";

export type AssignmentDetailStopSheetProps = {
  stop: AssignmentStopDetail | null;
  isStartingPointSelected?: boolean;
  startLatitude?: number;
  startLongitude?: number;
  onClose: () => void;
};

function formatTime(date: Date | null): string {
  if (!date) return "--";
  try {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  } catch {
    return "--";
  }
}

function StopStatusBadge({ status }: { status: AssignmentStopStatus }) {
  switch (status) {
    case "COMPLETED":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-emerald-50 text-emerald-700 border-0 shadow-none shrink-0">
          <span className="size-2 rounded-full bg-emerald-500 shrink-0" />
          <span>Completa</span>
        </span>
      );
    case "IN_TRANSIT":
    case "ARRIVED":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-amber-50 text-amber-700 border-0 shadow-none shrink-0">
          <span className="size-2 rounded-full bg-amber-500 shrink-0" />
          <span>En proceso</span>
        </span>
      );
    case "FAILED":
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-rose-50 text-rose-700 border-0 shadow-none shrink-0">
          <span className="size-2 rounded-full bg-rose-500 shrink-0" />
          <span>Fallida</span>
        </span>
      );
    case "PENDING":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-slate-100 text-slate-600 border-0 shadow-none shrink-0">
          <span className="size-2 rounded-full bg-slate-400 shrink-0" />
          <span>Pendiente</span>
        </span>
      );
  }
}

export function AssignmentDetailStopSheet({
  stop,
  isStartingPointSelected = false,
  startLatitude,
  startLongitude,
  onClose,
}: AssignmentDetailStopSheetProps) {
  const isOpen = Boolean(stop || isStartingPointSelected);

  let llegadaText = "--";
  let completadoText = "--";

  if (stop) {
    if (stop.status === "COMPLETED") {
      llegadaText = formatTime(stop.arrivedAt ?? stop.inTransitAt);
      completadoText = formatTime(stop.completedAt);
    } else if (stop.status === "IN_TRANSIT" || stop.status === "ARRIVED") {
      llegadaText = formatTime(stop.arrivedAt ?? stop.inTransitAt);
      completadoText = "--";
    } else if (stop.status === "FAILED") {
      llegadaText = formatTime(stop.arrivedAt ?? stop.inTransitAt);
      completadoText = formatTime(stop.completedAt);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key={isStartingPointSelected ? "start-point-sheet" : `stop-sheet-${stop?.id}`}
          initial={{ y: 30, opacity: 0 }}
          animate={{
            y: 0,
            opacity: 1,
            transition: { duration: 0.25, ease: "easeOut" },
          }}
          exit={{
            y: 30,
            opacity: 0,
            transition: { duration: 0.18, ease: "easeIn" },
          }}
          className="absolute bottom-20 left-4 right-4 lg:bottom-4 lg:left-[584px] lg:right-[84px] z-[1000] pointer-events-auto bg-white rounded-2xl p-5 sm:px-8 sm:py-6 min-h-[116px] sm:min-h-[134px] flex flex-col justify-center border-0 shadow-none select-none transition-all"
        >
          {isStartingPointSelected ? (
            /* Detalle horizontal de Punto de Partida */
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 sm:gap-5 min-w-0 flex-1">
                <div className="relative size-12 sm:size-14 shrink-0 flex items-center justify-center">
                  <Image
                    src="/assignment-route/start-point-selected.webp"
                    alt="Punto de partida registrado"
                    fill
                    sizes="56px"
                    priority
                    unoptimized
                    className="object-contain"
                  />
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 block leading-tight">
                    Punto de Partida
                  </span>
                  <h4 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                    Ubicación de Salida Registrada
                  </h4>
                  {startLatitude && startLongitude && (
                    <p className="text-xs sm:text-sm text-slate-500 font-medium font-mono truncate">
                      {startLatitude.toFixed(5)}, {startLongitude.toFixed(5)}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar detalle"
                className="size-9 sm:size-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition active:scale-95 cursor-pointer shrink-0 border-0"
              >
                <X className="size-4 sm:size-5 stroke-[2.5]" />
              </button>
            </div>
          ) : stop ? (
            /* Detalle horizontal y largo de la Parada seleccionada (con mayor altura hacia arriba) */
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6">
              {/* Sección Izquierda: Marcador 3D numerado + Código Fijo y Titular */}
              <div className="flex items-center gap-4 sm:gap-5 min-w-0 flex-1">
                {/* 1. Pin 3D oficial numerado */}
                <div className="relative size-12 sm:size-14 shrink-0 flex items-center justify-center">
                  <img
                    src="/navigation-map/stop-point.webp"
                    alt={`Parada ${stop.orderIndex}`}
                    className="w-11 sm:w-12 h-[53px] sm:h-[58px] object-contain pointer-events-none"
                  />
                  <span
                    className="absolute top-[44.5%] left-[49%] -translate-x-1/2 -translate-y-1/2 font-extrabold text-[#0e4dcb] text-xs sm:text-sm pointer-events-none"
                    style={{ fontFamily: "var(--font-montserrat, Montserrat, sans-serif)" }}
                  >
                    {stop.orderIndex}
                  </span>
                </div>

                {/* 2. Código Fijo y Nombre del Titular */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-bold text-[#0e4dcb] tracking-wide uppercase leading-tight">
                      Parada #{stop.orderIndex}
                    </span>
                    <span className="text-[11px] sm:text-xs font-semibold text-slate-500 font-mono bg-slate-100 px-2.5 py-0.5 rounded-full leading-tight">
                      Código #{stop.fixedCode ?? "S/C"}
                    </span>
                  </div>
                  <h4 className="text-base sm:text-lg font-bold text-slate-900 truncate mt-1 leading-snug">
                    {stop.name || "Sin titular registrado"}
                  </h4>
                </div>
              </div>

              {/* Sección Central / Derecha: Badge de Estado + Horarios */}
              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <StopStatusBadge status={stop.status} />

                <div className="hidden sm:block w-px h-9 bg-slate-200/80 shrink-0" />

                {/* Horarios de Llegada y Fin con espaciado cómodo */}
                <div className="text-xs sm:text-[13px] text-slate-500 font-medium space-y-1.5 shrink-0 text-left">
                  <div className="flex items-center gap-1.5 sm:gap-2 leading-tight">
                    <Calendar className="size-4 text-slate-400 shrink-0" />
                    <span className="text-slate-400">Lleg:</span>
                    <span className="font-semibold text-slate-700">{llegadaText}</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 leading-tight">
                    <CheckCircle2 className="size-4 text-emerald-600/90 shrink-0" />
                    <span className="text-slate-400">Fin:</span>
                    <span className="font-semibold text-slate-700">{completadoText}</span>
                  </div>
                </div>

                {/* Botón X de Cierre */}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Cerrar detalle"
                  className="size-9 sm:size-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition active:scale-95 cursor-pointer shrink-0 border-0 ml-1"
                >
                  <X className="size-4 sm:size-5 stroke-[2.5]" />
                </button>
              </div>
            </div>
          ) : null}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AssignmentDetailStopSheet;
