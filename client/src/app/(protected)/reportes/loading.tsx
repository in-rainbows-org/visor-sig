import React from "react";
import { PageHeroSkeleton } from "@/features/shared/presentation/components/layout/page-hero-skeleton";

export default function ReportesLoading() {
  return (
    <div
      aria-label="Cargando reportes"
      data-purpose="reportes-loading"
      className="h-full w-full lg:-ml-[32px] lg:pl-[32px] lg:w-[calc(100%+32px)] overflow-y-auto bg-slate-50/70 overscroll-contain select-none"
    >
      {/* 1. Silueta de PageHero conectada */}
      <PageHeroSkeleton />

      <div className="p-6 pb-24 lg:pb-6 flex items-center justify-center">
        <div className="bg-white/95 rounded-2xl p-8 max-w-md w-full border border-gray-200/80 shadow-xs text-center flex flex-col items-center animate-pulse space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center" />
          <div className="w-36 h-5 rounded-full bg-slate-200" />
          <div className="w-64 h-3.5 rounded bg-slate-100" />
          <div className="w-48 h-3.5 rounded bg-slate-100" />
          <div className="w-32 h-10 rounded-xl bg-slate-200 mt-2" />
        </div>
      </div>
    </div>
  );
}
