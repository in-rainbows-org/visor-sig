"use client";

import React, { useState, useEffect } from "react";
import type { StopCompletionChoice } from "@/features/route-assignments/domain/entities/assignment-execution.entity";

export interface QuickObservationPillsProps {
  readonly choice: StopCompletionChoice;
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly disabled?: boolean;
}

const SUCCESS_PRESETS = [
  "Servicio completado con éxito",
  "Medidor en buen estado",
  "Lectura verificada",
  "Precinto colocado",
  "Fuga no detectada",
  "Fuga detectada",
];

const FAILED_PRESETS = [
  "Cliente no se encontraba en el domicilio",
  "Medidor dañado, requiere revisión técnica",
  "Medidor sin acceso",
  "Predio cerrado con candado",
  "Oposición de usuario",
  "Fuga detectada",
];

export function QuickObservationPills({
  choice,
  value,
  onChange,
  disabled = false,
}: QuickObservationPillsProps) {
  const presets = choice === "SUCCESS" ? SUCCESS_PRESETS : FAILED_PRESETS;

  // Determine if the current value matches one of the presets
  const isPresetMatch = presets.includes(value.trim());
  const [isOtherSelected, setIsOtherSelected] = useState<boolean>(() => {
    // If value is non-empty and doesn't match presets, "Otro" is active
    return Boolean(value.trim() && !isPresetMatch);
  });

  // When choice switches between SUCCESS and FAILED, reset preset match if no longer valid
  useEffect(() => {
    if (!presets.includes(value.trim()) && value.trim().length > 0) {
      setIsOtherSelected(true);
    }
  }, [choice, presets, value]);

  const handleSelectPreset = (preset: string) => {
    if (disabled) return;
    if (value === preset) {
      // Toggle off if clicked again
      onChange("");
      setIsOtherSelected(false);
    } else {
      setIsOtherSelected(false);
      onChange(preset);
    }
  };

  const handleSelectOther = () => {
    if (disabled) return;
    setIsOtherSelected(true);
    if (presets.includes(value.trim())) {
      onChange("");
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="w-full space-y-3">
      {/* Píldoras rápidas */}
      <div className="flex flex-wrap gap-2.5">
        {presets.map((preset) => {
          const isSelected = value.trim() === preset && !isOtherSelected;
          return (
            <button
              key={preset}
              type="button"
              disabled={disabled}
              onClick={() => handleSelectPreset(preset)}
              className={`px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full text-xs sm:text-[13px] font-medium transition-colors cursor-pointer border-0 outline-none select-none disabled:opacity-50 disabled:cursor-not-allowed ${
                isSelected
                  ? "bg-[#0e4dcb] text-white shadow-sm font-semibold"
                  : "bg-slate-100 hover:bg-slate-200/80 text-slate-700"
              }`}
            >
              {preset}
            </button>
          );
        })}

        {/* Píldora de "Otro" */}
        <button
          type="button"
          disabled={disabled}
          onClick={handleSelectOther}
          className={`px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full text-xs sm:text-[13px] font-medium transition-colors cursor-pointer border-0 outline-none select-none disabled:opacity-50 disabled:cursor-not-allowed ${
            isOtherSelected
              ? "bg-[#0e4dcb] text-white shadow-sm font-semibold"
              : "bg-slate-100 hover:bg-slate-200/80 text-slate-700"
          }`}
        >
          Otro
        </button>
      </div>

      {/* Campo de texto libre cuando "Otro" está seleccionado o cuando se desea redactar */}
      {isOtherSelected && (
        <div className="animate-in fade-in-50 duration-200 pt-1">
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Redacta la observación personalizada:
          </label>
          <textarea
            value={value}
            disabled={disabled}
            onChange={handleTextareaChange}
            rows={3}
            placeholder={
              choice === "SUCCESS"
                ? "Describe cualquier detalle o hallazgo relevante de la visita..."
                : "Indica obligatoriamente el motivo por el cual no se pudo completar la visita..."
            }
            className="w-full rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0e4dcb]/20 focus:border-[#0e4dcb] resize-none transition-all disabled:opacity-50"
            autoFocus
          />
        </div>
      )}
    </div>
  );
}

export default QuickObservationPills;
