import React from "react";
import { cn } from "@/lib/utils";

export type PageHeroSkeletonProps = {
  className?: string;
};

/**
 * Silueta skeleton para PageHero.
 * Reproduce exactamente el mismo layout, degradado continuo y curvatura
 * que el PageHero real para garantizar transiciones 100% fluidas sin layout shift.
 */
export function PageHeroSkeleton({ className }: PageHeroSkeletonProps) {
  return (
    <section
      data-purpose="page-hero-skeleton"
      className={cn(
        "w-full bg-[#0e4dcb] bg-hero-gradient-hero text-white rounded-b-[40px] sm:rounded-b-[48px] pt-16 sm:pt-16 lg:pt-11 pb-8 sm:pb-9 lg:pb-6 px-6 sm:px-10 lg:px-14 xl:px-18 shrink-0 border-0 shadow-none relative select-none",
        className
      )}
      style={{
        backgroundImage:
          "linear-gradient(to right, #0e4dcb 0%, #135ad6 28%, #1c6ee7 68%, #3392f9 100%)",
        backgroundSize: "100vw 100%",
      }}
    >
      {/* Pieza de encaje lateral con curva invertida (desktop) en skeleton */}
      <div
        data-purpose="sidebar-hero-skeleton-tab"
        className="hidden lg:block absolute -left-[32px] top-0 w-[32px] pointer-events-none z-0"
        style={{ height: "128px" }}
      >
        <svg
          width="32"
          height="128"
          viewBox="0 0 32 128"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <path
            d="M 0 0 L 0 96 A 32 32 0 0 1 32 128 L 32 0 Z"
            fill="#0e4dcb"
          />
        </svg>
      </div>

      <div className="w-full flex items-center justify-between gap-6 sm:gap-10 lg:gap-14 animate-pulse relative z-10">
        <div className="min-w-0 flex-1 max-w-2xl lg:max-w-3xl xl:max-w-4xl space-y-3">
          {/* Skeleton del título */}
          <div className="h-8 sm:h-10 lg:h-11 w-56 sm:w-80 lg:w-96 rounded-xl bg-white/25" />
          {/* Skeleton de la descripción */}
          <div className="h-4 sm:h-5 w-48 sm:w-72 lg:w-80 rounded-lg bg-white/15" />
        </div>

        {/* Skeleton del icono 3D */}
        <div className="w-20 h-20 sm:w-28 sm:h-28 lg:w-28 lg:h-28 xl:w-32 xl:h-32 rounded-3xl bg-white/20 shrink-0" />
      </div>
    </section>
  );
}

export default PageHeroSkeleton;
