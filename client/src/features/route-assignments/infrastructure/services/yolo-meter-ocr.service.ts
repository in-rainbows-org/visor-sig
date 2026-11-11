import * as ort from "onnxruntime-web";
import type { MeterOcrResult, RoiCropBounds } from "../../domain/entities/meter-ocr.entity";
import {
  type MeterOcrService,
  cropAndPreprocessRoi,
} from "../../domain/services/meter-ocr.service";

/**
 * Nombres canónicos de las 12 clases del modelo YOLOv8 de medidores:
 * 0: meter   (cuerpo completo del medidor)
 * 1: window  (ventana / marco del dial de dígitos)
 * 2..11: '0'..'9' (dígitos numéricos individuales)
 */
const CLASS_NAMES = [
  "meter",
  "window",
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
] as const;

interface YoloDetection {
  readonly classId: number;
  readonly className: string;
  readonly confidence: number;
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly xCenter: number;
  readonly yCenter: number;
}

interface PreprocessedImage {
  readonly tensor: ort.Tensor;
  readonly scale: number;
  readonly padX: number;
  readonly padY: number;
  readonly width: number;
  readonly height: number;
}

interface ExtractedReading {
  readonly window: YoloDetection | null;
  readonly cleanDigits: readonly YoloDetection[];
  readonly digits6: string;
  readonly isComplete: boolean;
  readonly confidence: number;
  readonly rawText: string;
  readonly elapsedMs: number;
  readonly allDetections: readonly YoloDetection[];
}

/**
 * Servicio de detección de dígitos en medidores de agua utilizando
 * el modelo YOLOv8-Nano especializado ejecutado localmente con ONNX Runtime Web.
 */
export class YoloMeterOcrService implements MeterOcrService {
  private static instance: YoloMeterOcrService | null = null;
  private session: ort.InferenceSession | null = null;
  private loadPromise: Promise<boolean> | null = null;
  private isModelReady = false;

  private readonly MODEL_URL = "/models/water_meter_yolov8n.onnx";
  private readonly CACHE_NAME = "water-meter-yolo-model-v2";
  private readonly INPUT_SIZE = 640;
  private readonly CANDIDATE_THRESHOLD = 0.08; // Umbral robusto de candidato (evita ruido)
  private readonly NMS_IOU_THRESHOLD = 0.45;

