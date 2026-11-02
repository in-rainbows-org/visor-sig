"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RouteWizardStep } from "@/features/route-assignments/domain/entities/route-wizard.entity";
import { useRouteCreationWizard } from "@/features/route-assignments/presentation/state/route-creation-wizard-store";
import { WizardProgressHeader } from "./wizard/wizard-progress-header";
import { StepWelcome } from "./wizard/step-welcome";
import { StepTechnician } from "./wizard/step-technician";
import { StepScheduleDate } from "./wizard/step-schedule-date";
import { StepServiceType } from "./wizard/step-service-type";
import { StepStartingPoint } from "./wizard/step-starting-point";
import { StepStopsCart } from "./wizard/step-stops-cart";
import { StepSummary } from "./wizard/step-summary";

export function RouteCreationWizardCard() {
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
    <div
      className="hidden lg:flex absolute lg:left-[96px] lg:w-[425px] top-[93px] bottom-4 z-[1000] pointer-events-auto flex-col bg-white rounded-2xl border-0 shadow-none overflow-hidden transition-all duration-300"
    >
      {/* 1. Indicador de Progreso Superior */}
      <WizardProgressHeader currentStep={currentStep} />

      {/* 2. Cuerpo del Paso con Transiciones Suaves */}
      <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait" custom={1}>
            {currentStep === RouteWizardStep.WELCOME && (
              <motion.div
                key="step-welcome"
                custom={1}
                variants={transitionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full h-full flex flex-col"
              >
                <StepWelcome />
              </motion.div>
            )}

            {currentStep === RouteWizardStep.TECHNICIAN && (
              <motion.div
                key="step-technician"
                custom={1}
                variants={transitionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full h-full flex flex-col"
              >
                <StepTechnician />
              </motion.div>
            )}

            {currentStep === RouteWizardStep.SCHEDULE_DATE && (
              <motion.div
                key="step-schedule-date"
                custom={1}
                variants={transitionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full h-full flex flex-col"
              >
                <StepScheduleDate />
              </motion.div>
            )}

            {currentStep === RouteWizardStep.SERVICE_TYPE && (
              <motion.div
                key="step-service-type"
                custom={1}
                variants={transitionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full h-full flex flex-col"
              >
                <StepServiceType />
              </motion.div>
            )}

            {currentStep === RouteWizardStep.STARTING_POINT && (
              <motion.div
                key="step-starting-point"
                custom={1}
                variants={transitionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full h-full flex flex-col"
              >
                <StepStartingPoint />
              </motion.div>
            )}

            {currentStep === RouteWizardStep.STOPS_CART && (
              <motion.div
                key="step-stops-cart"
                custom={1}
                variants={transitionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full h-full flex flex-col"
              >
                <StepStopsCart />
              </motion.div>
            )}

            {currentStep === RouteWizardStep.SUMMARY && (
              <motion.div
                key="step-summary"
                custom={1}
                variants={transitionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="w-full h-full flex flex-col"
              >
                <StepSummary />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
    </div>
  );
}

export default RouteCreationWizardCard;
