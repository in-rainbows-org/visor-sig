"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LogIn,
  LogOut,
  Search,
  PlusCircle,
  RefreshCw,
  Trash2,
  Calendar,
  Activity,
} from "lucide-react";
import type { ActionType, AuditLogItem } from "../../../domain/entities/audit-log.entity";

export interface AuditLogsTableProps {
  items: AuditLogItem[];
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
      second: "2-digit",
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

export function ActionBadge({ action }: { action: ActionType }) {
  switch (action) {
    case "LOGIN":
      return (
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border-0 shadow-none">
          <LogIn className="size-3.5" />
          <span>Inicio de Sesión</span>
        </span>
      );
    case "LOGOUT":
      return (
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border-0 shadow-none">
          <LogOut className="size-3.5" />
          <span>Cierre de Sesión</span>
        </span>
      );
    case "SEARCH":
      return (
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-600 border-0 shadow-none">
          <Search className="size-3.5" />
          <span>Consulta</span>
        </span>
      );
    case "CREATE":
      return (
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-600 border-0 shadow-none">
          <PlusCircle className="size-3.5" />
          <span>Creación</span>
        </span>
      );
    case "UPDATE":
      return (
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-600 border-0 shadow-none">
          <RefreshCw className="size-3.5" />
          <span>Actualización</span>
        </span>
      );
    case "DELETE":
      return (
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border-0 shadow-none">
          <Trash2 className="size-3.5" />
          <span>Eliminación</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border-0 shadow-none">
          <Activity className="size-3.5" />
          <span>{action}</span>
        </span>
      );
  }
}

export function AuditLogsTable({ items }: AuditLogsTableProps) {
  return (
    <div className="w-full rounded-2xl sm:rounded-3xl bg-white border-0 shadow-none overflow-hidden select-none">
      <Table containerClassName="overflow-x-auto">
        <TableHeader>
          <TableRow className="border-b border-slate-100/80 bg-slate-50/40 hover:bg-slate-50/40">
            <TableHead className="py-4 pl-6 pr-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Usuario
            </TableHead>
            <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Acción
            </TableHead>
            <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider min-w-[280px]">
              Descripción
            </TableHead>
            <TableHead className="py-4 pr-6 pl-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">
              Fecha y Hora
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {items.map((item) => (
            <TableRow
              key={item.id}
              className="border-b border-slate-100/70 hover:bg-slate-50/50 transition-colors last:border-b-0"
            >
              {/* Usuario */}
              <TableCell className="py-3.5 pl-6 pr-4">
                <div className="flex items-center gap-3">
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
                    {/* Indicador de estado activo en esquina inferior */}
                    <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-slate-900 truncate block">
                      {item.userName || "Usuario del Sistema"}
                    </span>
                  </div>
                </div>
              </TableCell>

              {/* Acción */}
              <TableCell className="py-3.5 px-4 whitespace-nowrap">
                <ActionBadge action={item.action} />
              </TableCell>

              {/* Descripción */}
              <TableCell className="py-3.5 px-4">
                <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed font-normal max-w-xl">
                  {item.description}
                </p>
              </TableCell>

              {/* Fecha y Hora */}
              <TableCell className="py-3.5 pr-6 pl-4 text-right whitespace-nowrap">
                <div className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-normal">
                  <Calendar className="size-3.5 text-slate-400 stroke-[1.75]" />
                  <span>{formatDate(item.createdDate)}</span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
