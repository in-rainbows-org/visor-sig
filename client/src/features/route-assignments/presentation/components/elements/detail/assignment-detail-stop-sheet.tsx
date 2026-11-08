"use client";

import React, { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, CheckCircle2, Eye, Gauge, ImageOff, X } from "lucide-react";
import type {
  AssignmentStopDetail,
  AssignmentStopStatus,
} from "@/features/route-assignments/domain/entities/assignment-detail.entity";
import { AssignmentEvidenceLightbox } from "./assignment-evidence-lightbox";

export type AssignmentDetailStopSheetProps = {
  stop: AssignmentStopDetail | null;
  isStartingPointSelected?: boolean;
  startLatitude?: number;
  startLongitude?: number;
  onClose: () => void;
};

function formatTime(date: Date | null): string {
  if (!date) return "--:--";
  try {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  } catch {
    return "--:--";
  }
}

type StopStatusConfig = {
  asset: string;
  label: string;
};

function getStopStatusConfig(status: AssignmentStopStatus, orderIndex: number): StopStatusConfig {
  const normalized = (status ? String(status).toUpperCase().trim() : "PENDING") as AssignmentStopStatus;
  switch (normalized) {
    case "IN_TRANSIT":
      return {
        asset: "/stop-status/in_transit.gif",
        label: `De ida a la parada ${orderIndex}`,
      };
    case "ARRIVED":
      return {
        asset: "/stop-status/in_process.webp",
        label: `En la parada ${orderIndex}`,
      };
    case "COMPLETED":
      return {
        asset: "/stop-status/completed.webp",
        label: `Parada ${orderIndex} completada`,
      };
    case "FAILED":
      return {
        asset: "/stop-status/failed.webp",
        label: `Parada ${orderIndex} fallida`,
      };
    case "PENDING":
    default:
      return {
        asset: "/stop-status/pending.webp",
        label: "Pendiente",
      };
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
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);

  // Resolver tiempos según estado operativo
  let salidaOLlegadaLabel = "Hora de llegada";
  let salidaOLlegadaHora = "--:--";

  if (stop) {
    if (stop.status === "IN_TRANSIT") {
      salidaOLlegadaLabel = "Hora de ida";
      salidaOLlegadaHora = formatTime(stop.inTransitAt);
    } else {
      salidaOLlegadaLabel = "Hora de llegada";
      salidaOLlegadaHora = formatTime(stop.arrivedAt ?? (stop.status === "COMPLETED" ? stop.inTransitAt : null));
    }
  }

  const finalizacionHora = stop ? formatTime(stop.completedAt) : "--:--";
  const statusConfig = stop ? getStopStatusConfig(stop.status, stop.orderIndex) : null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key={isStartingPointSelected ? "start-point-sheet" : `stop-sheet-${stop?.id}`}
            initial={{ y: 35, opacity: 0 }}
            animate={{
              y: 0,
              opacity: 1,
              transition: { duration: 0.25, ease: "easeOut" },
            }}
            exit={{
              y: 35,
              opacity: 0,
              transition: { duration: 0.18, ease: "easeIn" },
            }}
            className="absolute bottom-20 left-4 right-4 lg:bottom-4 lg:left-[584px] lg:right-auto lg:w-max lg:max-w-[calc(100vw-616px)] xl:max-w-[1150px] 2xl:max-w-[1260px] z-[1000] pointer-events-auto bg-white rounded-3xl p-4 sm:p-5 border-0 shadow-xl select-none transition-all max-h-[85vh] overflow-y-auto lg:overflow-visible"
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
            ) : stop && statusConfig ? (
              <div>
                {/* ======================================================== */}
                {/* 1. ESTRUCTURA PARA ESCRITORIO (3 Columnas con extensión) */}
                {/* ======================================================== */}
                <div className="hidden lg:flex items-center gap-4 xl:gap-5 w-full">
                  {/* COLUMNA 1 (Izquierda): Imagen + Info con texto wrap */}
                  <div className="flex items-center gap-3 shrink-0 w-[240px] xl:w-[270px] min-w-0">
                    <div className="relative size-18 xl:size-20 shrink-0 flex items-center justify-center rounded-2xl bg-slate-50 overflow-hidden border border-slate-100 p-1">
                      <Image
                        src={statusConfig.asset}
                        alt={statusConfig.label}
                        fill
                        sizes="90px"
                        priority
                        unoptimized
                        className="object-contain"
                      />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 block leading-tight">
                          Estado actual
                        </span>
                        <h4 className="text-sm xl:text-base font-bold text-[#0e4dcb] leading-snug break-words">
                          {statusConfig.label}
                        </h4>
                      </div>

                      <div className="text-xs xl:text-[13px] font-semibold text-slate-700 leading-tight">
                        Código Fijo: <span className="font-mono text-slate-900 font-bold">{stop.fixedCode ?? "S/C"}</span>
                      </div>

                      <div className="text-xs xl:text-[13px] text-slate-500 font-medium leading-snug break-words">
                        {stop.name || "Sin titular registrado"}
                      </div>
                    </div>
                  </div>

                  {/* Divisor vertical 1 */}
                  <div className="w-px h-22 xl:h-24 bg-slate-200/80 shrink-0" />

                  {/* COLUMNA 2 (Centro): Tiempos de visita y Lectura de medidor (20% más ancha) */}
                  <div className="flex flex-col justify-center gap-2 shrink-0 w-[265px] xl:w-[285px] bg-slate-50/80 rounded-2xl p-3 border border-slate-100">
                    {/* Hora de llegada o de ida */}
                    <div className="flex items-center justify-between gap-2 text-xs sm:text-[13px]">
                      <span className="text-slate-600 font-medium inline-flex items-center gap-1.5 truncate">
                        <Calendar className="size-4 text-slate-400 shrink-0" />
                        {salidaOLlegadaLabel}:
                      </span>
                      <span className="font-bold text-slate-900 font-mono text-sm shrink-0">
                        {salidaOLlegadaHora}
                      </span>
                    </div>

                    {/* Hora de finalización */}
                    <div className="flex items-center justify-between gap-2 text-xs sm:text-[13px]">
                      <span className="text-slate-600 font-medium inline-flex items-center gap-1.5 truncate">
                        <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                        Hora de finalización:
                      </span>
                      <span className="font-bold text-slate-900 font-mono text-sm shrink-0">
                        {finalizacionHora}
                      </span>
                    </div>

                    {/* Lectura de medidor */}
                    <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between gap-2 text-xs sm:text-[13px]">
                      <span className="text-slate-700 font-semibold inline-flex items-center gap-1.5 truncate">
                        <Gauge className="size-4 text-blue-600 shrink-0" />
                        Lectura de medidor:
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs sm:text-sm font-bold font-mono shrink-0">
                        {stop.meterReading || "--"}
                      </span>
                    </div>
                  </div>

                  {/* Divisor vertical 2 */}
                  <div className="w-px h-22 xl:h-24 bg-slate-200/80 shrink-0" />

                  {/* COLUMNA 3 (Derecha): Imagen de evidencia y Campo exclusivo de Observación (+10% más a la derecha) */}
                  <div className="flex items-center gap-3.5 shrink-0 min-w-0">
                    {/* Imagen de evidencia */}
                    {stop.evidencePhotoUrl ? (
                      <button
                        type="button"
                        onClick={() => setIsLightboxOpen(true)}
                        className="relative size-20 xl:size-22 shrink-0 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0e4dcb] transition active:scale-95 shadow-xs"
                        title="Hacer clic para ampliar imagen"
                      >
                        <Image
                          src={stop.evidencePhotoUrl}
                          alt="Evidencia fotográfica"
                          fill
                          sizes="90px"
                          unoptimized
                          className="object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye className="size-5 text-white drop-shadow" />
                        </div>
                      </button>
                    ) : (
                      <div className="size-20 xl:size-22 shrink-0 rounded-2xl bg-slate-100/90 border border-slate-200/70 flex flex-col items-center justify-center p-1.5 text-center select-none shadow-xs">
                        <ImageOff className="size-5 text-slate-400 shrink-0 mb-1" />
                        <span className="text-[10px] xl:text-[11px] font-semibold text-slate-400 leading-tight">
                          Sin imagen aún
                        </span>
                      </div>
                    )}

                    {/* Campo exclusivo para Observación (expandido y reservado hacia la derecha) */}
                    <div className="w-[310px] xl:w-[420px] 2xl:w-[490px] shrink-0 h-20 xl:h-22 overflow-y-auto rounded-2xl bg-slate-50/80 border border-slate-100 p-2.5 xl:p-3 text-left">
                      <span className="text-[10px] xl:text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                        Observación
                      </span>
                      <p className="text-xs xl:text-[13px] text-slate-700 leading-snug whitespace-pre-wrap break-words">
                        {stop.observation || "Sin observaciones registradas."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ======================================================== */}
                {/* 2. ESTRUCTURA PARA MÓVILES (1 Columna en varias filas)   */}
                {/* ======================================================== */}
                <div className="flex lg:hidden flex-col gap-3.5">
                  {/* Barra superior de cabecera con botón de cierre 'X' */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Detalle de parada
                    </span>
                    <button
                      type="button"
                      onClick={onClose}
                      aria-label="Cerrar detalle"
                      className="size-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition active:scale-95 cursor-pointer border-0"
                    >
                      <X className="size-4 stroke-[2.5]" />
                    </button>
                  </div>

                  {/* FILA 1: Contenido de la primera columna (Imagen de estado + Información con columna de imagen más amplia) */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="relative size-20 sm:size-22 shrink-0 flex items-center justify-center rounded-2xl bg-slate-50 overflow-hidden border border-slate-100 p-1">
                      <Image
                        src={statusConfig.asset}
                        alt={statusConfig.label}
                        fill
                        sizes="88px"
                        priority
                        unoptimized
                        className="object-contain"
                      />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <span className="text-[11px] font-semibold text-slate-400 block leading-tight">
                        Estado actual
                      </span>
                      <h4 className="text-sm sm:text-base font-bold text-[#0e4dcb] leading-snug truncate">
                        {statusConfig.label}
                      </h4>
                      <div className="text-xs sm:text-[13px] font-semibold text-slate-700 leading-tight">
                        Código Fijo: <span className="font-mono text-slate-900 font-bold">{stop.fixedCode ?? "S/C"}</span>
                      </div>
                      <div className="text-xs sm:text-[13px] text-slate-500 font-medium truncate leading-tight">
                        {stop.name || "Sin titular registrado"}
                      </div>
                    </div>
                  </div>

                  {/* FILA 2: Contenido de la segunda columna (Tiempos y Lectura de medidor) */}
                  <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100 space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs sm:text-[13px]">
                      <span className="text-slate-500 font-medium inline-flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-slate-400 shrink-0" />
                        {salidaOLlegadaLabel}:
                      </span>
                      <span className="font-bold text-slate-800 font-mono text-sm">
                        {salidaOLlegadaHora}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-xs sm:text-[13px]">
                      <span className="text-slate-500 font-medium inline-flex items-center gap-1.5">
                        <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
                        Hora de finalización:
                      </span>
                      <span className="font-bold text-slate-800 font-mono text-sm">
                        {finalizacionHora}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2 text-xs sm:text-[13px]">
                      <span className="text-slate-500 font-semibold inline-flex items-center gap-1.5">
                        <Gauge className="size-3.5 text-blue-600 shrink-0" />
                        Lectura de medidor:
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs sm:text-sm font-bold font-mono">
                        {stop.meterReading || "--"}
                      </span>
                    </div>
                  </div>

                  {/* FILA 3: Fila completa para la imagen de evidencia */}
                  <div className="w-full">
                    {stop.evidencePhotoUrl ? (
                      <button
                        type="button"
                        onClick={() => setIsLightboxOpen(true)}
                        className="w-full flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-slate-50/80 border border-slate-100 hover:bg-slate-100/80 transition cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative size-16 sm:size-18 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/80">
                            <Image
                              src={stop.evidencePhotoUrl}
                              alt="Evidencia fotográfica"
                              fill
                              sizes="72px"
                              unoptimized
                              className="object-cover"
                            />
                          </div>
                          <div className="text-left min-w-0">
                            <span className="text-xs sm:text-sm font-bold text-slate-800 block truncate">
                              Fotografía de evidencia
                            </span>
                            <span className="text-[11px] sm:text-xs text-slate-500 block truncate">
                              Toca para ver en pantalla completa
                            </span>
                          </div>
                        </div>
                        <div className="size-9 rounded-full bg-white shadow-xs flex items-center justify-center shrink-0 text-slate-600">
                          <Eye className="size-4.5" />
                        </div>
                      </button>
                    ) : (
                      <div className="w-full rounded-2xl bg-slate-50/80 border border-slate-100 py-3.5 px-4 flex items-center justify-center gap-2 text-slate-400 select-none">
                        <ImageOff className="size-4.5 shrink-0" />
                        <span className="text-xs sm:text-sm font-medium">Sin imagen de evidencia aún</span>
                      </div>
                    )}
                  </div>

                  {/* FILA 4: Fila completa para toda la observación */}
                  <div className="w-full rounded-2xl bg-slate-50/80 border border-slate-100 p-3 text-left">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Observación
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap break-words max-h-24 overflow-y-auto">
                      {stop.observation || "Sin observaciones registradas."}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visor Lightbox para ampliación de fotografía */}
      <AssignmentEvidenceLightbox
        isOpen={isLightboxOpen}
        imageUrl={stop?.evidencePhotoUrl ?? null}
        title={stop ? `Evidencia - Parada #${stop.orderIndex} (Código #${stop.fixedCode ?? "S/C"})` : "Fotografía de evidencia"}
        onClose={() => setIsLightboxOpen(false)}
      />
    </>
  );
}

export default AssignmentDetailStopSheet;
