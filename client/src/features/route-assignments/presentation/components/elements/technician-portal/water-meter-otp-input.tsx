"use client";

import React, { useRef, useEffect } from "react";
import Image from "next/image";
import type { WaterMeterOtpInputProps } from "@/features/route-assignments/domain/entities/assignment-execution.entity";

export function WaterMeterOtpInput({
  value,
  onChange,
  disabled = false,
}: WaterMeterOtpInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Convert incoming value (up to 6 chars) into an array of 6 slots
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? "");

  const handleInputChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    const rawVal = e.target.value;
    // Extract only digits
    const cleanDigit = rawVal.replace(/\D/g, "").slice(-1);

    const nextDigits = [...digits];
    nextDigits[index] = cleanDigit;
    const nextValue = nextDigits.join("").trimEnd();
    onChange(nextValue);

    // Auto advance if a digit was entered
    if (cleanDigit && index < 5) {
      inputRefs.current[index + 1]?.focus();
      inputRefs.current[index + 1]?.select();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        // Current slot is empty, move back and clear previous
        const nextDigits = [...digits];
        nextDigits[index - 1] = "";
        onChange(nextDigits.join("").trimEnd());
        inputRefs.current[index - 1]?.focus();
      } else {
        const nextDigits = [...digits];
        nextDigits[index] = "";
        onChange(nextDigits.join("").trimEnd());
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
      inputRefs.current[index - 1]?.select();
    } else if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
      inputRefs.current[index + 1]?.select();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    const clean = pasted.replace(/\D/g, "").slice(0, 6);
    if (!clean) return;

    onChange(clean);
    const targetIdx = Math.min(clean.length, 5);
    inputRefs.current[targetIdx]?.focus();
  };

  return (
    <div className="w-full flex flex-col items-center select-none py-1">
      <div className="relative w-full max-w-[390px] sm:max-w-[420px] aspect-[1535/1024]">
        {/* Imagen del medidor */}
        <Image
          src="/technician-routes/meter.webp"
          alt="Medidor de agua"
          fill
          sizes="(max-width: 640px) 390px, 420px"
          className="object-contain pointer-events-none drop-shadow-sm"
          priority
        />

        {/* Capa de 6 inputs transparentes superpuestos sobre las casillas */}
        <div
          className="absolute grid grid-cols-6 items-center justify-items-center gap-[1.5%]"
          style={{
            left: "27.4%",
            width: "44.5%",
            top: "40.5%",
            height: "18.2%",
          }}
        >
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => {
                inputRefs.current[idx] = el;
              }}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              disabled={disabled}
              onChange={(e) => handleInputChange(idx, e)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              onPaste={handlePaste}
              onFocus={(e) => e.target.select()}
              className="w-full h-full text-center font-mono font-black text-slate-900 text-2xl sm:text-3xl leading-tight bg-transparent border-0 outline-none ring-0 shadow-none focus:outline-none focus:ring-0 p-0 m-0 cursor-text caret-black disabled:opacity-40"
              aria-label={`Dígito ${idx + 1} del medidor`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default WaterMeterOtpInput;
