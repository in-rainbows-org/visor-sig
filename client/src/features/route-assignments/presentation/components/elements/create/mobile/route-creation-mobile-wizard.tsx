"use client";

import React from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { RouteWizardStep } from "@/features/route-assignments/domain/entities/route-wizard.entity";
import { useRouteCreationWizard } from "@/features/route-assignments/presentation/state/route-creation-wizard-store";
import { WizardProgressHeader } from "../wizard/wizard-progress-header";
import { StepWelcome } from "../wizard/step-welcome";
import { StepTechnician } from "../wizard/step-technician";
import { StepStartingPoint } from "../wizard/step-starting-point";
import { StepStopsCart } from "../wizard/step-stops-cart";
import { StepSummary } from "../wizard/step-summary";
import type { RouteCreationMobileWizardProps } from "./types";
import { cn } from "@/lib/utils";

export function RouteCreationMobileWizard({
  isOpen,
  onOpenChange,
  className = "",
}: RouteCreationMobileWizardProps) {
  const { currentStep } = useRouteCreationWizard();

  const transitionVariants = {
    initial: (direction: number) => ({
      opacity: 0,
      x: direction > 0 ? 18 : -18,
    }),
    animate: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.22,
        ease: "easeOut" as const,
      },
    },
    exit: (direction: number) => ({
      opacity: 0,
      x: direction > 0 ? -18 : 18,
      transition: {
        duration: 0.18,
        ease: "easeIn" as const,
      },
    }),
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className={cn(
          "fixed inset-0 top-0 bottom-0 left-0 right-0 h-[100dvh] max-h-[100dvh] h-screen max-h-screen w-full p-0 m-0 bg-white border-0 shadow-none rounded-none flex flex-col z-[2000] overflow-hidden outline-none data-[side=bottom]:inset-x-0 data-[side=bottom]:top-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-full data-[side=bottom]:max-h-full",
          className
        )}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Asistente de Asignación de Rutas</SheetTitle>
        </SheetHeader>

        {/* 1. Barra de Control Superior Móvil: Manija táctil y botón X de cierre */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2 shrink-0 bg-white border-b border-slate-100">
          <div className="w-8" />
          <div className="w-12 h-1 rounded-full bg-slate-300 select-none" />
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="size-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 transition-all cursor-pointer border-0"
            aria-label="Cerrar asistente"
          >
            <X className="size-4 stroke-[2.5]" />
          </button>
        </div>

        {/* 2. Barra de Progreso del Wizard (Pasos 1 a 3) */}
        <div className="shrink-0 bg-white">
          <WizardProgressHeader currentStep={currentStep} />
        </div>

        {/* 3. Contenedor del Paso Activo con min-h-0 para permitir scroll interno */}
        <div className="flex-1 min-h-0 overflow-hidden relative bg-white flex flex-col">
          <AnimatePresence mode="wait" custom={1}>
            {currentStep === RouteWizardStep.WELCOME && (
              <motion.div
                key="mobile-step-welcome"
                custom={1}
                variants={transitionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full h-full min-h-0 flex flex-col flex-1"
              >
                <StepWelcome />
              </motion.div>
            )}

            {currentStep === RouteWizardStep.TECHNICIAN && (
              <motion.div
                key="mobile-step-technician"
                custom={1}
                variants={transitionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full h-full min-h-0 flex flex-col flex-1"
              >
                <StepTechnician />
              </motion.div>
            )}

            {currentStep === RouteWizardStep.STARTING_POINT && (
              <motion.div
                key="mobile-step-starting-point"
                custom={1}
                variants={transitionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full h-full min-h-0 flex flex-col flex-1"
              >
                <StepStartingPoint />
              </motion.div>
            )}

            {currentStep === RouteWizardStep.STOPS_CART && (
              <motion.div
                key="mobile-step-stops-cart"
                custom={1}
                variants={transitionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full h-full min-h-0 flex flex-col flex-1"
              >
                <StepStopsCart />
              </motion.div>
            )}

            {currentStep === RouteWizardStep.SUMMARY && (
              <motion.div
                key="mobile-step-summary"
                custom={1}
                variants={transitionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full h-full min-h-0 flex flex-col flex-1"
              >
                <StepSummary />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default RouteCreationMobileWizard;
