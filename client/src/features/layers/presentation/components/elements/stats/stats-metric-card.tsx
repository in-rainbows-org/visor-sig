"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface StatsMetricCardProps {
  title: string;
  count: number;
  percentageFormatted?: string;
  isTotal?: boolean;
  colorHex?: string;
  iconAsset: string;
  className?: string;
}

export function StatsMetricCard({
  title,
  count,
  percentageFormatted,
  isTotal = false,
  colorHex,
  iconAsset,
  className,
}: StatsMetricCardProps) {
  const formattedCount = new Intl.NumberFormat("es-ES").format(count);

  return (
    <div
      className={cn(
        "group relative select-none rounded-[24px] sm:rounded-[28px] transition-all duration-200 border-0 shadow-none overflow-hidden",
        "flex items-center justify-between gap-2",
        isTotal
          ? "p-3.5 sm:p-4.5 xl:p-5 h-[120px] sm:h-[135px] xl:h-[125px] max-h-[120px] sm:max-h-[135px] xl:max-h-[125px] bg-gradient-to-br from-[#0e4dcb] via-[#1660dc] to-[#2d83f3] text-white"
          : "p-3 sm:p-3.5 xl:p-5 h-[85px] sm:h-[94px] xl:h-[125px] max-h-[85px] sm:max-h-[94px] xl:max-h-[125px] bg-white text-slate-800",
        className
      )}
    >
      {/* Lado izquierdo: Información textual con z-10 */}
      <div className="flex flex-col justify-between h-full z-10 min-w-0 pr-1 py-0.5">
        <span
          className={cn(
            "text-xs font-semibold tracking-wide truncate",
            isTotal ? "text-white/90" : "text-slate-600"
          )}
          title={title}
        >
          {title}
        </span>
        <div className="my-0.5 sm:my-1">
          <span
            className={cn(
              "text-xl sm:text-2xl 2xl:text-3xl font-extrabold tracking-tight leading-none block truncate",
              isTotal ? "text-white" : "text-slate-900"
            )}
          >
            {formattedCount}
          </span>
        </div>
        <span
          className={cn(
            "text-[10px] sm:text-[11px] font-semibold leading-tight flex items-center gap-1.5",
            isTotal ? "text-blue-100" : "text-slate-600"
          )}
        >
          {!isTotal && colorHex && (
            <span
              className="w-2 h-2 rounded-full inline-block shrink-0"
              style={{ backgroundColor: colorHex }}
            />
          )}
          {percentageFormatted ?? (isTotal ? "100% Cobertura" : "")}
        </span>
      </div>

      {/* Lado derecho: Imagen */}
      {isTotal ? (
        /* Tarjeta Total: zoom central en hover */
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 xl:w-20 xl:h-20 2xl:w-[84px] 2xl:h-[84px] shrink-0 transition-transform duration-300 ease-out origin-center group-hover:scale-108">
          <Image
            src={iconAsset}
            alt={title}
            fill
            sizes="(max-width: 640px) 80px, 96px"
            className="object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
          />
        </div>
      ) : (
        /* Tarjetas de Estado (PNG): escala reducida 2%, movida 5% a la izquierda y zoom central en hover */
        <div
          className={cn(
            "relative shrink-0 transition-transform duration-300 ease-out origin-center group-hover:scale-108",
            "w-[98px] h-[98px] sm:w-[108px] sm:h-[108px] -mr-[23px] sm:-mr-[27px]",
            "xl:w-[63px] xl:h-[63px] 2xl:w-[71px] 2xl:h-[71px] xl:-mr-[5px] 2xl:-mr-[5px]"
          )}
        >
          <Image
            src={iconAsset}
            alt={title}
            fill
            sizes="(max-width: 640px) 98px, 108px"
            className="object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
          />
        </div>
      )}
    </div>
  );
}
