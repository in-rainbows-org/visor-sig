import type { MeterOcrResult, RoiCropBounds } from "../entities/meter-ocr.entity";

/**
 * Contrato del puerto de dominio para el servicio de reconocimiento de medidores por IA
 */
export interface MeterOcrService {
  /**
   * Pre-carga e inicializa los pesos del modelo ONNX en el navegador (WASM).
   * Si los pesos no están en caché, los descarga automáticamente.
   */
  ensureLoaded(): Promise<boolean>;

  /**
   * Consulta si el modelo ya está cargado en memoria y listo para inferir.
   */
  isReady(): boolean;

  /**
   * Recorta la región de interés (ROI) sobre el canvas de video capturado,
   * optimiza el contraste/brillo y ejecuta el reconocimiento OCR.
   *
   * @param sourceCanvas Canvas completo del fotograma capturado de la cámara
   * @param roi Límites relativos normalizados de la guía de enfoque
   * @returns Resultado con los dígitos extraídos y nivel de confianza
   */
  recognizeMeterReading(
    sourceCanvas: HTMLCanvasElement,
    roi: RoiCropBounds
  ): Promise<MeterOcrResult>;

  /**
   * Libera las sesiones ONNX y memoria WebAssembly si es necesario.
   */
  dispose(): Promise<void>;
}

/**
 * Genera un canvas recortado con filtro de contraste optimizado para OCR.
 */
export function cropAndPreprocessRoi(
  sourceCanvas: HTMLCanvasElement,
  roi: RoiCropBounds
): HTMLCanvasElement {
  const sx = Math.max(0, Math.floor(sourceCanvas.width * roi.leftPercent));
  const sy = Math.max(0, Math.floor(sourceCanvas.height * roi.topPercent));
  const sw = Math.min(sourceCanvas.width - sx, Math.floor(sourceCanvas.width * roi.widthPercent));
  const sh = Math.min(sourceCanvas.height - sy, Math.floor(sourceCanvas.height * roi.heightPercent));

  const cropped = document.createElement("canvas");
  cropped.width = Math.max(sw, 320);
  cropped.height = Math.max(sh, 120);

  const ctx = cropped.getContext("2d");
  if (!ctx) return sourceCanvas;

  // Dibuja el recorte preservando colores RGB naturales (vital para detectar números rojos y fondos negros)
  ctx.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, cropped.width, cropped.height);

  return cropped;
}
