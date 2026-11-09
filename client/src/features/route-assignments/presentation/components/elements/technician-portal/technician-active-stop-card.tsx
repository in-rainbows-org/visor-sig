"use client";

import React from "react";
import Image from "next/image";
import { Check, CheckCircle2, MapPin, Navigation, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActiveStopCardModel } from "@/features/route-assignments/domain/entities/assignment-execution.entity";
import type { AssignmentStopDetail } from "@/features/route-assignments/domain/entities/assignment-detail.entity";

export interface TechnicianActiveStopCardProps {
  cardState: ActiveStopCardModel;
  onStartTransit: (stopId: string, latitude?: number | null, longitude?: number | null) => void;
  onNavigate: (latitude: number, longitude: number) => void;
  onArrive: (stopId: string) => void;
  onFinalize: (stop: AssignmentStopDetail) => void;
  isSubmitting?: boolean;
  className?: string;
}

export function TechnicianActiveStopCard({
  cardState,
  onStartTransit,
  onNavigate,
  onArrive,
  onFinalize,
  isSubmitting = false,
  className = "",
}: TechnicianActiveStopCardProps) {
  const { phase, stop, eyebrow, statusImage, orderIndex, fixedCode, clientName, actions } = cardState;

  return (
    <div
      className={cn(
        "w-full bg-gradient-to-br from-[#0e4dcb] via-[#1660dc] to-[#2d83f3] text-white rounded-3xl p-3 sm:p-3.5 shadow-none border-0 select-none flex items-center justify-between gap-2.5 sm:gap-3 pointer-events-auto",
        className
      )}
    >
      {/* 1. Imagen pura de estado (sin fondo ni contenedor) */}
      <div className="relative size-12 sm:size-14 shrink-0 flex items-center justify-center">
        <Image
          src={statusImage}
          alt={eyebrow}
          fill
          className="object-contain"
          sizes="56px"
          unoptimized={statusImage.endsWith(".gif")}
        />
      </div>

      {/* 2. Textos y metadata central */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white/80 block truncate">
          {eyebrow}
        </span>

        {phase !== "ALL_COMPLETED" ? (
          <>
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-white/90 font-mono font-medium truncate">
              <span>Parada #{orderIndex ?? "--"}</span>
              <span>•</span>
              <span>Código #{fixedCode ?? "S/C"}</span>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-white truncate leading-snug">
              {clientName || "Sin titular registrado"}
            </h4>
          </>
        ) : (
          <div className="space-y-0.5">
            <h4 className="text-xs sm:text-sm font-bold text-white leading-snug truncate">
              Asignación completada
            </h4>
            <p className="text-[11px] text-white/85 truncate">
              Todas las paradas concluidas
            </p>
          </div>
        )}
      </div>

      {/* 3. Botones contextuales alineados a la derecha */}
      <div className="shrink-0 flex items-center gap-1.5 sm:gap-2">
        {/* Caso 1: Siguiente parada disponible -> Botón "Ir" */}
        {actions.canStartTransit && stop && (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => onStartTransit(stop.id, stop.latitude, stop.longitude)}
            className="h-9 px-3.5 sm:px-4 rounded-full bg-white text-blue-700 hover:bg-white/90 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-none active:scale-95 transition-all cursor-pointer border-0 disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
          >
            {isSubmitting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Navigation className="size-3.5 stroke-[2.2] fill-current" />
            )}
            <span>Ir</span>
          </button>
        )}

        {/* Caso 2: Parada en tránsito -> Botón redondo Navegar (solo icono) + Botón "Ya llegué" */}
        {phase === "IN_TRANSIT" && stop && (
          <>
            <button
              type="button"
              title="Navegar en Google Maps"
              disabled={isSubmitting || stop.latitude == null || stop.longitude == null}
              onClick={() => {
                if (stop.latitude != null && stop.longitude != null) {
                  onNavigate(stop.latitude, stop.longitude);
                }
              }}
              className="size-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-xs active:scale-95 transition cursor-pointer border-0 shrink-0 disabled:opacity-50 shadow-none"
            >
              <Navigation className="size-4 stroke-[2.2] fill-current" />
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => onArrive(stop.id)}
              className="h-9 px-3 sm:px-3.5 rounded-full bg-white text-blue-700 hover:bg-white/90 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-none active:scale-95 transition cursor-pointer border-0 disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
            >
              {isSubmitting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Check className="size-3.5 stroke-[2.5]" />
              )}
              <span>Ya llegué</span>
            </button>
          </>
        )}

        {/* Caso 3: Arribado en predio -> Botón "Finalizar" */}
        {actions.canFinalize && stop && (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => onFinalize(stop)}
            className="h-9 px-3.5 sm:px-4 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-none active:scale-95 transition-all cursor-pointer border-0 disabled:opacity-60 shrink-0"
          >
            <CheckCircle2 className="size-3.5 stroke-[2.2]" />
            <span>Finalizar</span>
          </button>
        )}

        {/* Caso 4: Todas las paradas concluidas -> Ícono check */}
        {phase === "ALL_COMPLETED" && (
          <div className="size-8 rounded-full bg-white/20 text-white flex items-center justify-center shrink-0">
            <Check className="size-4 stroke-[2.5]" />
          </div>
        )}
      </div>
    </div>
  );
}

export default TechnicianActiveStopCard;
