"use client";

import React, { useState } from "react";
import { Check, CheckCircle2, XCircle, X } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { SlideConfirm } from "@/components/ui/slide-confirm";
import { cn } from "@/lib/utils";
import type { AssignmentStopDetail } from "@/features/route-assignments/domain/entities/assignment-detail.entity";
import type {
  CompleteStopInput,
  StopCompletionChoice,
} from "@/features/route-assignments/domain/entities/assignment-execution.entity";

export interface TechnicianFinalizeStopDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stop: AssignmentStopDetail | null;
  onCompleteStop: (
    stopId: string,
    data: CompleteStopInput
  ) => Promise<boolean>;
  isSubmitting?: boolean;
}

interface FinalizeStopFormProps {
  stop: AssignmentStopDetail;
  onCompleteStop: (stopId: string, data: CompleteStopInput) => Promise<boolean>;
  onClose: () => void;
  isSubmitting: boolean;
}

function FinalizeStopForm({
  stop,
  onCompleteStop,
  onClose,
  isSubmitting,
}: FinalizeStopFormProps) {
  const [choice, setChoice] = React.useState<StopCompletionChoice | null>(null);
  const [observation, setObservation] = React.useState<string>("");
  const [meterReading, setMeterReading] = React.useState<string>("");

  const isFailed = choice === "FAILED";
  const isSuccess = choice === "SUCCESS";
  const isSliderDisabled =
    !choice ||
    isSubmitting ||
    (isFailed && !observation.trim());

  const handleConfirm = async () => {
    if (!choice || isSliderDisabled) return;

    const payload: CompleteStopInput = {
      status: choice,
      observation:
        observation.trim() ||
        (isFailed ? "Visita no completada por el técnico" : undefined),
      meterReading: meterReading.trim() || undefined,
    };

    const ok = await onCompleteStop(stop.id, payload);
    if (ok) {
      onClose();
    }
  };

  return (
    <>
      <div className="w-full pt-1 shrink-0" />

      <div className="flex-1 min-w-0 overflow-y-auto px-4 py-3 space-y-4 overscroll-contain scrollbar-thin scrollbar-thumb-slate-200">
        {/* Header de la parada */}
        <div className="bg-slate-100/90 rounded-2xl p-3.5 space-y-1">
          <div className="flex items-center gap-2">
            <span className="size-6 rounded-full bg-[#0e4dcb] text-white font-bold text-xs flex items-center justify-center shrink-0">
              {stop.orderIndex}
            </span>
            <span className="text-xs font-bold text-slate-500 font-mono tracking-tight">
              Código #{stop.fixedCode ?? "S/C"}
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
            {stop.name || "Sin titular registrado"}
          </h3>
        </div>

        {/* Selector de opciones mutuamente excluyentes */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-700 tracking-tight block">
            Resultado de la visita *
          </span>


          <div className="grid grid-cols-2 gap-2.5">
            {/* Opción Exitosa */}
            <button
              type="button"
              onClick={() => setChoice("SUCCESS")}
              className={cn(
                "p-3.5 rounded-2xl border-2 transition-all text-left flex flex-col justify-between gap-2 cursor-pointer outline-none",
                isSuccess
                  ? "border-emerald-500 bg-emerald-50/70 shadow-sm"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              )}
            >
              <div className="flex items-center justify-between w-full">
                <div
                  className={cn(
                    "size-8 rounded-full flex items-center justify-center transition-colors",
                    isSuccess
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-100 text-slate-400"
                  )}
                >
                  <CheckCircle2 className="size-5" />
                </div>
                <div
                  className={cn(
                    "size-5 rounded-full border-2 flex items-center justify-center",
                    isSuccess
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-slate-300"
                  )}
                >
                  {isSuccess && <Check className="size-3 stroke-[3]" />}
                </div>
              </div>

              <div>
                <h4
                  className={cn(
                    "text-xs sm:text-sm font-bold",
                    isSuccess ? "text-emerald-900" : "text-slate-800"
                  )}
                >
                  Exitosa
                </h4>
                <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                  Servicio ejecutado con éxito
                </p>
              </div>
            </button>

            {/* Opción Fallida */}
            <button
              type="button"
              onClick={() => setChoice("FAILED")}
              className={cn(
                "p-3.5 rounded-2xl border-2 transition-all text-left flex flex-col justify-between gap-2 cursor-pointer outline-none",
                isFailed
                  ? "border-rose-500 bg-rose-50/70 shadow-sm"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              )}
            >
              <div className="flex items-center justify-between w-full">
                <div
                  className={cn(
                    "size-8 rounded-full flex items-center justify-center transition-colors",
                    isFailed
                      ? "bg-rose-500 text-white"
                      : "bg-slate-100 text-slate-400"
                  )}
                >
                  <XCircle className="size-5" />
                </div>
                <div
                  className={cn(
                    "size-5 rounded-full border-2 flex items-center justify-center",
                    isFailed
                      ? "border-rose-500 bg-rose-500 text-white"
                      : "border-slate-300"
                  )}
                >
                  {isFailed && <Check className="size-3 stroke-[3]" />}
                </div>
              </div>

              <div>
                <h4
                  className={cn(
                    "text-xs sm:text-sm font-bold",
                    isFailed ? "text-rose-900" : "text-slate-800"
                  )}
                >
                  Fallida
                </h4>
                <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                  No se completó la visita
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Formulario complementario */}
        {choice && (
          <div className="space-y-3 pt-1 animate-in fade-in duration-200">
            {isFailed && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label
                    htmlFor="finalize-observation"
                    className="font-bold text-slate-700 flex items-center gap-1"
                  >
                    <span>Motivo / Observación</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-400">Requerido</span>
                </div>
                <textarea
                  id="finalize-observation"
                  rows={2}
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder="Ej: Predio cerrado, usuario ausente o no se permitió el acceso..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none text-slate-800"
                />
              </div>
            )}

            {isSuccess && (
              <div className="space-y-1.5">
                <label
                  htmlFor="finalize-meter"
                  className="font-bold text-xs text-slate-700 block"
                >
                  Lectura de medidor (opcional)
                </label>
                <input
                  id="finalize-meter"
                  type="text"
                  value={meterReading}
                  onChange={(e) => setMeterReading(e.target.value)}
                  placeholder="Ej: 004523"
                  className="w-full text-xs px-3 h-10 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer con Slider y botón de cerrar */}
      <DrawerFooter className="pt-2 pb-4 px-4 border-t border-slate-100 bg-white/50 space-y-2 shadow-none">
        <div className="w-full">
          <SlideConfirm
            height={49}
            text="Desliza para finalizar la parada"
            confirmedText="Finalizando parada..."
            variant={isFailed ? "dark" : "emerald"}
            disabled={isSliderDisabled}
            onConfirm={handleConfirm}
          />
        </div>

        <DrawerClose asChild>
          <button
            type="button"
            className="w-full h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition active:scale-95 cursor-pointer border-0 inline-flex items-center justify-center gap-1.5"
          >
            <X className="size-3.5 stroke-[2.5]" />
            <span>Cerrar</span>
          </button>
        </DrawerClose>
      </DrawerFooter>
    </>
  );
}

export function TechnicianFinalizeStopDrawer({
  open,
  onOpenChange,
  stop,
  onCompleteStop,
  isSubmitting = false,
}: TechnicianFinalizeStopDrawerProps) {
  if (!stop) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh] flex flex-col">
        <DrawerTitle className="sr-only">Finalizar visita técnica</DrawerTitle>
        <DrawerDescription className="sr-only">
          Selecciona si la visita fue exitosa o fallida y confirma con el slider
        </DrawerDescription>

        <FinalizeStopForm
          key={`${stop.id}-${open}`}
          stop={stop}
          onCompleteStop={onCompleteStop}
          onClose={() => onOpenChange(false)}
          isSubmitting={isSubmitting}
        />
      </DrawerContent>
    </Drawer>
  );
}

export default TechnicianFinalizeStopDrawer;