  private constructor() {
    if (typeof window !== "undefined") {
      ort.env.wasm.wasmPaths = "/ort-wasm/";
      // Solo habilitar multithreading si crossOriginIsolated es verdadero (SharedArrayBuffer)
      const canMultiThread =
        typeof crossOriginIsolated !== "undefined" &&
        crossOriginIsolated &&
        typeof SharedArrayBuffer !== "undefined";

      if (canMultiThread && navigator.hardwareConcurrency) {
        ort.env.wasm.numThreads = Math.min(navigator.hardwareConcurrency, 4);
      } else {
        // En navegadores móviles estándar sin cabeceras COOP/COEP, forzar 1 hilo para evitar advertencias
        ort.env.wasm.numThreads = 1;
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
   * Carga el modelo desde CacheStorage o lo descarga de red garantizando soporte 100% offline.
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
        console.log("%c[YOLO-OCR] 🔄 Inicializando modelo ONNX local (WASM Engine)...", "color: #3b82f6; font-weight: bold;");
        let modelBuffer: ArrayBuffer | null = null;
        let sourceOrigin = "RED";

        // 1. Intentar leer desde CacheStorage para funcionamiento offline
        if ("caches" in window) {
          try {
            const cache = await caches.open(this.CACHE_NAME);
            const cachedResponse = await cache.match(this.MODEL_URL);
            if (cachedResponse) {
              modelBuffer = await cachedResponse.arrayBuffer();
              sourceOrigin = "CACHE_STORAGE";
            } else {
              console.log("[YOLO-OCR] Descargando pesos del modelo:", this.MODEL_URL);
              const netResponse = await fetch(this.MODEL_URL);
              if (netResponse.ok) {
                await cache.put(this.MODEL_URL, netResponse.clone());
                modelBuffer = await netResponse.arrayBuffer();
              }
            }
          } catch (cacheErr) {
            console.warn("[YOLO-OCR] No se pudo acceder a CacheStorage, usando fetch directo:", cacheErr);
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

        console.log(
          `%c[YOLO-OCR] 📦 Binario cargado desde ${sourceOrigin} (${(modelBuffer.byteLength / 1024 / 1024).toFixed(2)} MB)`,
          "color: #10b981;"
        );

        // 3. Crear sesión ONNX EXCLUSIVAMENTE con WASM CPU
        // NOTA IMPORTANTE: En navegadores móviles (Android Chrome), WebGPU tiene fallos conocidos
        // de precisión de subgrupos en shaders que devuelven 0.5 constante. Usar exclusivamente 'wasm'
        // garantiza ejecución bit-exact y determinista en todos los dispositivos.
        const startInit = performance.now();
        this.session = await ort.InferenceSession.create(modelBuffer, {
          executionProviders: ["wasm"],
          graphOptimizationLevel: "all",
        });

        const initTime = Math.round(performance.now() - startInit);
        console.log(
          `%c[YOLO-OCR] ✅ Sesión ONNX WASM lista en ${initTime}ms. Entradas: [${this.session.inputNames.join(", ")}], Salidas: [${this.session.outputNames.join(", ")}]`,
          "color: #10b981; font-weight: bold;"
        );

        this.isModelReady = true;
        return true;
      } catch (error) {
        console.error("%c[YOLO-OCR] ❌ Error fatal al inicializar sesión YOLOv8 con onnxruntime-web:", "color: #ef4444; font-weight: bold;", error);
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
   * Ejecuta la detección inteligente sobre la captura de cámara:
   * 1. Inferencia principal sobre la imagen completa (contexto de medidor + ventana).
   * 2. Si la imagen completa no detecta 6 dígitos, ejecuta inferencia sobre la ROI enfocada.
   * 3. Filtra dígitos dentro de la ventana de lectura y selecciona los 6 dígitos canónicos.
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

      console.group("%c[YOLO-OCR] 📸 Ejecutando reconocimiento en captura", "color: #6366f1; font-weight: bold;");
      console.log(`[YOLO-OCR] Dimensiones de imagen recibida: ${sourceCanvas.width}x${sourceCanvas.height}px`);

      // Paso 1: Inferencia sobre la imagen completa (permite a YOLO detectar el marco del medidor y dial)
      console.log("[YOLO-OCR] 🔍 Pasada 1: Inferencia sobre imagen COMPLETA...");
      const fullResult = await this.runInferenceOnCanvas(sourceCanvas, "Pasada 1 (Completa)");

      console.log(
        `[YOLO-OCR] 📊 Pasada 1 completada en ${fullResult.elapsedMs}ms:`,
        {
          ventanaDetectada: fullResult.window ? `${fullResult.window.className} (${(fullResult.window.confidence * 100).toFixed(1)}%)` : "No detectada",
          totalDígitosRaw: fullResult.cleanDigits.length,
          dígitosSecuencia: fullResult.rawText,
          candidato6Dígitos: fullResult.digits6,
          esCompleto: fullResult.isComplete,
        }
      );

      if (fullResult.isComplete) {
        console.log(
          `%c[YOLO-OCR] 🎉 ÉXITO en Pasada 1: Se extrajeron los 6 dígitos canónicos: "${fullResult.digits6}" (Confianza promedio: ${(fullResult.confidence * 100).toFixed(1)}%)`,
          "color: #10b981; font-weight: bold;"
        );
        console.groupEnd();
        this.exposeDebugGlobals(fullResult);
        return {
          success: true,
          rawText: fullResult.rawText,
          digits: fullResult.digits6,
          isComplete: true,
          confidence: Math.round(fullResult.confidence * 100) / 100,
          error: null,
        };
      }

      // Paso 2: Fallback sobre el recorte de la región de interés (ROI)
      console.log("[YOLO-OCR] ⚠️ Pasada 1 no obtuvo 6 dígitos. Ejecutando Pasada 2 sobre recorte ROI enfocado...");
      const croppedCanvas = cropAndPreprocessRoi(sourceCanvas, roi);
      console.log(`[YOLO-OCR] Dimensiones ROI recortada: ${croppedCanvas.width}x${croppedCanvas.height}px`);
      const cropResult = await this.runInferenceOnCanvas(croppedCanvas, "Pasada 2 (ROI Recorte)");

      console.log(
        `[YOLO-OCR] 📊 Pasada 2 completada en ${cropResult.elapsedMs}ms:`,
        {
          ventanaDetectada: cropResult.window ? `${cropResult.window.className} (${(cropResult.window.confidence * 100).toFixed(1)}%)` : "No detectada",
          totalDígitosRaw: cropResult.cleanDigits.length,
          dígitosSecuencia: cropResult.rawText,
          candidato6Dígitos: cropResult.digits6,
          esCompleto: cropResult.isComplete,
        }
      );

      // Elegir el mejor resultado entre el marco completo y el recorte ROI
      const best =
        cropResult.digits6.length > fullResult.digits6.length ||
        (cropResult.isComplete && !fullResult.isComplete)
          ? cropResult
          : fullResult;

      console.log(
        `%c[YOLO-OCR] 🏁 Decisión final seleccionada: "${best.digits6}" (isComplete: ${best.isComplete}, dígitos: ${best.digits6.length}/6)`,
        best.isComplete ? "color: #10b981; font-weight: bold;" : "color: #f59e0b; font-weight: bold;"
      );
      console.groupEnd();

      this.exposeDebugGlobals(best);

      return {
        success: best.isComplete,
        rawText: best.rawText,
        digits: best.digits6,
        isComplete: best.isComplete,
        confidence: Math.round(best.confidence * 100) / 100,
        error: best.isComplete
          ? null
          : `Se detectaron ${best.digits6.length} dígitos de los 6 requeridos del medidor. Enfoca bien los números dentro del marco o ingresa la lectura manualmente.`,
      };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Error inesperado durante la detección de dígitos.";
      console.error("%c[YOLO-OCR] ❌ Error en proceso recognizeMeterReading:", "color: #ef4444; font-weight: bold;", error);
      console.groupEnd();
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
   * Ejecuta la inferencia ONNX sobre un canvas y procesa las detecciones.
   */
  private async runInferenceOnCanvas(canvas: HTMLCanvasElement, label: string): Promise<ExtractedReading> {
    if (!this.session) {
      throw new Error("Sesión ONNX no disponible.");
    }

    const t0 = performance.now();
    const preprocessed = this.preprocessCanvasToTensor(canvas);
    const feeds: Record<string, ort.Tensor> = {};
    const inputName = this.session.inputNames[0] || "images";
    feeds[inputName] = preprocessed.tensor;

    const tInferStart = performance.now();
    const outputMap = await this.session.run(feeds);
    const inferDuration = Math.round(performance.now() - tInferStart);

    const outputName = this.session.outputNames[0] || "output0";
    const outputTensor = outputMap[outputName];

    if (!outputTensor) {
      throw new Error("El modelo no devolvió ningún tensor de salida.");
    }

    const detections = this.decodeOutput(
      outputTensor,
      preprocessed.width,
      preprocessed.height,
      preprocessed.padX,
      preprocessed.padY,
      preprocessed.scale,
      this.CANDIDATE_THRESHOLD
    );

    const extracted = this.extractDigits(detections);
    const totalElapsed = Math.round(performance.now() - t0);

    console.log(
      `[YOLO-OCR] ⚡ ${label} - Inferencia modelo: ${inferDuration}ms, Tiempo total: ${totalElapsed}ms, Detecciones totales: ${detections.length}`
    );

    return {
      ...extracted,
      elapsedMs: totalElapsed,
      allDetections: detections,
    };
  }

  /**
   * Preprocesa el canvas aplicando letterboxing estándar Ultralytics:
   * - Mantiene relación de aspecto
   * - Relleno neutro gris rgb(114, 114, 114)
   * - Normalización RGB en rango [0, 1] y layout CHW [1, 3, 640, 640]
   */
  private preprocessCanvasToTensor(source: HTMLCanvasElement): PreprocessedImage {
    const targetW = this.INPUT_SIZE;
    const targetH = this.INPUT_SIZE;

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("No se pudo obtener el contexto 2D para preprocesamiento.");

    // Fondo gris neutro oficial de Ultralytics YOLOv8 (114, 114, 114)
    ctx.fillStyle = "rgb(114, 114, 114)";
    ctx.fillRect(0, 0, targetW, targetH);

    // Letterboxing centrado
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
      floatData[2 * totalPixels + i] = pixels[i * 4 + 2] / 255.0; // B
    }

    return {
      tensor: new ort.Tensor("float32", floatData, [1, 3, targetH, targetW]),
      scale,
      padX,
      padY,
      width: source.width,
      height: source.height,
    };
  }

  /**
   * Decodifica la salida YOLOv8 soportando de forma dinámica tanto
   * layout channels-first [1, 16, 8400] como anchor-first [1, 8400, 16].
   * Descarta anclajes planos (fallos de shader donde todas las clases dan 0.5).
   */
  private decodeOutput(
    outputTensor: ort.Tensor,
    origWidth: number,
    origHeight: number,
    padX: number,
    padY: number,
    scale: number,
    candidateThreshold: number
  ): YoloDetection[] {
    const data = outputTensor.data as Float32Array;
    const dims = outputTensor.dims;
    const numClasses = CLASS_NAMES.length; // 12

    // Detección dinámica de dimensiones
    const isChannelsFirst = dims[1] === 16 || dims[1] === numClasses + 4;
    const boxCount = isChannelsFirst ? dims[2] : dims[1];

    console.log(`[YOLO-OCR] 📐 Tensor dims: [${dims.join(", ")}] -> layout: ${isChannelsFirst ? "CHANNELS_FIRST [1, 16, 8400]" : "ANCHOR_FIRST [1, 8400, 16]"}, Cajas: ${boxCount}`);

    const detections: YoloDetection[] = [];

    for (let i = 0; i < boxCount; i++) {
      // Función helper para leer el canal `ch` del anclaje `i` de forma transparente
      const getVal = (ch: number): number => {
        return isChannelsFirst ? data[ch * boxCount + i] : data[i * (numClasses + 4) + ch];
      };

      // 1. Extraer puntajes de las 12 clases y verificar que no sea una distribución plana (ej. 0.500)
      let minScore = Infinity;
      let maxScore = -Infinity;
      let bestClass = 0;

      for (let c = 0; c < numClasses; c++) {
        const score = getVal(4 + c);
        if (score < minScore) minScore = score;
        if (score > maxScore) {
          maxScore = score;
          bestClass = c;
        }
      }

      // Si la diferencia entre la clase máxima y mínima es insignificante (< 0.05),
      // significa que el anclaje tiene valores planos/corruptos (como el fallo de 0.5), por lo que se descarta
      if (maxScore - minScore < 0.05) continue;

      if (maxScore < candidateThreshold) continue;

      const xc = getVal(0);
      const yc = getVal(1);
      const w = getVal(2);
      const h = getVal(3);

      const x1 = Math.max(0, (xc - w / 2 - padX) / scale);
      const y1 = Math.max(0, (yc - h / 2 - padY) / scale);
      const x2 = Math.min(origWidth, (xc + w / 2 - padX) / scale);
      const y2 = Math.min(origHeight, (yc + h / 2 - padY) / scale);

      if (x2 <= x1 || y2 <= y1) continue;

      detections.push({
        classId: bestClass,
        className: CLASS_NAMES[bestClass],
        confidence: maxScore,
        x1,
        y1,
        x2,
        y2,
        xCenter: (x1 + x2) / 2,
        yCenter: (y1 + y2) / 2,
      });
    }

    const nmsDetections = this.classAwareNms(detections, this.NMS_IOU_THRESHOLD);

    if (nmsDetections.length > 0) {
      console.log(
        `[YOLO-OCR] 🎯 Detecciones NMS válidas (${nmsDetections.length}):`,
        nmsDetections.slice(0, 10).map((d) => `${d.className} (${(d.confidence * 100).toFixed(1)}%)`)
      );
    } else {
      console.log("[YOLO-OCR] ⚠️ Ninguna detección superó el umbral de confianza.");
    }

    return nmsDetections;
  }

  /**
   * Non-Maximum Suppression (NMS) consciente de clase
   */
  private classAwareNms(detections: YoloDetection[], iouThreshold: number): YoloDetection[] {
    const sorted = [...detections].sort((a, b) => b.confidence - a.confidence);
    const kept: YoloDetection[] = [];

    for (const det of sorted) {
      const overlaps = kept.some(
        (existing) =>
          existing.classId === det.classId && this.boxIou(existing, det) >= iouThreshold
      );
      if (!overlaps) {
        kept.push(det);
      }
    }

    return kept;
  }

  /**
   * Elimina detecciones duplicadas en la misma posición espacial entre dígitos
   */
  private removeDuplicateDigits(
    digits: YoloDetection[],
    iouThreshold = 0.40
  ): YoloDetection[] {
    const sorted = [...digits].sort((a, b) => b.confidence - a.confidence);
    const kept: YoloDetection[] = [];

    for (const det of sorted) {
      if (kept.every((old) => this.boxIou(det, old) < iouThreshold)) {
        kept.push(det);
      }
    }

    return kept.sort((a, b) => a.xCenter - b.xCenter);
  }

  /**
   * Procesa la jerarquía de detecciones:
   * 1. Encuentra la mejor ventana del medidor ('window')
   * 2. Filtra únicamente los dígitos dentro de dicha ventana (aislando suciedad y números de serie externos)
   * 3. Ordena de izquierda a derecha y normaliza a 6 dígitos
   */
  private extractDigits(detections: YoloDetection[]): Omit<ExtractedReading, "elapsedMs" | "allDetections"> {
    const windows = detections.filter(
      (d) => d.className === "window" && d.confidence >= 0.05
    );
    const bestWindow =
      windows.sort((a, b) => b.confidence - a.confidence)[0] || null;

    let digitCandidates = detections.filter(
      (d) => d.classId >= 2 && d.classId <= 11
    );

    console.log(
      `[YOLO-OCR] 🪟 Ventana de lectura: ${bestWindow ? `Detectada con ${(bestWindow.confidence * 100).toFixed(1)}% de confianza` : "No encontrada (usando búsqueda directa)"}`
    );

    // Si se detectó la ventana de lectura, filtrar dígitos contenidos en ella
    if (bestWindow) {
      const insideWindow = digitCandidates.filter(
        (d) => this.overlapRatio(d, bestWindow) >= 0.35
      );
      console.log(
        `[YOLO-OCR] 🔢 Dígitos dentro de ventana: ${insideWindow.length} de ${digitCandidates.length} candidatos totales`
      );
      if (insideWindow.length >= 3) {
        digitCandidates = insideWindow;
      }
    }

    const cleanDigits = this.removeDuplicateDigits(digitCandidates, 0.40);
    const rawText = cleanDigits.map((d) => d.className).join("");

    console.log(
      `[YOLO-OCR] 🔢 Dígitos limpios ordenados (Izq -> Der): [${cleanDigits.map((d) => `${d.className}@${Math.round(d.xCenter)}px`).join(", ")}] -> Raw: "${rawText}"`
    );

    // Normalizar a exactamente 6 dígitos
    let digits6 = "";
    if (cleanDigits.length === 6) {
      digits6 = rawText;
    } else if (cleanDigits.length > 6) {
      // Si hay más de 6 dígitos detectados (p. ej. medidores con 7 u 8 casillas con decimales),
      // seleccionamos la subsecuencia continua de 6 dígitos con mayor confianza promedio
      let bestAvg = -1;
      let bestIdx = 0;
      for (let i = 0; i <= cleanDigits.length - 6; i++) {
        const sub = cleanDigits.slice(i, i + 6);
        const avg = sub.reduce((acc, d) => acc + d.confidence, 0) / 6;
        if (avg > bestAvg) {
          bestAvg = avg;
          bestIdx = i;
        }
      }
      digits6 = cleanDigits
        .slice(bestIdx, bestIdx + 6)
        .map((d) => d.className)
        .join("");
      console.log(`[YOLO-OCR] ✂️ Normalizado a 6 dígitos continuos óptimos (índice ${bestIdx}..${bestIdx + 6}): "${digits6}"`);
    } else {
      digits6 = rawText;
      console.log(`[YOLO-OCR] ⚠️ Se detectaron ${cleanDigits.length} dígitos (se requieren 6): "${digits6}"`);
    }

    const avgConf =
      cleanDigits.length > 0
        ? cleanDigits.reduce((acc, d) => acc + d.confidence, 0) / cleanDigits.length
        : 0;

    return {
      window: bestWindow,
      cleanDigits,
      digits6,
      isComplete: digits6.length === 6,
      confidence: avgConf,
      rawText,
    };
  }

  private boxIou(a: YoloDetection, b: YoloDetection): number {
    const iw = Math.max(0, Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1));
    const ih = Math.max(0, Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1));
    const inter = iw * ih;
    const areaA = Math.max(0, a.x2 - a.x1) * Math.max(0, a.y2 - a.y1);
    const areaB = Math.max(0, b.x2 - b.x1) * Math.max(0, b.y2 - b.y1);
    const union = areaA + areaB - inter;
    return union > 0 ? inter / union : 0;
  }

  private overlapRatio(box: YoloDetection, container: YoloDetection, margin = 4): number {
    const cx1 = container.x1 - margin;
    const cy1 = container.y1 - margin;
    const cx2 = container.x2 + margin;
    const cy2 = container.y2 + margin;
    const iw = Math.max(0, Math.min(box.x2, cx2) - Math.max(box.x1, cx1));
    const ih = Math.max(0, Math.min(box.y2, cy2) - Math.max(box.y1, cy1));
    const boxArea = Math.max(0, box.x2 - box.x1) * Math.max(0, box.y2 - box.y1);
    return boxArea > 0 ? (iw * ih) / boxArea : 0;
  }

  private exposeDebugGlobals(result: ExtractedReading): void {
    if (typeof window !== "undefined") {
      (window as unknown as Record<string, unknown>).__YOLO_OCR_LAST_RESULT__ = {
        digits6: result.digits6,
        isComplete: result.isComplete,
        confidence: result.confidence,
        rawText: result.rawText,
        cleanDigits: result.cleanDigits,
        window: result.window,
        timestamp: new Date().toISOString(),
      };
    }
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
