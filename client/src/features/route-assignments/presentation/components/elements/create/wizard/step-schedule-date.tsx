"use client";

import React, { useMemo } from "react";
import { ArrowLeft, ArrowRight, Calendar as CalendarIcon, Clock } from "lucide-react";
import { useRouteCreationWizard } from "@/features/route-assignments/presentation/state/route-creation-wizard-store";
import { cn } from "@/lib/utils";

function getTodayString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getTomorrowString(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDisplayDate(dateStr: string | null): string {
  if (!dateStr) return "Selecciona una fecha";
  try {
    const [year, month, day] = dateStr.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    const formatted = new Intl.DateTimeFormat("es-BO", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  } catch {
    return dateStr;
  }
}

export function StepScheduleDate() {
  const { scheduledDate, setScheduledDate, nextStep, prevStep, canAdvance } =
    useRouteCreationWizard();

  const todayStr = useMemo(() => getTodayString(), []);
  const tomorrowStr = useMemo(() => getTomorrowString(), []);

  const readableDate = useMemo(
    () => formatDisplayDate(scheduledDate),
    [scheduledDate]
  );

  return (
    <div className="flex flex-col h-full min-h-0 justify-between select-none">
      {/* 1. Cabecera con título y descripción */}
      <div className="px-6 pt-1 pb-3 shrink-0">
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">
          Fecha de asignación
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
          Define el día programado para la ejecución operativa de esta ruta.
        </p>
      </div>

      {/* 2. Cuerpo con switch redondeado y tarjeta plana sin contornos */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-2 space-y-4">
        {/* Switch segmentado de dos opciones: Hoy / Mañana (plano, sin bordes, redondeado completo) */}
        <div className="p-1 rounded-full bg-slate-100 flex items-center border-0 shadow-none">
          <button
            type="button"
            onClick={() => setScheduledDate(todayStr)}
            className={cn(
              "flex-1 h-10 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border-0 shadow-none cursor-pointer select-none",
              scheduledDate === todayStr
                ? "bg-[#0e4dcb] text-white font-bold"
                : "bg-transparent text-slate-600 hover:text-slate-900"
            )}
          >
            <Clock className="size-3.5 stroke-[2.2]" />
            <span>Hoy</span>
          </button>

          <button
            type="button"
            onClick={() => setScheduledDate(tomorrowStr)}
            className={cn(
              "flex-1 h-10 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border-0 shadow-none cursor-pointer select-none",
              scheduledDate === tomorrowStr
                ? "bg-[#0e4dcb] text-white font-bold"
                : "bg-transparent text-slate-600 hover:text-slate-900"
            )}
          >
            <CalendarIcon className="size-3.5 stroke-[2.2]" />
            <span>Mañana</span>
          </button>
        </div>

        {/* Tarjeta inferior plana sin contornos (bg-[#ebf3ff], rounded-3xl) */}
        <div className="p-4 sm:p-5 rounded-3xl bg-[#ebf3ff] border-0 shadow-none space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <div className="p-1.5 rounded-full bg-white text-[#0e4dcb] shadow-none">
              <CalendarIcon className="size-4" />
            </div>
            <span>Elegir fecha de salida</span>
          </div>

          {/* Input de fecha plano y completamente redondeado */}
          <div className="relative">
            <input
              id="assignment-date-input"
              type="date"
              min={todayStr}
              value={scheduledDate ?? ""}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full h-11 sm:h-12 px-4 rounded-full bg-white border-0 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0e4dcb]/20 shadow-none cursor-pointer"
            />
          </div>

          {/* Texto de fecha seleccionada */}
          <div className="pt-2 flex items-center justify-between text-xs border-t border-blue-200/50">
            <span className="text-slate-500 font-medium">Programada para:</span>
            <span className="font-bold text-[#0e4dcb] truncate ml-2">
              {readableDate}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Barra inferior fija con botones Atrás y Siguiente */}
      <div className="px-6 py-3 pb-6 sm:pb-4 flex items-center justify-between border-t border-slate-100 bg-white shrink-0">
        <button
          type="button"
          onClick={prevStep}
          className="h-11 px-5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200/80 border-0 shadow-none flex items-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0"
        >
          <ArrowLeft className="size-3.5 stroke-[2.5]" />
          <span>Atrás</span>
        </button>

        <button
          type="button"
          onClick={nextStep}
          disabled={!canAdvance}
          className={cn(
            "h-11 px-6 rounded-full font-semibold text-xs flex items-center gap-2 transition border-0 shadow-none shrink-0",
            canAdvance
              ? "bg-gradient-to-r from-[#0e4dcb] via-[#1a66e5] to-[#2579f6] text-white hover:opacity-95 active:scale-[0.98] cursor-pointer"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          )}
        >
          <span>Siguiente</span>
          <ArrowRight className="size-3.5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}

export default StepScheduleDate;
