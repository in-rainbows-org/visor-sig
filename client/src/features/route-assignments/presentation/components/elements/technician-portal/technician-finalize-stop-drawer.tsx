"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  ChevronRight,
  ChevronLeft,
  Camera,
  RotateCcw,
  X,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { SlideConfirm } from "@/components/ui/slide-confirm";
import type { AssignmentStopDetail } from "@/features/route-assignments/domain/entities/assignment-detail.entity";
import type {
  CompleteStopInput,
  StopCompletionChoice,
  FinalizeWizardStep,
  TechnicianCameraCapturePayload,
} from "@/features/route-assignments/domain/entities/assignment-execution.entity";
import { useMeterOcr } from "@/features/route-assignments/presentation/hooks/use-meter-ocr";
import { TechnicianCameraViewfinder } from "./technician-camera-viewfinder";
import { WaterMeterOtpInput } from "./water-meter-otp-input";
import { QuickObservationPills } from "./quick-observation-pills";

export interface TechnicianFinalizeStopDrawerProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly stop: AssignmentStopDetail | null;
  readonly onCompleteStop: (
    stopId: string,
    data: CompleteStopInput
  ) => Promise<boolean>;
  readonly isSubmitting?: boolean;
}

interface FinalizeStopWizardProps {
  readonly stop: AssignmentStopDetail;
  readonly onCompleteStop: (
    stopId: string,
    data: CompleteStopInput
  ) => Promise<boolean>;
  readonly onClose: () => void;
  readonly isSubmitting: boolean;
}

