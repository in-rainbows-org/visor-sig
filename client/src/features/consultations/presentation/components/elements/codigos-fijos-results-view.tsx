"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { MapPin, Hash, User } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { CodigoFijoConsultation } from "../../../domain/entities/consultation.entity";
import { ConsultationMobileResultsScroll } from "./consultation-mobile-results-scroll";

export type CodigosFijosResultsViewProps = {
  items: CodigoFijoConsultation[];
};

// Badge de estado numérico (1 a 5)
function CodigoFijoStatusBadge({ status }: { status: number }) {
  let label = `Estado ${status}`;
  let badgeClass = "bg-slate-100 text-slate-600";

  switch (status) {
    case 1:
      label = "Activo";
      badgeClass = "bg-emerald-50 text-emerald-600";
      break;
    case 2:
      label = "Pendiente";
      badgeClass = "bg-amber-50 text-amber-600";
      break;
    case 3:
      label = "Cortado";
      badgeClass = "bg-rose-50 text-rose-600";
      break;
    case 4:
      label = "Inactivo";
      badgeClass = "bg-slate-100 text-slate-600";
      break;
    case 5:
      label = "Baja";
      badgeClass = "bg-red-50 text-red-600";
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold font-sans border-0 shadow-none ${badgeClass}`}
    >
      {label}
    </span>
  );
}

export function CodigosFijosResultsView({ items }: CodigosFijosResultsViewProps) {
  const router = useRouter();

  const handleNavigateToMap = (item: CodigoFijoConsultation) => {
    router.push(`/mapa?fixed_code_id=${encodeURIComponent(item.id)}`);
  };

  return (
    <div className="w-full space-y-4">
      {/* ── Vista Tabla para Escritorio (>= 1024px) ───────────────────────── */}
      <div className="hidden lg:block w-full rounded-2xl sm:rounded-3xl bg-white border-0 shadow-none overflow-hidden select-none">
        <Table containerClassName="overflow-x-auto">
          <TableHeader>
            <TableRow className="border-b border-slate-100/80 bg-slate-50/40 hover:bg-slate-50/40">
              <TableHead className="py-4 pl-6 pr-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Etiqueta</TableHead>
              <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Código Fijo</TableHead>
              <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Titular / Nombre</TableHead>
              <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Estado</TableHead>
              <TableHead className="py-4 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">N° Lote</TableHead>
              <TableHead className="py-4 pr-6 pl-4 text-right text-[11px] font-bold text-slate-500 uppercase tracking-wider">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow
                key={item.id}
                className="border-b border-slate-100/70 hover:bg-slate-50/50 transition-colors last:border-b-0"
              >
                <TableCell className="py-3.5 pl-6 pr-4 font-sans font-medium text-slate-900">
                  {item.label || "-"}
                </TableCell>
                <TableCell className="py-3.5 px-4 font-mono font-medium text-slate-700">
                  {item.fixedCode ?? "-"}
                </TableCell>
                <TableCell className="py-3.5 px-4 font-sans font-medium text-slate-900">{item.name || "-"}</TableCell>
                <TableCell className="py-3.5 px-4">
                  <CodigoFijoStatusBadge status={item.status} />
                </TableCell>
                <TableCell className="py-3.5 px-4 font-mono text-slate-600">
                  {item.lotNumber || "-"}
                </TableCell>
                <TableCell className="py-3.5 pr-6 pl-4 text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-full bg-sky-50 text-sky-600 hover:bg-sky-100 hover:text-sky-700 transition-colors border-0 shadow-none text-xs font-semibold gap-1.5 px-3.5 h-8 cursor-pointer"
                    onClick={() => handleNavigateToMap(item)}
                  >
                    <MapPin className="size-3.5 text-sky-600" />
                    <span>Ver en mapa</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ── Vista Tarjetas para Móvil y Tablet (< 1024px) ──────────────────── */}
      <ConsultationMobileResultsScroll itemCount={items.length}>
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl sm:rounded-3xl bg-white p-4 sm:p-5 border-0 shadow-none space-y-3 select-none hover:bg-white/95 transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="p-2 rounded-2xl bg-blue-50 text-blue-600 shrink-0 border-0 shadow-none">
                  <Hash className="size-4" />
                </span>
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    {item.label || "Código Fijo"}
                  </span>
                  <h4 className="text-sm font-medium text-slate-900 truncate">
                    {item.fixedCode ? `#${item.fixedCode}` : "Sin código"}
                  </h4>
                </div>
              </div>
              <CodigoFijoStatusBadge status={item.status} />
            </div>

            <div className="rounded-2xl bg-slate-50/80 p-3 sm:p-3.5 space-y-2 text-xs border-0 text-slate-600 font-sans">
              <div className="flex items-center gap-2 text-slate-700">
                <User className="size-3.5 text-slate-400 shrink-0" />
                <span className="font-medium truncate font-sans text-slate-800">
                  {item.name || "Sin titular registrado"}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-500 pt-1.5 border-t border-slate-100">
                <span className="text-xs">Lote asociado:</span>
                <span className="font-semibold text-slate-800 font-mono">
                  {item.lotNumber || "No asignado"}
                </span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="w-full rounded-full bg-sky-50 text-sky-600 hover:bg-sky-100 hover:text-sky-700 transition-colors border-0 shadow-none text-xs font-semibold gap-2 h-9 cursor-pointer"
              onClick={() => handleNavigateToMap(item)}
            >
              <MapPin className="size-3.5 text-sky-600" />
              <span>Ver en el mapa</span>
            </Button>
          </div>
        ))}
      </ConsultationMobileResultsScroll>
    </div>
  );
}
