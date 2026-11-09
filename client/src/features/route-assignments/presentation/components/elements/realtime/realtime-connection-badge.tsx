"use client";

import React from "react";
import { Radio, RefreshCw, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RealtimeConnectionStatus } from "../../../../domain/entities/realtime-tracking.entity";

export interface RealtimeConnectionBadgeProps {
  status: RealtimeConnectionStatus;
  className?: string;
}

export function RealtimeConnectionBadge({
  status,
  className,
}: RealtimeConnectionBadgeProps) {
  if (status === "CONNECTED") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold",
          "bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs select-none",
          className
        )}
        title="Canal WebSocket activo: recibiendo actualizaciones en tiempo real"
      >
        <span className="relative flex size-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
        </span>
        <Radio className="size-3.5 stroke-[2.2]" />
        <span>En vivo</span>
      </div>
    );
  }

  if (status === "CONNECTING" || status === "RECONNECTING") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold",
          "bg-amber-50 text-amber-700 border border-amber-200/80 shadow-xs select-none",
          className
        )}
        title="Restableciendo enlace WebSocket en tiempo real..."
      >
        <RefreshCw className="size-3.5 stroke-[2.2] animate-spin text-amber-600" />
        <span>Reconectando</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold",
        "bg-slate-100 text-slate-500 border border-slate-200/80 shadow-xs select-none",
        className
      )}
      title="Canal en tiempo real desconectado"
    >
      <WifiOff className="size-3.5 stroke-[2]" />
      <span>Sin conexión</span>
    </div>
  );
}
