"use client";

import React from "react";
import { RouteWizardStep } from "@/features/route-assignments/domain/entities/route-wizard.entity";

export type WizardProgressHeaderProps = {
  currentStep: RouteWizardStep;
};

export function WizardProgressHeader({ currentStep }: WizardProgressHeaderProps) {
  // Solo se muestra en los pasos 1, 2 y 3 (no en bienvenida ni en el resumen final)
  if (
    currentStep === RouteWizardStep.WELCOME ||
    currentStep === RouteWizardStep.SUMMARY
  ) {
    return null;
  }

  const totalSteps = 5;
  const stepNumber = currentStep; // 1: Técnico, 2: Fecha, 3: Tipo de Servicio, 4: Punto de Partida, 5: Paradas

  const stepLabels: Record<number, string> = {
    1: "PASO 1: SELECCIONAR TÉCNICO",
    2: "PASO 2: FECHA DE ASIGNACIÓN",
    3: "PASO 3: TIPO DE SERVICIO",
    4: "PASO 4: PUNTO DE PARTIDA",
    5: "PASO 5: PARADAS Y CÁLCULO",
  };

  return (
    <div className="w-full px-6 pt-6 pb-2 select-none">
      <div className="flex items-center justify-between text-xs mb-2.5">
        <span className="font-bold text-blue-600 uppercase tracking-wider text-[11px]">
          {stepLabels[stepNumber] ?? `PASO ${stepNumber}`}
        </span>
        <span className="text-slate-500 font-semibold text-[11px]">
          {stepNumber} de {totalSteps}
        </span>
      </div>

      <div className="flex items-center gap-2 w-full">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => {
          const isCompleted = step < stepNumber;
          const isCurrent = step === stepNumber;

          return (
            <div
              key={step}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                isCompleted || isCurrent ? "bg-blue-600" : "bg-slate-200/90"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

export default WizardProgressHeader;
