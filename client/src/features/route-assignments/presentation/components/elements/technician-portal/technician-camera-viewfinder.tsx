"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, RefreshCw, AlertCircle } from "lucide-react";
import type { TechnicianCameraViewfinderProps } from "@/features/route-assignments/domain/entities/assignment-execution.entity";

export function TechnicianCameraViewfinder({
  isOpen,
  onCapture,
  onClose,
}: TechnicianCameraViewfinderProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [hasCameraError, setHasCameraError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isTargetVisible, setIsTargetVisible] = useState<boolean>(false);

  // Detener la cámara limpiamente
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
  };

  useEffect(() => {
    if (!isOpen) {
      stopStream();
      setIsTargetVisible(false);
      return;
    }

    let isMounted = true;
    let timerId: NodeJS.Timeout | null = null;
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

        // Después de 1.4 segundos de inicializada, oscurecer y mostrar el marco de enfoque
        timerId = setTimeout(() => {
          if (isMounted) {
            setIsTargetVisible(true);
          }
        }, 1400);
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
    };
  }, [isOpen]);

  const handleCapture = () => {
    if (!videoRef.current || isCapturing) return;

    try {
      setIsCapturing(true);
      const video = videoRef.current;
      const width = video.videoWidth || 1280;
      const height = video.videoHeight || 720;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("No se pudo inicializar canvas de captura.");

      ctx.drawImage(video, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            setIsCapturing(false);
            return;
          }
          const file = new File(
            [blob],
            `meter-reading-${Date.now()}.jpg`,
            { type: "image/jpeg" }
          );
          stopStream();
          onCapture(file);
          onClose();
        },
        "image/jpeg",
        0.85
      );
    } catch (err) {
      console.error("Error al capturar imagen:", err);
      setIsCapturing(false);
    }
  };

  const handleNativeFallback = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      stopStream();
      onCapture(file);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col justify-between overflow-hidden select-none animate-in fade-in duration-200">
      {/* Botón superior de cierre 'X' */}
      <button
        type="button"
        onClick={() => {
          stopStream();
          onClose();
        }}
        className="absolute top-5 right-5 z-30 size-11 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition active:scale-95 cursor-pointer border-0 outline-none backdrop-blur-md"
        aria-label="Cerrar cámara"
      >
        <X className="size-5 stroke-[2.5]" />
      </button>

      {/* Visor central de video */}
      <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
        {isInitializing && !hasCameraError && (
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
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}

        {/* Capa de oscurecimiento sutil que aparece a los ~1.4s */}
        {!hasCameraError && !isInitializing && (
          <div
            className={`absolute inset-0 bg-black/45 pointer-events-none transition-opacity duration-700 ease-out z-10 ${
              isTargetVisible ? "opacity-100" : "opacity-0"
            }`}
          />
        )}

        {/* Rectángulo de enfoque en la parte superior (no centrado) con esquinas sutiles */}
        {!hasCameraError && !isInitializing && (
          <div
            className={`absolute top-[22%] left-1/2 -translate-x-1/2 w-[86%] max-w-[340px] flex flex-col items-center gap-3 pointer-events-none select-none z-20 transition-all duration-700 ease-out ${
              isTargetVisible
                ? "opacity-100 scale-100"
                : "opacity-0 scale-95"
            }`}
          >
            {/* Marco de enfoque con esquinas definidas */}
            <div className="relative w-full h-32 sm:h-36 rounded-2xl border border-white/30 backdrop-brightness-110">
              {/* Esquina superior izquierda */}
              <div className="absolute -top-[2px] -left-[2px] size-5 border-t-3 border-l-3 border-white rounded-tl-xl" />
              {/* Esquina superior derecha */}
              <div className="absolute -top-[2px] -right-[2px] size-5 border-t-3 border-r-3 border-white rounded-tr-xl" />
              {/* Esquina inferior izquierda */}
              <div className="absolute -bottom-[2px] -left-[2px] size-5 border-b-3 border-l-3 border-white rounded-bl-xl" />
              {/* Esquina inferior derecha */}
              <div className="absolute -bottom-[2px] -right-[2px] size-5 border-b-3 border-r-3 border-white rounded-br-xl" />

              {/* Guía central punteada tenue */}
              <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 border-t border-dashed border-white/25" />
            </div>

            {/* Texto inferior de indicación */}
            <p className="text-white text-xs sm:text-[13px] font-semibold text-center drop-shadow-md px-2 leading-snug">
              Enfoca aquí los números del medidor de agua
            </p>
          </div>
        )}
      </div>

      {/* Barra inferior con disparador */}
      <div className="absolute bottom-0 inset-x-0 z-20 pb-8 pt-6 flex items-center justify-center bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        {!hasCameraError && (
          <button
            type="button"
            onClick={handleCapture}
            disabled={isCapturing || isInitializing}
            className="size-20 rounded-full border-4 border-white/80 bg-white/95 shadow-2xl active:scale-90 transition-transform flex items-center justify-center cursor-pointer outline-none disabled:opacity-50"
            aria-label="Tomar fotografía"
          >
            <div className="size-16 rounded-full border-2 border-slate-300 bg-white flex items-center justify-center">
              {isCapturing && (
                <RefreshCw className="size-6 text-slate-500 animate-spin" />
              )}
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

export default TechnicianCameraViewfinder;
