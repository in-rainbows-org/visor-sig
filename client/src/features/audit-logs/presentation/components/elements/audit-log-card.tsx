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
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs space-y-3 transition-shadow hover:shadow-sm">
      {/* Cabecera: Avatar + Nombre + Badge de Acción */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-9 rounded-full border border-slate-200 text-slate-600 flex items-center justify-center bg-slate-100 overflow-hidden shrink-0 shadow-2xs font-semibold text-xs">
            {item.userImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.userImage}
                alt={item.userName ?? item.userId}
                className="w-full h-full object-cover"
              />
            ) : (
              getUserInitials(item.userName)
            )}
          </div>
          <div className="min-w-0">
            <span className="text-sm font-semibold text-slate-900 truncate block">
              {item.userName || "Usuario del Sistema"}
            </span>
          </div>
        </div>

        <ActionBadge action={item.action} />
      </div>

      {/* Descripción */}
      <div className="rounded-xl bg-slate-50/70 p-3 border border-slate-100 text-xs text-slate-700 leading-relaxed font-sans">
        {item.description}
      </div>

      {/* Footer con Timestamp */}
      <div className="flex items-center justify-end text-[11px] font-mono text-slate-400 gap-1.5 pt-1 border-t border-slate-100">
        <Calendar className="size-3 text-slate-400" />
        <span>{formatDate(item.createdDate)}</span>
      </div>
    </div>
  );
}
