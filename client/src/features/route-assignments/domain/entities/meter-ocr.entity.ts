/**
 * Estado del ciclo de vida del modelo de IA en el navegador
 */
export type OcrModelStatus =
  | "UNLOADED"     // Modelo no descargado ni cargado en memoria
  | "INITIALIZING" // Descarga de pesos o inicialización de sesión ONNX en curso
  | "READY"        // Modelo cargado en memoria y disponible para inferencia
  | "ERROR";       // Fallo en la descarga o en la inicialización

/**
 * Estado transitorio de la inferencia sobre una captura
 */
export type OcrProcessingState =
  | "IDLE"        // Esperando captura
  | "PREPARING"   // Recorte de ROI y preprocesamiento de contraste en canvas
  | "ANALYZING"   // Inferencia ONNX ejecutándose
  | "SUCCESS"     // 6 dígitos reconocidos exitosamente
  | "FAILED";     // Menos de 6 dígitos o falla en el reconocimiento

/**
 * Resultado estructurado emitido tras el análisis OCR
 */
export interface MeterOcrResult {
  readonly success: boolean;
  readonly rawText: string;
  readonly digits: string; // Secuencia limpia de dígitos [0-9]
  readonly isComplete: boolean; // True si digits.length === 6
  readonly confidence: number; // Nivel de certeza reportado por el modelo (0 a 1)
  readonly error?: string | null;
}

/**
 * Coordenadas porcentuales para recortar la región del visor de cámara (ROI)
 */
export interface RoiCropBounds {
  readonly topPercent: number; // e.g. 0.22 (22% desde la parte superior)
  readonly leftPercent: number; // e.g. 0.07 (7% margen izquierdo)
  readonly widthPercent: number; // e.g. 0.86 (86% de ancho)
  readonly heightPercent: number; // e.g. 0.18 (18% de altura)
}
