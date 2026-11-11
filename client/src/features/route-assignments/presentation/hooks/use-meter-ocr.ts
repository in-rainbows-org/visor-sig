"use client";

import { useCallback, useState } from "react";
import type {
  MeterOcrResult,
  OcrModelStatus,
  OcrProcessingState,
  RoiCropBounds,
} from "../../domain/entities/meter-ocr.entity";
import { yoloMeterOcrService } from "../../infrastructure/services/yolo-meter-ocr.service";

/**
 * Coordenadas relativas por defecto correspondientes a la guía de enfoque del visor de cámara
 */
export const DEFAULT_METER_ROI: RoiCropBounds = {
  topPercent: 0.22,
  leftPercent: 0.07,
  widthPercent: 0.86,
  heightPercent: 0.18,
};

export function useMeterOcr() {
  const [modelStatus, setModelStatus] = useState<OcrModelStatus>(
    yoloMeterOcrService.isReady() ? "READY" : "UNLOADED"
  );
  const [processingState, setProcessingState] =
    useState<OcrProcessingState>("IDLE");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /**
   * Asegura la carga del modelo antes de abrir la cámara.
   * Si no está en caché, descarga los pesos mostrando estado INITIALIZING.
   */
  const preloadModel = useCallback(async (): Promise<boolean> => {
    if (yoloMeterOcrService.isReady()) {
      setModelStatus("READY");
      return true;
    }

    setModelStatus("INITIALIZING");
    setErrorMessage(null);

    const loaded = await yoloMeterOcrService.ensureLoaded();
    if (loaded) {
      setModelStatus("READY");
      return true;
    } else {
      setModelStatus("ERROR");
      setErrorMessage(
        "No se pudo descargar o inicializar el modelo local de lectura."
      );
      return false;
    }
  }, []);

  /**
   * Ejecuta el recorte y la inferencia OCR sobre un canvas del video.
   */
  const processCapture = useCallback(
    async (
      sourceCanvas: HTMLCanvasElement,
      roi: RoiCropBounds = DEFAULT_METER_ROI
    ): Promise<MeterOcrResult> => {
      setProcessingState("ANALYZING");
      setErrorMessage(null);

      try {
        const result = await yoloMeterOcrService.recognizeMeterReading(
          sourceCanvas,
          roi
        );

        if (result.isComplete) {
          setProcessingState("SUCCESS");
          setErrorMessage(null);
        } else {
          setProcessingState("FAILED");
          setErrorMessage(
            result.error ??
              "No se pudieron detectar los 6 dígitos del medidor. Por favor vuelve a tomar la foto enfocando bien el dial o ingresa la lectura manualmente."
          );
        }

        return result;
      } catch (err) {
        console.error("Error en useMeterOcr.processCapture:", err);
        const errorText =
          err instanceof Error
            ? err.message
            : "Error inesperado durante el reconocimiento óptico.";
        setProcessingState("FAILED");
        setErrorMessage(errorText);

        return {
          success: false,
          rawText: "",
          digits: "",
          isComplete: false,
          confidence: 0,
          error: errorText,
        };
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  const resetOcrState = useCallback(() => {
    setProcessingState("IDLE");
    setErrorMessage(null);
  }, []);

  return {
    modelStatus,
    processingState,
    isInitializing: modelStatus === "INITIALIZING",
    isAnalyzing: processingState === "ANALYZING",
    errorMessage,
    preloadModel,
    processCapture,
    clearError,
    resetOcrState,
  };
}
