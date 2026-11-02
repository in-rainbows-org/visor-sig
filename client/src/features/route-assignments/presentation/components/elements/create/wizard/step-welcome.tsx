"use client";

import React from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRouteCreationWizard } from "@/features/route-assignments/presentation/state/route-creation-wizard-store";

export function StepWelcome() {
  const { startWizard, cancel } = useRouteCreationWizard();

  return (
    <div className="flex flex-col items-center justify-between h-full min-h-0 p-6 pb-6 sm:pb-4 text-center select-none overflow-y-auto">
      {/* Botón superior Volver en pastilla ovalada gris */}
      <div className="w-full flex justify-start shrink-0">
        <button
          type="button"
          onClick={cancel}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold transition-colors cursor-pointer border-0 shadow-none active:scale-95"
          title="Volver a asignaciones"
        >
          <ArrowLeft className="size-3.5 stroke-[2.5]" />
          <span>Volver</span>
        </button>
      </div>

      {/* Contenido Central: Gráfico 3D y título en negritas */}
      <div className="flex flex-col items-center my-auto max-w-[280px] shrink-0 py-2">
        <div className="relative w-44 h-44 sm:w-56 sm:h-56 mb-3">
          <Image
            src="/assignment-route/start-to-assign.webp"
            alt="Empecemos a crear una asignación"
            fill
            sizes="224px"
            priority
            unoptimized
            className="object-contain"
          />
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight text-center leading-snug">
          Empecemos a crear una asignación
        </h3>
      </div>

      {/* Pie con botón de inicio que ocupa todo el ancho con degradado oficial */}
      <div className="w-full pt-2 shrink-0">
        <button
          type="button"
          onClick={startWizard}
          className="w-full h-12 rounded-full font-semibold text-sm bg-gradient-to-r from-[#0e4dcb] via-[#1a66e5] to-[#2579f6] text-white hover:opacity-95 active:scale-[0.98] border-0 shadow-none flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <span>Comencemos</span>
          <ArrowRight className="size-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}

export default StepWelcome;
