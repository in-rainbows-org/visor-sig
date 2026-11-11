"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, RefreshCw, AlertCircle } from "lucide-react";
import type { TechnicianCameraViewfinderProps } from "@/features/route-assignments/domain/entities/assignment-execution.entity";
import { useMeterOcr, DEFAULT_METER_ROI } from "@/features/route-assignments/presentation/hooks/use-meter-ocr";

export function TechnicianCameraViewfinder({
  isOpen,
  onCapture,
  onCaptureComplete,
  onClose,
}: TechnicianCameraViewfinderProps) {
  const { processCapture, isAnalyzing, resetOcrState } = useMeterOcr();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [hasCameraError, setHasCameraError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isTargetVisible, setIsTargetVisible] = useState<boolean>(false);
  const [capturedPreviewUrl, setCapturedPreviewUrl] = useState<string | null>(null);

  // Detener la cámara limpiamente y desvincular el elemento video
  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      } catch {
        // ignore
      }
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopStream();
      setIsTargetVisible(false);
      setIsCapturing(false);
      setCapturedPreviewUrl(null);
      resetOcrState();
      return;
    }

    let isMounted = true;
    let timerId: NodeJS.Timeout | null = null;
    setIsCapturing(false);
    setCapturedPreviewUrl(null);
    resetOcrState();
    setIsInitializing(true);
    setHasCameraError(false);
    setErrorMessage("");
    setIsTargetVisible(false);

    const startCamera = async () => {
      try {
        if (!navigator?.mediaDevices?.getUserMedia) {
          throw new Error("API de cámara no soportada en este navegador.");
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          audio: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setIsInitializing(false);

        // A exactamente 1.0 segundo de inicializada, oscurecer alrededor y mostrar ventana de enfoque
        timerId = setTimeout(() => {
          if (isMounted) {
            setIsTargetVisible(true);
          }
        }, 1000);
      } catch (err: unknown) {
        if (!isMounted) return;
        setIsInitializing(false);
        setHasCameraError(true);
        const msg =
          err instanceof Error
            ? err.message
            : "No se pudo acceder a la cámara del dispositivo.";
        setErrorMessage(msg);
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
      stopStream();
      setIsCapturing(false);
      setCapturedPreviewUrl(null);
      resetOcrState();
    };
  }, [isOpen, resetOcrState]);

  const handleCapture = async () => {
    if (!videoRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      const video = videoRef.current;
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;

      console.log(`%c[Camera] 📸 Fotograma capturado: ${width}x${height}px`, "color: #3b82f6; font-weight: bold;");

      // Pausar inmediatamente la reproducción de video para congelar la cámara
      video.pause();

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No se pudo inicializar canvas de captura.");

      ctx.drawImage(video, 0, 0, width, height);

      // Mostrar la imagen estática capturada de forma inmediata sin latencia
      const previewDataUrl = canvas.toDataURL("image/jpeg", 0.9);
      setCapturedPreviewUrl(previewDataUrl);

      // Generar archivo de imagen original de alta resolución para evidencia legal
      const fileBlob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.85)
      );

      if (!fileBlob) {
        setCapturedPreviewUrl(null);
        setIsCapturing(false);
        return;
      }

      const file = new File(
        [fileBlob],
        `meter-reading-${Date.now()}.jpg`,
        { type: "image/jpeg" }
      );

      // Ejecutar inferencia OCR sobre la captura
      console.log("[Camera] 🤖 Enviando fotograma a modelo YOLOv8 local...");
      const ocrResult = await processCapture(canvas, DEFAULT_METER_ROI);
      console.log("[Camera] 🏁 Resultado de inferencia recibido:", ocrResult);

      stopStream();
      setIsCapturing(false);
      setCapturedPreviewUrl(null);
      resetOcrState();

      if (onCaptureComplete) {
        onCaptureComplete({
          file: ocrResult.isComplete ? file : null,
          detectedDigits: ocrResult.isComplete ? ocrResult.digits : null,
          ocrError: ocrResult.isComplete
            ? null
            : ocrResult.error ?? "No se pudieron detectar los 6 dígitos del medidor. Por favor vuelve a tomar la foto enfocando bien los números dentro del marco.",
        });
      } else if (onCapture) {
        if (ocrResult.isComplete) {
          onCapture(file);
        }
      }

      onClose();
    } catch (err) {
      console.error("[Camera] ❌ Error al capturar imagen:", err);
      setCapturedPreviewUrl(null);
      setIsCapturing(false);
      resetOcrState();
    }
  };

  const handleNativeFallback = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCapturing(true);
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.src = objectUrl;
      setCapturedPreviewUrl(objectUrl);
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
      });

      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const ocrResult = await processCapture(canvas, DEFAULT_METER_ROI);
        stopStream();
        setIsCapturing(false);
        setCapturedPreviewUrl(null);
        resetOcrState();

        if (onCaptureComplete) {
          onCaptureComplete({
            file: ocrResult.isComplete ? file : null,
            detectedDigits: ocrResult.isComplete ? ocrResult.digits : null,
            ocrError: ocrResult.isComplete
              ? null
              : ocrResult.error ?? "No se pudieron detectar los 6 dígitos del medidor. Por favor vuelve a tomar la foto enfocando bien los números dentro del marco.",
          });
        } else if (onCapture) {
          if (ocrResult.isComplete) {
            onCapture(file);
          }
        }

        onClose();
        return;
      }
    } catch (err) {
      console.error("Error en fallback nativo de cámara:", err);
    }

    stopStream();
    setIsCapturing(false);
    setCapturedPreviewUrl(null);
    resetOcrState();
    if (onCaptureComplete) {
      onCaptureComplete({
        file: null,
        detectedDigits: null,
        ocrError: "No se pudieron leer los 6 dígitos del medidor en la imagen seleccionada.",
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col justify-between overflow-hidden select-none animate-in fade-in duration-200">
      {/* Botón superior de cierre 'X' */}
      <button
        type="button"
        onClick={() => {
          stopStream();
          setCapturedPreviewUrl(null);
          onClose();
        }}
        className="absolute top-5 right-5 z-30 size-11 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition active:scale-95 cursor-pointer border-0 outline-none backdrop-blur-md"
        aria-label="Cerrar cámara"
      >
        <X className="size-5 stroke-[2.5]" />
      </button>

      {/* Visor central de video con cutout oscuro externo o imagen congelada limpia */}
      <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
        {isInitializing && !hasCameraError && !capturedPreviewUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white z-10">
            <RefreshCw className="size-8 animate-spin text-sky-400" />
            <span className="text-xs font-medium text-slate-300">
              Iniciando cámara...
            </span>
          </div>
        )}

        {hasCameraError ? (
          <div className="max-w-xs mx-auto p-6 text-center text-white space-y-4 z-10">
            <div className="size-14 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
              <AlertCircle className="size-7" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold">Cámara no disponible</h4>
              <p className="text-xs text-slate-400">
                {errorMessage ||
                  "Usa la app de cámara nativa para tomar la fotografía."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition cursor-pointer"
            >
              Abrir cámara del teléfono
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleNativeFallback}
            />
          </div>
        ) : capturedPreviewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={capturedPreviewUrl}
            alt="Fotografía capturada del medidor"
            className="w-full h-full object-cover"
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}

        {/* Ventana de enfoque superior con cutout: visible sólo mientras la cámara está activa y NO se ha tomado la foto */}
        {!hasCameraError && !isInitializing && !capturedPreviewUrl && (
          <div
            className={`absolute top-[22%] left-1/2 -translate-x-1/2 w-[86%] max-w-[340px] flex flex-col items-center pointer-events-none select-none z-20 transition-opacity duration-500 ease-out ${
              isTargetVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            {/* Rectángulo de enfoque limpio, sin esquinas toscas, con sombra de oscurecimiento exterior */}
            <div
              className="relative w-full h-32 sm:h-36 rounded-2xl border-2 border-white/70"
              style={{
                boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.55)",
              }}
            />

            {/* Texto inferior de indicación */}
            <p className="mt-3 text-white/95 text-xs sm:text-[13px] font-medium text-center drop-shadow-md px-2 leading-snug">
              Enfoca aquí los números del medidor de agua
            </p>
          </div>
        )}
      </div>

      {/* Barra inferior con disparador plano y simple (sin overlays, sin fondo, sin sombra) */}
      <div className="absolute bottom-0 inset-x-0 z-20 pb-8 pt-6 flex flex-col items-center justify-center bg-transparent">
        {!hasCameraError && (
          <button
            type="button"
            onClick={handleCapture}
            disabled={isCapturing || isAnalyzing || isInitializing}
            className="size-18 rounded-full bg-white active:scale-90 transition-transform flex items-center justify-center cursor-pointer border-0 outline-none shadow-none disabled:opacity-90"
            aria-label="Tomar fotografía"
          >
            {isCapturing || isAnalyzing ? (
              <RefreshCw className="size-7 text-slate-700 animate-spin" />
            ) : null}
          </button>
        )}
      </div>
    </div>
  );
}

export default TechnicianCameraViewfinder;
