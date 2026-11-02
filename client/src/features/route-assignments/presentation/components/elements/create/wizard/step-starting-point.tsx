"use client";

import React from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRouteCreationWizard } from "@/features/route-assignments/presentation/state/route-creation-wizard-store";

export function StepStartingPoint() {
  const { startingPoint, nextStep, prevStep, canAdvance } = useRouteCreationWizard();

  return (
    <div className="flex flex-col h-full min-h-0 justify-between select-none">
      {/* 1. Título y descripción limpia (sin botón volver superior) */}
      <div className="px-6 pt-1 pb-2 shrink-0">
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
          Punto de partida
        </h3>
        <p className="text-xs text-slate-500 leading-relaxed mt-1">
          Haz clic en cualquier calle o ubicación sobre el mapa para fijar la base o punto de inicio de esta asignación.
        </p>
      </div>

      {/* 2. Área Superior: Ilustración táctil 3D o Card verde suave de confirmación */}
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-start px-6 pt-3 sm:pt-4 pb-2">
        {startingPoint ? (
          <div className="w-full bg-[#eef9f2] rounded-3xl p-6 flex flex-col items-center justify-center text-center border-0 shadow-none animate-in fade-in-50 zoom-in-95 mt-1">
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 mb-3">
              <Image
                src="/assignment-route/start-point-selected.webp"
                alt="Punto de partida registrado"
                fill
                sizes="128px"
                priority
                unoptimized
                className="object-contain"
              />
            </div>

            <h4 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Punto de partida registrado
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-[220px] leading-relaxed">
              La ubicación de inicio ha sido seleccionada en el mapa.
            </p>
          </div>
        ) : (
          <div className="relative w-52 h-44 sm:w-60 sm:h-52 flex items-center justify-center mt-2">
            <Image
              src="/assignment-route/select-start-point.webp"
              alt="Seleccionar punto de partida en el mapa"
              fill
              sizes="256px"
              priority
              unoptimized
              className="object-contain"
            />
          </div>
        )}
      </div>

      {/* 3. Barra inferior fija con acciones planas (Atrás y Siguiente / Ir al mapa) */}
      <div className="px-6 py-3 pb-6 sm:pb-4 flex items-center justify-between border-t border-slate-100 bg-white shrink-0">
        <button
          type="button"
          onClick={prevStep}
          className="h-11 px-5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200/80 border-0 shadow-none flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="size-3.5 stroke-[2.5]" />
          <span>Atrás</span>
        </button>

        {/* En Escritorio (>= 1024px): Siguiente normal deshabilitado hasta que se fije el punto */}
        <button
          type="button"
          onClick={nextStep}
          disabled={!canAdvance}
          className={`hidden lg:flex h-11 px-6 rounded-full font-semibold text-xs items-center gap-2 transition border-0 shadow-none ${
            canAdvance
              ? "bg-gradient-to-r from-[#0e4dcb] via-[#1a66e5] to-[#2579f6] text-white hover:opacity-95 active:scale-[0.98] cursor-pointer"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          }`}
        >
          <span>Siguiente</span>
          <ArrowRight className="size-3.5 stroke-[2.5]" />
        </button>

        {/* En Móviles y Tablets (< 1024px): "Ir al mapa" para cerrar el sheet si no hay punto, "Siguiente" si ya se fijó */}
        <button
          type="button"
          onClick={() => {
            if (startingPoint) {
              nextStep();
            } else {
              window.dispatchEvent(new CustomEvent("minimize-wizard-sheet"));
            }
          }}
          className="lg:hidden h-11 px-6 rounded-full font-semibold text-xs flex items-center gap-2 transition border-0 shadow-none bg-gradient-to-r from-[#0e4dcb] via-[#1a66e5] to-[#2579f6] text-white hover:opacity-95 active:scale-[0.98] cursor-pointer"
        >
          <span>{startingPoint ? "Siguiente" : "Ir al mapa"}</span>
          <ArrowRight className="size-3.5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}

export default StepStartingPoint;
