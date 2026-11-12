"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
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

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && imageUrl && (
        <div
          className="fixed inset-0 z-[3000] flex items-center justify-center p-3 sm:p-6 select-none"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm cursor-pointer"
            aria-hidden="true"
          />

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar visor"
            className="absolute right-4 top-[92px] z-20 size-10 rounded-full bg-white/15 text-white hover:bg-white/25 flex items-center justify-center transition active:scale-95 cursor-pointer border border-white/30 backdrop-blur-sm sm:right-6"
          >
            <X className="size-5 stroke-[2.5]" />
          </button>

          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", duration: 0.25 }}
            className="relative z-10 w-full max-w-[min(94vw,1200px)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full h-[78vh] sm:h-[82vh] flex items-center justify-center">
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
    ,
    document.body
  );
}

export default AssignmentEvidenceLightbox;
