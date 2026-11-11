import * as ort from "onnxruntime-web";
import type { MeterOcrResult, RoiCropBounds } from "../../domain/entities/meter-ocr.entity";
import {
  type MeterOcrService,
  cropAndPreprocessRoi,
} from "../../domain/services/meter-ocr.service";

/**
 * Servicio de detección de dígitos en medidores de agua utilizando
 * el modelo YOLOv8-Nano especializado ejecutado localmente con ONNX Runtime Web.
 *
 * Mapeo de clases del modelo:
 *  0: meter
 *  1: window
 *  2..11: dígitos numéricos '0' al '9'
 */
export class YoloMeterOcrService implements MeterOcrService {
  private static instance: YoloMeterOcrService | null = null;
  private session: ort.InferenceSession | null = null;
  private loadPromise: Promise<boolean> | null = null;
  private isModelReady = false;

  private readonly MODEL_URL = "/models/water_meter_yolov8n.onnx";
  private readonly CACHE_NAME = "water-meter-yolo-model-v1";
  private readonly INPUT_SIZE = 640;

  private constructor() {
    if (typeof window !== "undefined") {
      ort.env.wasm.wasmPaths = "/ort-wasm/";
      if (typeof navigator !== "undefined" && navigator.hardwareConcurrency) {
        ort.env.wasm.numThreads = Math.min(navigator.hardwareConcurrency, 4);
      }
    }
  }

  public static getInstance(): YoloMeterOcrService {
    if (!YoloMeterOcrService.instance) {
      YoloMeterOcrService.instance = new YoloMeterOcrService();
    }
    return YoloMeterOcrService.instance;
  }

  public isReady(): boolean {
    return this.isModelReady && this.session !== null;
  }

  /**
   * Carga el modelo desde la caché local del navegador (CacheStorage) o lo descarga
   * y guarda en caché para garantizar funcionamiento 100% offline.
   */
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
        let modelBuffer: ArrayBuffer | null = null;

        // 1. Intentar leer desde CacheStorage para garantizar soporte offline
        if ("caches" in window) {
          try {
            const cache = await caches.open(this.CACHE_NAME);
            const cachedResponse = await cache.match(this.MODEL_URL);
            if (cachedResponse) {
              modelBuffer = await cachedResponse.arrayBuffer();
            } else {
              const netResponse = await fetch(this.MODEL_URL);
              if (netResponse.ok) {
                await cache.put(this.MODEL_URL, netResponse.clone());
                modelBuffer = await netResponse.arrayBuffer();
              }
            }
          } catch (cacheErr) {
            console.warn("No se pudo acceder a CacheStorage, usando fetch directo:", cacheErr);
          }
        }

        // 2. Si no se obtuvo de la caché, fetch directo
        if (!modelBuffer) {
          const res = await fetch(this.MODEL_URL);
          if (!res.ok) {
            throw new Error(`Error HTTP al descargar modelo ONNX: ${res.status}`);
          }
          modelBuffer = await res.arrayBuffer();
        }

        // 3. Crear sesión ONNX con aceleración WebGPU o fallback a WASM SIMD
        this.session = await ort.InferenceSession.create(modelBuffer, {
          executionProviders: ["webgpu", "wasm"],
          graphOptimizationLevel: "all",
        });

