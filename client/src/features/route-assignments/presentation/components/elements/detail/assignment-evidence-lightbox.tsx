"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export type AssignmentEvidenceLightboxProps = {
  isOpen: boolean;
  imageUrl: string | null;
  title?: string;
  onClose: () => void;
};

export function AssignmentEvidenceLightbox({
  isOpen,
  imageUrl,
  title = "Fotografía de evidencia",
  onClose,
}: AssignmentEvidenceLightboxProps) {
  // Manejo de tecla Escape para cerrar
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && imageUrl && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 sm:p-6 select-none">
          {/* Backdrop con blur suave */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm cursor-pointer"
            aria-hidden="true"
          />

          {/* Contenedor del Lightbox */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", duration: 0.25 }}
            className="relative z-10 max-w-3xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl border-0 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del modal */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-white">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {title}
              </h3>
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar visor"
                className="size-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition active:scale-95 cursor-pointer border-0"
              >
                <X className="size-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Imagen principal */}
            <div className="relative w-full h-[55vh] sm:h-[65vh] bg-slate-900 flex items-center justify-center overflow-hidden">
              <Image
                src={imageUrl}
                alt={title}
                fill
                sizes="(max-width: 768px) 100vw, 800px"
                className="object-contain"
                priority
                unoptimized
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default AssignmentEvidenceLightbox;
