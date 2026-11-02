"use client";

import React from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useRouteCreationWizard } from "@/features/route-assignments/presentation/state/route-creation-wizard-store";
import type { RouteServiceType } from "@/features/route-assignments/domain/entities/route-wizard.entity";
import { cn } from "@/lib/utils";

export function StepServiceType() {
  const { serviceType, selectServiceType, nextStep, prevStep, canAdvance } =
    useRouteCreationWizard();

  const handleSelect = (type: RouteServiceType) => {
    selectServiceType(type);
  };

  return (
    <div className="flex flex-col h-full min-h-0 justify-between select-none">
      {/* 1. Cabecera con título y descripción simple */}
      <div className="px-6 pt-1 pb-3 shrink-0">
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Tipo de servicio
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
          Selecciona una opción.
        </p>
      </div>

      {/* 2. Cuerpo de opciones interactivas planas con imágenes 3D */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-2 space-y-4">
        {/* Opción 1: Corte de servicio */}
        <div
          onClick={() => handleSelect("CUT")}
          className={cn(
            "p-3.5 sm:p-4 rounded-3xl bg-[#edf4fe] border-0 shadow-none transition-all cursor-pointer flex items-center justify-between gap-3 relative select-none hover:bg-[#e4effd] active:scale-[0.99]",
            serviceType === "CUT" && "ring-2 ring-[#0e4dcb]/40 bg-[#e4effd]"
          )}
        >
          {/* Imagen 3D alineada a la izquierda */}
          <div className="relative w-28 sm:w-32 h-20 shrink-0 flex items-center justify-center">
            <Image
              src="/assignment-route/corte.webp"
              alt="Corte de servicio"
              fill
              sizes="128px"
              priority
              unoptimized
              className="object-contain pointer-events-none"
            />
          </div>

          {/* Línea divisoria vertical sutil */}
          <div className="w-[1.5px] h-12 bg-blue-200/80 shrink-0" />

          {/* Nombre del servicio a la derecha */}
          <div className="flex-1 min-w-0 pl-1">
            <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              Corte de <br /> servicio
            </h4>
          </div>

          {/* Checkbox circular azul o borde blanco */}
          <div className="pr-1 shrink-0">
            {serviceType === "CUT" ? (
              <div className="size-7 rounded-full bg-[#0e4dcb] text-white flex items-center justify-center shadow-none">
                <Check className="size-4 stroke-[3]" />
              </div>
            ) : (
              <div className="size-7 rounded-full border-2 border-slate-300 bg-white shadow-none" />
            )}
          </div>
        </div>

        {/* Opción 2: Reconexión de servicio */}
        <div
          onClick={() => handleSelect("RECONNECTION")}
          className={cn(
            "p-3.5 sm:p-4 rounded-3xl bg-[#edf4fe] border-0 shadow-none transition-all cursor-pointer flex items-center justify-between gap-3 relative select-none hover:bg-[#e4effd] active:scale-[0.99]",
            serviceType === "RECONNECTION" && "ring-2 ring-[#0e4dcb]/40 bg-[#e4effd]"
          )}
        >
          {/* Imagen 3D alineada a la izquierda */}
          <div className="relative w-28 sm:w-32 h-20 shrink-0 flex items-center justify-center">
            <Image
              src="/assignment-route/reconexion.webp"
              alt="Reconexión de servicio"
              fill
              sizes="128px"
              priority
              unoptimized
              className="object-contain pointer-events-none"
            />
          </div>

          {/* Línea divisoria vertical sutil */}
          <div className="w-[1.5px] h-12 bg-blue-200/80 shrink-0" />

          {/* Nombre del servicio a la derecha */}
          <div className="flex-1 min-w-0 pl-1">
            <h4 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              Reconexión <br /> de servicio
            </h4>
          </div>

          {/* Checkbox circular azul o borde blanco */}
          <div className="pr-1 shrink-0">
            {serviceType === "RECONNECTION" ? (
              <div className="size-7 rounded-full bg-[#0e4dcb] text-white flex items-center justify-center shadow-none">
                <Check className="size-4 stroke-[3]" />
              </div>
            ) : (
              <div className="size-7 rounded-full border-2 border-slate-300 bg-white shadow-none" />
            )}
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

export default StepServiceType;
