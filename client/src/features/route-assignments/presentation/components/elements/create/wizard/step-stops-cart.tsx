"use client";

import React from "react";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Route,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useRouteCreationWizard } from "@/features/route-assignments/presentation/state/route-creation-wizard-store";
import { FIXED_CODE_STATUSES, type FixedCodeStatusValue } from "@/features/map/domain/entities/fixed-code-status.entity";
import type { RouteCartStop } from "@/features/route-assignments/domain/entities/route-wizard.entity";

const badgeColors: Record<number, { bg: string; dot: string }> = {
  1: { bg: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  2: { bg: "bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  3: { bg: "bg-rose-50 text-rose-700", dot: "bg-rose-500" },
  4: { bg: "bg-orange-50 text-orange-700", dot: "bg-orange-500" },
  5: { bg: "bg-slate-100 text-slate-700", dot: "bg-slate-400" },
};

const getStatusBadge = (statusValue: number) => {
  const def = FIXED_CODE_STATUSES[statusValue as FixedCodeStatusValue];
  const conf = badgeColors[statusValue] ?? {
    bg: "bg-slate-100 text-slate-700",
    dot: "bg-slate-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border-0 shadow-none ${conf.bg}`}
    >
      <span className={`size-1.5 rounded-full ${conf.dot} shrink-0`} />
      <span>{def?.label ?? `Estado ${statusValue}`}</span>
    </span>
  );
};

export function StepStopsCart() {
  const {
    cartStops,
    startingPoint,
    removeStop,
    calculationState,
    calculateRoutes,
    nextStep,
    prevStep,
  } = useRouteCreationWizard();

  const isCalculateEnabled =
    Boolean(startingPoint) &&
    cartStops.length > 0 &&
    calculationState !== "calculating";

  return (
    <div className="flex flex-col h-full min-h-0 justify-between select-none">
      {cartStops.length === 0 ? (
        <>
          {/* Cabecera cuando no hay paradas */}
          <div className="px-6 pt-1 pb-2 shrink-0">
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
              Paradas de la ruta
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mt-1">
              Usa el buscador para añadir viviendas al recorrido.
            </p>
          </div>

          {/* Gráfico 3D de Casa con Lupa posicionado arriba */}
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-start px-6 pt-3 sm:pt-4 pb-2">
            <div className="relative w-48 h-40 sm:w-56 sm:h-48 flex items-center justify-center mt-1">
              <Image
                src="/assignment-route/start-select-stops.webp"
                alt="Buscar y agregar viviendas a la ruta"
                fill
                sizes="224px"
                priority
                unoptimized
                className="object-contain"
              />
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Cabecera con contador debajo de la descripción */}
          <div className="px-6 pt-1 pb-2 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  Paradas de la ruta
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                  Viviendas añadidas al recorrido de la asignación.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent("minimize-wizard-sheet"));
                }}
                className="lg:hidden h-8 px-3 rounded-full bg-blue-50 text-blue-600 text-[11px] font-bold flex items-center gap-1 border-0 cursor-pointer active:scale-95"
              >
                <span>+ Agregar</span>
              </button>
            </div>
            <div className="mt-2">
              <span className="inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                {cartStops.length} {cartStops.length === 1 ? "parada" : "paradas"}
              </span>
            </div>
          </div>

          {/* Lista de paradas fija (sin drag and drop) */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-1 space-y-2.5 scrollbar-thin scrollbar-thumb-slate-200">
            {cartStops.map((stop: RouteCartStop) => (
              <div
                key={stop.id}
                className="w-full bg-slate-100/90 hover:bg-slate-200/70 rounded-2xl p-3 border-0 shadow-none transition-colors flex items-center justify-between gap-2.5"
              >
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  {/* Badge de Orden Secuencial (1..N) */}
                  <div className="size-6 rounded-full bg-[#0e4dcb] text-white font-bold text-[11px] flex items-center justify-center shrink-0 shadow-none">
                    {stop.orderIndex}
                  </div>

                  {/* Datos de la Vivienda */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <span className="text-xs font-bold text-slate-900 font-mono block">
                      #{stop.fixedCode}
                    </span>
                    <p className="text-[11px] text-slate-600 truncate font-medium">
                      {stop.name || "Sin titular registrado"}
                    </p>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <span className="text-[10px] sm:text-[11px] font-medium text-slate-500">
                        Estado actual:
                      </span>
                      {getStatusBadge(stop.status)}
                    </div>
                  </div>
                </div>

                {/* Botón para remover del carrito */}
                <button
                  type="button"
                  onClick={() => removeStop(stop.id)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors shrink-0 cursor-pointer border-0 shadow-none bg-transparent"
                  title="Quitar parada"
                >
                  <Trash2 className="size-4 stroke-[2]" />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 3. Barra inferior fija con acciones planas */}
      <div className="px-6 py-3 pb-6 sm:pb-4 flex items-center justify-between gap-3 border-t border-slate-100 bg-white shrink-0">
        <button
          type="button"
          onClick={prevStep}
          className="h-11 px-5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200/80 border-0 shadow-none flex items-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0"
        >
          <ArrowLeft className="size-3.5 stroke-[2.5]" />
          <span>Atrás</span>
        </button>

        {cartStops.length === 0 ? (
          <>
            {/* En Escritorio: botón Calcular rutas deshabilitado */}
            <button
              type="button"
              disabled
              className="hidden lg:flex h-11 px-6 rounded-full font-semibold text-xs items-center gap-2 border-0 shadow-none bg-slate-100 text-slate-400 cursor-not-allowed shrink-0"
            >
              <Route className="size-3.5 stroke-[2]" />
              <span>Calcular rutas</span>
            </button>

            {/* En Móviles y Tablets: botón Ir al buscador para cerrar el sheet y buscar viviendas */}
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("minimize-wizard-sheet"));
              }}
              className="lg:hidden h-11 px-6 rounded-full font-semibold text-xs flex items-center gap-2 border-0 shadow-none bg-gradient-to-r from-[#0e4dcb] via-[#1a66e5] to-[#2579f6] text-white hover:opacity-95 active:scale-[0.98] cursor-pointer shrink-0"
            >
              <span>Ir al buscador</span>
              <ArrowRight className="size-3.5 stroke-[2.5]" />
            </button>
          </>
        ) : calculationState === "calculated" ? (
          <button
            type="button"
            onClick={nextStep}
            className="h-11 px-6 rounded-full bg-gradient-to-r from-[#0e4dcb] via-[#1a66e5] to-[#2579f6] text-white font-semibold text-xs border-0 shadow-none flex items-center gap-2 transition hover:opacity-95 active:scale-[0.98] cursor-pointer animate-in fade-in zoom-in-95 shrink-0"
          >
            <span>Finalizar</span>
            <ArrowRight className="size-3.5 stroke-[2.5]" />
          </button>
        ) : (
          <button
            type="button"
            onClick={calculateRoutes}
            disabled={!isCalculateEnabled}
            className={`h-11 px-6 rounded-full font-semibold text-xs flex items-center gap-2 transition border-0 shadow-none shrink-0 ${
              isCalculateEnabled
                ? "bg-gradient-to-r from-[#0e4dcb] via-[#1a66e5] to-[#2579f6] text-white hover:opacity-95 active:scale-[0.98] cursor-pointer"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            {calculationState === "calculating" ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                <span>Optimizando trayecto...</span>
              </>
            ) : (
              <>
                <Route className="size-3.5 stroke-[2]" />
                <span>Calcular rutas</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

export default StepStopsCart;
