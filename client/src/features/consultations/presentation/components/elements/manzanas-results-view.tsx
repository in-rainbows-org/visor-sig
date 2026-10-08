"use client";

import React from "react";
import { Milestone } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import type { ManzanaConsultation } from "../../../domain/entities/consultation.entity";

export type ManzanasResultsViewProps = {
  items: ManzanaConsultation[];
};

export function ManzanasResultsView({ items }: ManzanasResultsViewProps) {
  return (
    <div className="w-full space-y-4">
      {/* ── Vista Tabla para Escritorio (>= 1024px) ───────────────────────── */}
      <div className="hidden lg:block w-full rounded-2xl border bg-card shadow-xs overflow-hidden">
        <Table containerClassName="max-h-[485px] overflow-auto">
          <TableHeader className="sticky top-0 z-10 bg-slate-100 shadow-xs [&_th]:sticky [&_th]:top-0 [&_th]:bg-slate-100 [&_th]:z-10">
            <TableRow>
              <TableHead className="font-label text-xs uppercase tracking-wider">Código UV-Manzana</TableHead>
              <TableHead className="font-label text-xs uppercase tracking-wider">Unidad Vecinal</TableHead>
              <TableHead className="font-label text-xs uppercase tracking-wider">N° Manzana</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-sans font-semibold text-foreground">
                  {item.uvBlockCode || "-"}
                </TableCell>
                <TableCell className="font-sans text-muted-foreground">{item.uv || "-"}</TableCell>
                <TableCell className="font-mono text-muted-foreground">
                  {item.blockNumber || "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* ── Vista Tarjetas para Móvil y Tablet (< 1024px) ──────────────────── */}
      <div className="block lg:hidden w-full">
        <div className="max-h-[430px] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {items.map((item) => (
              <Card
                key={item.id}
                className="rounded-2xl border border-slate-200/90 bg-card shadow-xs hover:border-slate-300 transition-all overflow-hidden"
              >
                <CardContent className="p-4 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-amber-50 text-amber-600">
                      <Milestone className="size-4" />
                    </span>
                    <div>
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-label">
                        Manzana Catastral
                      </span>
                      <h4 className="text-sm font-bold text-foreground font-headline">
                        {item.uvBlockCode || "Manzana"}
                      </h4>
                    </div>
                  </div>

                  <div className="rounded-xl bg-muted/40 p-2.5 text-xs grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground block text-[11px] font-label">Unidad Vecinal:</span>
                      <span className="font-semibold text-foreground font-sans">{item.uv || "-"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px] font-label">N° Manzana:</span>
                      <span className="font-semibold text-foreground font-mono">{item.blockNumber || "-"}</span>
                    </div>
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
