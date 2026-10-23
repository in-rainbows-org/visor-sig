"use client";

import React from "react";
import { Calendar } from "lucide-react";
import type { AuditLogItem } from "../../../domain/entities/audit-log.entity";
import { ActionBadge } from "./audit-logs-table";

export interface AuditLogCardProps {
  item: AuditLogItem;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return dateStr;
  }
}

function getUserInitials(name: string | null): string {
  if (!name) return "US";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function AuditLogCard({ item }: AuditLogCardProps) {
  return (
    <div className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-5 border-0 shadow-none space-y-3 select-none hover:bg-white/95 transition-all">
      {/* Cabecera: Avatar + Nombre + Badge de Acción */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative size-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs shrink-0 border-0 shadow-none">
            {item.userImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.userImage}
                alt={item.userName ?? item.userId}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              getUserInitials(item.userName)
            )}
            <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
          <div className="min-w-0">
            <span className="text-sm font-medium text-slate-900 truncate block">
              {item.userName || "Usuario del Sistema"}
            </span>
          </div>
        </div>

        <ActionBadge action={item.action} />
      </div>

      {/* Descripción en caja gris redondeada suave sin contornos */}
      <div className="rounded-2xl bg-slate-50/80 p-3 sm:p-3.5 border-0 text-xs text-slate-600 leading-relaxed font-sans">
        {item.description}
      </div>

      {/* Footer con Timestamp */}
      <div className="flex items-center justify-end text-xs text-slate-400 gap-1.5 pt-0.5">
        <Calendar className="size-3.5 text-slate-400 stroke-[1.75]" />
        <span>{formatDate(item.createdDate)}</span>
      </div>
    </div>
  );
}