        this.isModelReady = true;
        return true;
      } catch (error) {
        console.error("Error al inicializar sesión YOLOv8 con onnxruntime-web:", error);
        this.session = null;
        this.isModelReady = false;
        return false;
      } finally {
        this.loadPromise = null;
      }
    })();

    return this.loadPromise;
  }

  /**
   * Ejecuta la detección sobre la imagen del medidor y extrae los dígitos ordenados de izq a der.
   */
  public async recognizeMeterReading(
    sourceCanvas: HTMLCanvasElement,
    roi: RoiCropBounds
  ): Promise<MeterOcrResult> {
    try {
      const ready = await this.ensureLoaded();
      if (!ready || !this.session) {
        return {
          success: false,
          rawText: "",
          digits: "",
          isComplete: false,
          confidence: 0,
          error: "El modelo de detección de medidores no pudo ser inicializado.",
        };
      }

      // 1. Recortar la región de interés (ROI) enfocada por el usuario
      const croppedCanvas = cropAndPreprocessRoi(sourceCanvas, roi);

      // 2. Preprocesar canvas a tensor YOLO [1, 3, 640, 640]
      const inputTensor = this.preprocessCanvasToTensor(croppedCanvas);

      // 3. Ejecutar inferencia ONNX
      const feeds: Record<string, ort.Tensor> = {};
      const inputName = this.session.inputNames[0] || "images";
      feeds[inputName] = inputTensor;

      const outputMap = await this.session.run(feeds);
      const outputName = this.session.outputNames[0] || "output0";
      const outputTensor = outputMap[outputName];

      if (!outputTensor) {
        throw new Error("El modelo no devolvió ningún tensor de salida.");
      }

      // 4. Parsear las predicciones YOLO y filtrar los dígitos
      const digits = this.parseAndFilterDigits(
        outputTensor.data as Float32Array,
        0.25, // Score threshold
        0.40  // NMS IoU threshold
      );

      const digitsString = digits.map((d) => d.digit).join("");
      const isComplete = digitsString.length >= 6;
      const normalizedDigits = digitsString.slice(0, 6);
      const avgConfidence =
        digits.length > 0
          ? digits.reduce((sum, d) => sum + d.score, 0) / digits.length
          : 0;

      return {
        success: isComplete,
        rawText: digitsString,
        digits: normalizedDigits,
        isComplete,
        confidence: Math.round(avgConfidence * 100) / 100,
        error: isComplete
          ? null
          : `Se detectaron ${digitsString.length} dígitos de los 6 requeridos.`,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Error inesperado durante la detección de dígitos.";
      console.error("Error en inferencia YOLO de medidor:", error);
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

  /**
   * Prepara un Float32Array con formato CHW [1, 3, 640, 640] y normalización 0..1
   */
  private preprocessCanvasToTensor(source: HTMLCanvasElement): ort.Tensor {
    const targetW = this.INPUT_SIZE;
    const targetH = this.INPUT_SIZE;

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("No se pudo obtener el contexto 2D para preprocesamiento.");

    // Fondo negro
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, targetW, targetH);

    // Letterboxing centrado para conservar la relación de aspecto
    const scale = Math.min(targetW / source.width, targetH / source.height);
    const drawW = Math.round(source.width * scale);
    const drawH = Math.round(source.height * scale);
    const padX = Math.round((targetW - drawW) / 2);
    const padY = Math.round((targetH - drawH) / 2);

    ctx.drawImage(source, 0, 0, source.width, source.height, padX, padY, drawW, drawH);

    const imgData = ctx.getImageData(0, 0, targetW, targetH);
    const pixels = imgData.data;
    const totalPixels = targetW * targetH;
    const floatData = new Float32Array(3 * totalPixels);

    for (let i = 0; i < totalPixels; i++) {
      floatData[i] = pixels[i * 4] / 255.0; // R
      floatData[totalPixels + i] = pixels[i * 4 + 1] / 255.0; // G
      floatData[totalPixels * 2 + i] = pixels[i * 4 + 2] / 255.0; // B
    }

    return new ort.Tensor("float32", floatData, [1, 3, targetH, targetW]);
  }

  /**
   * Parsea el tensor YOLOv8 de forma [1, 16, 8400], aplica NMS y ordena de izquierda a derecha.
   */
  private parseAndFilterDigits(
    data: Float32Array,
    scoreThreshold: number,
    iouThreshold: number
  ): Array<{ digit: string; score: number; x: number }> {
    const numAnchors = 8400;
    const rawDetections: Array<{
      digit: string;
      score: number;
      x: number;
      y: number;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    }> = [];

    for (let i = 0; i < numAnchors; i++) {
      // Clases 2 a 11 corresponden a dígitos '0' a '9' (canales 6 a 15)
      let bestDigitScore = -1;
      let bestDigitClass = -1;

      for (let c = 2; c <= 11; c++) {
        const score = data[(4 + c) * numAnchors + i];
        if (score > bestDigitScore) {
          bestDigitScore = score;
          bestDigitClass = c;
        }
      }

      if (bestDigitScore >= scoreThreshold) {
        const xc = data[0 * numAnchors + i];
        const yc = data[1 * numAnchors + i];
        const w = data[2 * numAnchors + i];
        const h = data[3 * numAnchors + i];

        const x1 = xc - w / 2;
        const y1 = yc - h / 2;
        const x2 = xc + w / 2;
        const y2 = yc + h / 2;

        rawDetections.push({
          digit: String(bestDigitClass - 2),
          score: bestDigitScore,
          x: xc,
          y: yc,
          x1,
          y1,
          x2,
          y2,
        });
      }
    }

    // 1. Ordenar por score descendente para NMS
    rawDetections.sort((a, b) => b.score - a.score);

    // 2. Non-Maximum Suppression (NMS)
    const filtered: typeof rawDetections = [];
    while (rawDetections.length > 0) {
      const best = rawDetections.shift()!;
      filtered.push(best);

      for (let j = rawDetections.length - 1; j >= 0; j--) {
        const cur = rawDetections[j];
        const xx1 = Math.max(best.x1, cur.x1);
        const yy1 = Math.max(best.y1, cur.y1);
        const xx2 = Math.min(best.x2, cur.x2);
        const yy2 = Math.min(best.y2, cur.y2);

        const interArea = Math.max(0, xx2 - xx1) * Math.max(0, yy2 - yy1);
        const a1 = (best.x2 - best.x1) * (best.y2 - best.y1);
        const a2 = (cur.x2 - cur.x1) * (cur.y2 - cur.y1);
        const unionArea = a1 + a2 - interArea;

        const iou = unionArea > 0 ? interArea / unionArea : 0;
        if (iou > iouThreshold) {
          rawDetections.splice(j, 1);
        }
      }
    }

    // 3. Ordenar horizontalmente de izquierda a derecha (por posición X)
    filtered.sort((a, b) => a.x - b.x);

    return filtered.map((d) => ({
      digit: d.digit,
      score: d.score,
      x: d.x,
    }));
  }

  public async dispose(): Promise<void> {
    if (this.session) {
      try {
        await this.session.release();
      } catch (err) {
        console.warn("Advertencia al liberar sesión ONNX:", err);
      }
      this.session = null;
      this.isModelReady = false;
    }
  }
}

export const yoloMeterOcrService = YoloMeterOcrService.getInstance();