function FinalizeStopWizard({
  stop,
  onCompleteStop,
  onClose,
  isSubmitting,
}: FinalizeStopWizardProps) {
  const { preloadModel, isInitializing: isOcrInitializing } = useMeterOcr();
  const [step, setStep] = useState<FinalizeWizardStep>("OUTCOME");
  const [choice, setChoice] = useState<StopCompletionChoice | null>(null);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [meterReading, setMeterReading] = useState<string>("");
  const [observation, setObservation] = useState<string>("");
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [ocrAlertMessage, setOcrAlertMessage] = useState<string | null>(null);

  const isFailed = choice === "FAILED";

  // Step validation
  const canAdvanceStep1 = choice !== null;
  const canAdvanceStep2 = evidenceFile !== null && meterReading.length === 6;
  const isSliderDisabled =
    isSubmitting ||
    !choice ||
    (isFailed && !observation.trim());

  const handleNextStep = () => {
    if (step === "OUTCOME" && canAdvanceStep1) {
      setStep("METER_READING");
    } else if (step === "METER_READING" && canAdvanceStep2) {
      setStep("OBSERVATION");
    }
  };

  const handlePreviousStep = () => {
    if (step === "OBSERVATION") {
      setStep("METER_READING");
    } else if (step === "METER_READING") {
      setStep("OUTCOME");
    }
  };

  const handleConfirm = async () => {
    if (!choice || isSliderDisabled) return;

    const payload: CompleteStopInput = {
      status: choice,
      observation:
        observation.trim() ||
        (isFailed ? "Visita no completada por el técnico" : undefined),
      meterReading: meterReading.trim() || undefined,
      evidenceFile: evidenceFile ?? undefined,
    };

    const ok = await onCompleteStop(stop.id, payload);
    if (ok) {
      onClose();
    }
  };

  const handleOpenCamera = async () => {
    setOcrAlertMessage(null);
    // Pre-descarga o carga el modelo en WASM si aún no está montado
    await preloadModel();
    setIsCameraOpen(true);
  };

  const handleCaptureComplete = ({
    file,
    detectedDigits,
    ocrError,
  }: TechnicianCameraCapturePayload) => {
    setEvidenceFile(file);
    setIsCameraOpen(false);

    if (detectedDigits && detectedDigits.length === 6) {
      setMeterReading(detectedDigits);
      setOcrAlertMessage(null);
    } else {
      setMeterReading("");
      setOcrAlertMessage(
        ocrError ||
          "No se pudieron detectar los 6 dígitos del medidor. Por favor vuelve a tomar la foto enfocando bien los números dentro del marco."
      );
    }
  };

  return (
    <>
      {/* Visor de cámara a pantalla completa con soporte OCR (montado únicamente cuando está abierto) */}
      {isCameraOpen && (
        <TechnicianCameraViewfinder
          isOpen={isCameraOpen}
          onCaptureComplete={handleCaptureComplete}
          onClose={() => setIsCameraOpen(false)}
        />
      )}

      <div className="w-full pt-1 shrink-0" />

      {/* Contenedor animado de los 3 pasos */}
      <div className="flex-1 min-w-0 overflow-y-auto px-4 py-2 space-y-4 overscroll-contain scrollbar-thin scrollbar-thumb-slate-200">
        <AnimatePresence mode="wait">
          {step === "OUTCOME" && (
            <motion.div
              key="step-outcome"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="space-y-4"
            >
              {/* Card de información de la parada (celeste más notorio, sin sombras ni bordes) */}
              <div className="bg-sky-100 rounded-2xl p-3.5 flex items-center gap-3.5 select-none">
                <div className="relative size-14 shrink-0 rounded-xl overflow-hidden bg-white/70 p-1 flex items-center justify-center">
                  <Image
                    src="/technician-routes/stop-info.webp"
                    alt="Información de parada"
                    fill
                    sizes="56px"
                    className="object-contain"
                    priority
                  />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center space-y-0.5">
                  <span className="text-[#0e4dcb] font-bold text-xs sm:text-sm">
                    Parada número {stop.orderIndex}
                  </span>
                  <span className="text-slate-600 font-medium text-xs font-mono">
                    Código fijo: {stop.fixedCode ?? "S/C"}
                  </span>
                  <span className="text-slate-800 font-semibold text-xs sm:text-sm truncate">
                    Propietario: {stop.name || "Sin titular registrado"}
                  </span>
                </div>
              </div>

              {/* Título de resultado alineado a la izquierda */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-slate-700 tracking-tight block text-left">
                  Resultado de la visita *
                </span>

                {/* Grid 2 columnas: Exitoso vs Fallido con imágenes 3D */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Botón Exitoso */}
                  <button
                    type="button"
                    onClick={() => setChoice("SUCCESS")}
                    className={`rounded-2xl p-4 flex flex-col items-center justify-center gap-2.5 cursor-pointer border-0 shadow-none outline-none select-none transition-all active:scale-98 ${
                      choice === "SUCCESS"
                        ? "bg-emerald-500 text-white font-bold"
                        : "bg-slate-100 hover:bg-slate-200/70 text-slate-700 font-medium"
                    }`}
                  >
                    <div className="relative size-14 flex items-center justify-center">
                      <Image
                        src="/technician-routes/success.webp"
                        alt="Resultado exitoso"
                        fill
                        sizes="56px"
                        className="object-contain drop-shadow-sm"
                        priority
                      />
                    </div>
                    <span className="text-xs sm:text-sm tracking-tight">
                      Exitoso
                    </span>
                  </button>

                  {/* Botón Fallido */}
                  <button
                    type="button"
                    onClick={() => setChoice("FAILED")}
                    className={`rounded-2xl p-4 flex flex-col items-center justify-center gap-2.5 cursor-pointer border-0 shadow-none outline-none select-none transition-all active:scale-98 ${
                      choice === "FAILED"
                        ? "bg-rose-500 text-white font-bold"
                        : "bg-slate-100 hover:bg-slate-200/70 text-slate-700 font-medium"
                    }`}
                  >
                    <div className="relative size-14 flex items-center justify-center">
                      <Image
                        src="/technician-routes/failed.webp"
                        alt="Resultado fallido"
                        fill
                        sizes="56px"
                        className="object-contain drop-shadow-sm"
                        priority
                      />
                    </div>
                    <span className="text-xs sm:text-sm tracking-tight">
                      Fallido
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === "METER_READING" && (
            <motion.div
              key="step-meter"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="space-y-4"
            >
              {/* Barra de retroceso y título */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handlePreviousStep}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition py-1 cursor-pointer border-0 bg-transparent"
                >
                  <ChevronLeft className="size-4" />
                  <span>Atrás</span>
                </button>
                <span className="text-[11px] font-semibold text-slate-400">
                  Paso 2 de 3
                </span>
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 text-left">
                  Lectura de medidor de agua
                </h3>
              </div>

              {/* Botón azul de captura de cámara (redondeado, totalmente plano) */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleOpenCamera}
                  disabled={isOcrInitializing}
                  className="w-full h-11 sm:h-12 rounded-full bg-[#0e4dcb] hover:bg-[#0c40a8] active:scale-98 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border-0 outline-none shadow-none transition-all cursor-pointer disabled:opacity-75 disabled:cursor-wait"
                >
                  {isOcrInitializing ? (
                    <>
                      <Loader2 className="size-4 animate-spin text-white" />
                      <span>Cargando modelo IA...</span>
                    </>
                  ) : evidenceFile ? (
                    <>
                      <RotateCcw className="size-4 stroke-[2.5]" />
                      <span>Volver a tomar foto</span>
                    </>
                  ) : (
                    <>
                      <Camera className="size-4.5 stroke-[2.5]" />
                      <span>Tomar foto del medidor</span>
                    </>
                  )}
                </button>

                {evidenceFile && (
                  <div className="flex justify-center mt-2 select-none">
                    <span className="inline-flex items-center px-4 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 shadow-xs">
                      Foto adjuntada
                    </span>
                  </div>
                )}

                {/* Alerta amigable si la IA no detectó los 6 dígitos */}
                {ocrAlertMessage && (
                  <div className="mt-2.5 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 animate-in fade-in duration-200 select-none">
                    <AlertTriangle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1 space-y-0.5">
                      <p className="font-semibold text-amber-950">Lectura no completada por IA</p>
                      <p className="text-[11px] text-amber-800 leading-relaxed">
                        {ocrAlertMessage}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOcrAlertMessage(null)}
                      className="text-amber-600 hover:text-amber-900 transition p-0.5 cursor-pointer border-0 bg-transparent"
                      aria-label="Cerrar advertencia"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Medidor OTP de sólo lectura (autocompletado exclusivamente por IA) */}
              <div className="pt-1">
                <WaterMeterOtpInput
                  value={meterReading}
                  onChange={setMeterReading}
                  readOnly={true}
                />
              </div>
            </motion.div>
          )}

          {step === "OBSERVATION" && (
            <motion.div
              key="step-observation"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="space-y-4"
            >
              {/* Barra de retroceso y título */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handlePreviousStep}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition py-1 cursor-pointer border-0 bg-transparent"
                >
                  <ChevronLeft className="size-4" />
                  <span>Atrás</span>
                </button>
                <span className="text-[11px] font-semibold text-slate-400">
                  Paso 3 de 3
                </span>
              </div>

              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 text-left">
                  Observación
                </h3>
              </div>

              {/* Selector de píldoras rápidas */}
              <div className="pt-1">
                <QuickObservationPills
                  choice={choice!}
                  value={observation}
                  onChange={setObservation}
                  disabled={isSubmitting}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer adaptable al paso activo */}
      <DrawerFooter className="pt-2 pb-4 px-4 border-t border-slate-100 bg-white/70 space-y-2 shadow-none">
        {step !== "OBSERVATION" ? (
          <div className="w-full">
            <button
              type="button"
              disabled={
                step === "OUTCOME" ? !canAdvanceStep1 : !canAdvanceStep2
              }
              onClick={handleNextStep}
              className="w-full h-11 rounded-full bg-[#0e4dcb] hover:bg-[#0c40a8] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer border-0 outline-none disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none shadow-sm"
            >
              <span>Siguiente</span>
              <ChevronRight className="size-4 stroke-[2.5]" />
            </button>
          </div>
        ) : (
          <div className="w-full">
            <SlideConfirm
              height={49}
              text="Desliza para finalizar la parada"
              confirmedText="Finalizando parada..."
              variant="emerald"
              disabled={isSliderDisabled}
              onConfirm={handleConfirm}
            />
          </div>
        )}

        <DrawerClose asChild>
          <button
            type="button"
            className="w-full h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition active:scale-98 cursor-pointer border-0 inline-flex items-center justify-center gap-1.5"
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
          Flujo guiado para registrar la visita técnica con cámara, medidor OTP y observación
        </DrawerDescription>

        <FinalizeStopWizard
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
