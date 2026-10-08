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
import { cn } from "@/lib/utils";

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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
          <LogIn className="size-3.5" />
          <span>Inicio de Sesión</span>
        </span>
      );
    case "LOGOUT":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
          <LogOut className="size-3.5" />
          <span>Cierre de Sesión</span>
        </span>
      );
    case "SEARCH":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200/80">
          <Search className="size-3.5" />
          <span>Consulta</span>
        </span>
      );
    case "CREATE":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200/80">
          <PlusCircle className="size-3.5" />
          <span>Creación</span>
        </span>
      );
    case "UPDATE":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
          <RefreshCw className="size-3.5" />
          <span>Actualización</span>
        </span>
      );
    case "DELETE":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
          <Trash2 className="size-3.5" />
          <span>Eliminación</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-50 text-gray-700 border border-gray-200">
          <Activity className="size-3.5" />
          <span>{action}</span>
        </span>
      );
  }
}

export function AuditLogsTable({ items }: AuditLogsTableProps) {
  return (
    <div className="w-full rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
      <Table containerClassName="overflow-x-auto">
        <TableHeader>
          <TableRow className="border-b border-slate-200/70 bg-slate-50/70 hover:bg-slate-50/70">
            <TableHead className="py-3.5 pl-6 pr-4 text-xs font-semibold text-slate-700 tracking-wider">
              Usuario
            </TableHead>
            <TableHead className="py-3.5 px-4 text-xs font-semibold text-slate-700 tracking-wider">
              Acción
            </TableHead>
            <TableHead className="py-3.5 px-4 text-xs font-semibold text-slate-700 tracking-wider min-w-[280px]">
              Descripción
            </TableHead>
            <TableHead className="py-3.5 pr-6 pl-4 text-xs font-semibold text-slate-700 tracking-wider text-right">
              Fecha y Hora
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {items.map((item) => (
            <TableRow
              key={item.id}
              className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors"
            >
              {/* Usuario */}
              <TableCell className="py-3.5 pl-6 pr-4">
                <div className="flex items-center gap-3">
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
              </TableCell>

              {/* Acción */}
              <TableCell className="py-3.5 px-4 whitespace-nowrap">
                <ActionBadge action={item.action} />
              </TableCell>

              {/* Descripción */}
              <TableCell className="py-3.5 px-4">
                <p className="text-xs text-slate-700 leading-relaxed font-sans max-w-xl">
                  {item.description}
                </p>
              </TableCell>

              {/* Fecha y Hora */}
              <TableCell className="py-3.5 pr-6 pl-4 text-right whitespace-nowrap">
                <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                  <Calendar className="size-3.5 text-slate-400" />
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
