"use client";

import React from "react";
import { Layers } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { LoteConsultation } from "../../../domain/entities/consultation.entity";
import { ConsultationMobileResultsScroll } from "./consultation-mobile-results-scroll";

export type LotesResultsViewProps = {
  items: LoteConsultation[];
};

export function LotesResultsView({ items }: LotesResultsViewProps) {
  return (
    <div className="w-full space-y-4">
      {/* ── Vista Tabla para Escritorio (>= 1024px) ───────────────────────── */}
      <div className="hidden lg:block w-full rounded-2xl sm:rounded-3xl bg-white border-0 shadow-none overflow-hidden select-none">
        <Table containerClassName="overflow-x-auto">
          <TableHeader>
            <TableRow className="border-b border-slate-100/80 bg-slate-50/40 hover:bg-slate-50/40">
              <TableHead className="py-4 pl-6 pr-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">N° Lote</TableHead>
              <TableHead className="py-4 pr-6 pl-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Código UV-Manzana</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow
                key={item.id}
                className="border-b border-slate-100/70 hover:bg-slate-50/50 transition-colors last:border-b-0"
              >
                <TableCell className="py-3.5 pl-6 pr-4 font-sans font-medium text-slate-900">
                  {item.lotNumber ? `Lote ${item.lotNumber}` : "-"}
                </TableCell>
                <TableCell className="py-3.5 pr-6 pl-4 font-mono font-medium text-slate-700">
                  {item.manzanaUvBlockCode || "-"}
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
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-2xl bg-emerald-50 text-emerald-600 shrink-0 border-0 shadow-none">
                <Layers className="size-4" />
              </span>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Predio / Lote
                </span>
                <h4 className="text-sm font-medium text-slate-900 truncate">
                  {item.lotNumber ? `Lote ${item.lotNumber}` : "Sin número"}
                </h4>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50/80 p-3 sm:p-3.5 text-xs flex items-center justify-between border-0 text-slate-600 font-sans">
              <span className="text-slate-500">Manzana (UV-MZ):</span>
              <span className="font-semibold text-slate-800 font-mono">
                {item.manzanaUvBlockCode || "Sin asociar"}
              </span>
            </div>
          </div>
        ))}
      </ConsultationMobileResultsScroll>
    </div>
  );
}
