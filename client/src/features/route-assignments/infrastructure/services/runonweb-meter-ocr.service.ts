import type { MeterOcrResult, RoiCropBounds } from "../../domain/entities/meter-ocr.entity";
import {
  type MeterOcrService,
  cropAndPreprocessRoi,
} from "../../domain/services/meter-ocr.service";

/**
 * Implementación de infraestructura para OCR de medidores utilizando runonweb
 * ejecutado 100% en el cliente mediante WebAssembly (WASM).
 */
export class RunonwebMeterOcrService implements MeterOcrService {
  private static instance: RunonwebMeterOcrService | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private ocrEngine: any = null;
  private loadPromise: Promise<boolean> | null = null;
  private isModelReady = false;

  private constructor() {}

  public static getInstance(): RunonwebMeterOcrService {
    if (!RunonwebMeterOcrService.instance) {
      RunonwebMeterOcrService.instance = new RunonwebMeterOcrService();
    }
    return RunonwebMeterOcrService.instance;
  }

  public isReady(): boolean {
    return this.isModelReady && this.ocrEngine !== null;
  }

  public async ensureLoaded(): Promise<boolean> {
    if (typeof window === "undefined") {
      return false;
    }

    if (this.isReady()) {
      return true;
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = (async () => {
      try {
        const { OCR } = await import("runonweb/ocr");
        const ocr = new OCR({
          size: "medium",
          device: "wasm",
        });

        await ocr.load();
        this.ocrEngine = ocr;
        this.isModelReady = true;
        return true;
      } catch (error) {
        console.error("Error al inicializar runonweb/ocr WASM:", error);
        this.ocrEngine = null;
        this.isModelReady = false;
        return false;
      } finally {
        this.loadPromise = null;
      }
    })();

    return this.loadPromise;
  }

  public async recognizeMeterReading(
    sourceCanvas: HTMLCanvasElement,
    roi: RoiCropBounds
  ): Promise<MeterOcrResult> {
    try {
      const ready = await this.ensureLoaded();
      if (!ready || !this.ocrEngine) {
        return {
          success: false,
          rawText: "",
          digits: "",
          isComplete: false,
          confidence: 0,
          error: "El motor de OCR no pudo ser inicializado.",
        };
      }

      // Preprocesamiento de la región de interés con contraste y escala de grises
      const preprocessedCanvas = cropAndPreprocessRoi(sourceCanvas, roi);

      // Inferencia con runonweb
      const result = await this.ocrEngine.read(preprocessedCanvas);
      const rawText: string = result?.text ?? "";
      
      // Filtrado estricto: únicamente dígitos numéricos del 0 al 9
      const digitsOnly = rawText.replace(/\D/g, "");
      const isComplete = digitsOnly.length >= 6;
      const normalizedDigits = digitsOnly.slice(0, 6);
      const confidence = typeof result?.confidence === "number" ? result.confidence : 0;

      return {
        success: isComplete,
        rawText,
        digits: normalizedDigits,
        isComplete,
        confidence,
        error: isComplete
          ? null
          : "No se pudieron detectar los 6 dígitos del medidor.",
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Error inesperado durante el reconocimiento OCR.";
      console.error("Error en inferencia OCR:", error);
      return {
        success: false,
        rawText: "",
        digits: "",
        isComplete: false,
        confidence: 0,
        error: message,
      };
    }
  }

  public async dispose(): Promise<void> {
    if (this.ocrEngine) {
      try {
        await this.ocrEngine.dispose();
      } catch (error) {
        console.warn("Advertencia al liberar motor OCR:", error);
      }
      this.ocrEngine = null;
      this.isModelReady = false;
    }
  }
}

export const runonwebMeterOcrService = RunonwebMeterOcrService.getInstance();
