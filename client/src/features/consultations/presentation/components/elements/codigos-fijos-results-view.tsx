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
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { CodigoFijoConsultation } from "../../../domain/entities/consultation.entity";

export type CodigosFijosResultsViewProps = {
  items: CodigoFijoConsultation[];
};

// Badge de estado numérico (1 a 5)
function CodigoFijoStatusBadge({ status }: { status: number }) {
  let label = `Estado ${status}`;
  let badgeClass = "bg-slate-100 text-slate-700 border-slate-200";

  switch (status) {
    case 1:
      label = "Activo";
      badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
      break;
    case 2:
      label = "Pendiente";
      badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
      break;
    case 3:
      label = "Cortado";
      badgeClass = "bg-rose-50 text-rose-700 border-rose-200";
      break;
    case 4:
      label = "Inactivo";
      badgeClass = "bg-slate-100 text-slate-700 border-slate-300";
      break;
    case 5:
      label = "Baja";
      badgeClass = "bg-red-50 text-red-700 border-red-200";
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-label border ${badgeClass}`}
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
      <div className="hidden lg:block w-full rounded-2xl border bg-card shadow-xs overflow-hidden">
        <Table containerClassName="max-h-[485px] overflow-auto">
          <TableHeader className="sticky top-0 z-10 bg-slate-100 shadow-xs [&_th]:sticky [&_th]:top-0 [&_th]:bg-slate-100 [&_th]:z-10">
            <TableRow>
              <TableHead className="font-label text-xs uppercase tracking-wider">Etiqueta</TableHead>
              <TableHead className="font-label text-xs uppercase tracking-wider">Código Fijo</TableHead>
              <TableHead className="font-label text-xs uppercase tracking-wider">Titular / Nombre</TableHead>
              <TableHead className="font-label text-xs uppercase tracking-wider">Estado</TableHead>
              <TableHead className="font-label text-xs uppercase tracking-wider">N° Lote</TableHead>
              <TableHead className="text-right font-label text-xs uppercase tracking-wider">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-sans font-semibold text-foreground">
                  {item.label || "-"}
                </TableCell>
                <TableCell className="font-mono text-muted-foreground">
                  {item.fixedCode ?? "-"}
                </TableCell>
                <TableCell className="font-sans text-foreground">{item.name || "-"}</TableCell>
                <TableCell>
                  <CodigoFijoStatusBadge status={item.status} />
                </TableCell>
                <TableCell className="font-mono text-muted-foreground">
                  {item.lotNumber || "-"}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl border-sky-200 bg-sky-50/50 text-sky-700 hover:bg-sky-100 hover:text-sky-800 transition-colors shadow-none text-xs font-sans gap-1.5"
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
      <div className="block lg:hidden w-full">
        <div className="max-h-[585px] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {items.map((item) => (
              <Card
                key={item.id}
                className="rounded-2xl border border-slate-200/90 bg-card shadow-xs hover:border-slate-300 transition-all overflow-hidden"
              >
                <CardContent className="p-4 flex flex-col justify-between gap-3.5">
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-xl bg-blue-50 text-blue-600">
                          <Hash className="size-4" />
                        </span>
                        <div>
                          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-label">
                            {item.label || "Código Fijo"}
                          </span>
                          <h4 className="text-sm font-bold text-foreground font-headline">
                            {item.fixedCode ? `#${item.fixedCode}` : "Sin código"}
                          </h4>
                        </div>
                      </div>
                      <CodigoFijoStatusBadge status={item.status} />
                    </div>

                    <div className="rounded-xl bg-muted/40 p-2.5 space-y-1.5 text-xs">
                      <div className="flex items-center gap-2 text-slate-700">
                        <User className="size-3.5 text-slate-400 shrink-0" />
                        <span className="font-medium truncate font-sans">
                          {item.name || "Sin titular registrado"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground pt-1 border-t border-border/50">
                        <span className="font-label text-xs">Lote asociado:</span>
                        <span className="font-semibold text-foreground font-mono">
                          {item.lotNumber || "No asignado"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Botón de acción: Ver en el mapa (exclusivo de códigos fijos) */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-xl border-sky-200 bg-sky-50/50 text-sky-700 hover:bg-sky-100 hover:text-sky-800 transition-colors shadow-none text-xs font-sans gap-2 mt-1"
                    onClick={() => handleNavigateToMap(item)}
                  >
                    <MapPin className="size-3.5 text-sky-600" />
                    <span>Ver en el mapa</span>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
