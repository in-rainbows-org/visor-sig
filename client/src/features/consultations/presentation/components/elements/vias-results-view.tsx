"use client";

import React from "react";
import { Navigation } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import type { ViaConsultation } from "../../../domain/entities/consultation.entity";

export type ViasResultsViewProps = {
  items: ViaConsultation[];
};

export function ViasResultsView({ items }: ViasResultsViewProps) {
  return (
    <div className="w-full space-y-4">
      {/* ── Vista Tabla para Escritorio (>= 1024px) ───────────────────────── */}
      <div className="hidden lg:block w-full rounded-2xl border bg-card shadow-xs overflow-hidden">
        <Table containerClassName="max-h-[485px] overflow-auto">
          <TableHeader className="sticky top-0 z-10 bg-slate-100 shadow-xs [&_th]:sticky [&_th]:top-0 [&_th]:bg-slate-100 [&_th]:z-10">
            <TableRow>
              <TableHead className="font-label text-xs uppercase tracking-wider">Nombre de Vía</TableHead>
              <TableHead className="font-label text-xs uppercase tracking-wider">Referencia</TableHead>
              <TableHead className="font-label text-xs uppercase tracking-wider">Tipo de Vía</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-sans font-semibold text-foreground">
                  {item.name || "-"}
                </TableCell>
                <TableCell className="font-sans text-muted-foreground">
                  {item.reference || "-"}
                </TableCell>
                <TableCell className="font-sans text-muted-foreground">
                  {item.roadType || "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ── Vista Tarjetas para Móvil y Tablet (< 1024px) ──────────────────── */}
      <div className="block lg:hidden w-full">
        <div className="max-h-[400px] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {items.map((item) => (
              <Card
                key={item.id}
                className="rounded-2xl border border-slate-200/90 bg-card shadow-xs hover:border-slate-300 transition-all overflow-hidden"
              >
                <CardContent className="p-4 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-sky-50 text-sky-600">
                      <Navigation className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-label">
                        {item.roadType || "Vía Pública"}
                      </span>
                      <h4 className="text-sm font-bold text-foreground truncate font-headline">
                        {item.name || "Sin nombre registrado"}
                      </h4>
                    </div>
                  </div>

                  <div className="rounded-xl bg-muted/40 p-2.5 text-xs flex items-center justify-between">
                    <span className="text-muted-foreground font-label text-xs">Referencia:</span>
                    <span className="font-semibold text-foreground truncate max-w-[200px] font-sans">
                      {item.reference || "Sin referencia"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
