"use client";

import React from "react";
import { ArrowRight, User, Calendar, Scissors, MapPin, Home, FileCheck } from "lucide-react";
import { RouteWizardStep } from "@/features/route-assignments/domain/entities/route-wizard.entity";
import type { RouteCreationMobileTriggerProps } from "./types";
import { cn } from "@/lib/utils";

export function RouteCreationMobileTrigger({
  currentStep,
  cartStopsCount,
  isOpen,
  onOpen,
  className = "",
}: RouteCreationMobileTriggerProps) {
  // Si el Bottom Sheet ya está abierto, ocultamos el botón activador para evitar colisiones
  if (isOpen) {
    return null;
  }

  const getTriggerConfig = () => {
    switch (currentStep) {
      case RouteWizardStep.WELCOME:
        return {
          label: "Comenzar asignación",
          icon: <ArrowRight className="size-4 stroke-[2.5]" />,
        };
      case RouteWizardStep.TECHNICIAN:
        return {
          label: "Continuar con Paso 1: Técnico",
          icon: <User className="size-4 stroke-[2.5]" />,
        };
      case RouteWizardStep.SCHEDULE_DATE:
        return {
          label: "Continuar con Paso 2: Fecha de asignación",
          icon: <Calendar className="size-4 stroke-[2.5]" />,
        };
      case RouteWizardStep.SERVICE_TYPE:
        return {
          label: "Continuar con Paso 3: Tipo de servicio",
          icon: <Scissors className="size-4 stroke-[2.5]" />,
        };
      case RouteWizardStep.STARTING_POINT:
        return {
          label: "Continuar con Paso 4: Punto de partida",
          icon: <MapPin className="size-4 stroke-[2.5]" />,
        };
      case RouteWizardStep.STOPS_CART:
        return {
          label: `Continuar con Paso 5: Paradas (${cartStopsCount})`,
          icon: <Home className="size-4 stroke-[2.5]" />,
        };
      case RouteWizardStep.SUMMARY:
        return {
          label: "Ver resumen de asignación",
          icon: <FileCheck className="size-4 stroke-[2.5]" />,
        };
      default:
        return {
          label: "Abrir asistente",
          icon: <ArrowRight className="size-4 stroke-[2.5]" />,
        };
    }
  };

  const { label, icon } = getTriggerConfig();

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 right-4 z-40 lg:hidden pointer-events-auto select-none",
        className
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={label}
        className="w-full h-12 min-h-[48px] rounded-full bg-gradient-to-r from-[#0e4dcb] via-[#1a66e5] to-[#2579f6] text-white font-semibold text-xs sm:text-sm shadow-none border-0 outline-none ring-0 flex items-center justify-center gap-2.5 active:scale-[0.99] transition-transform duration-150 cursor-pointer select-none"
      >
        <span>{label}</span>
        {icon}
      </button>
    </div>
  );
}

export default RouteCreationMobileTrigger;
