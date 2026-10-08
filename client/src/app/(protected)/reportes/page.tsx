import React from "react";
import Link from "next/link";
import { BarChart3, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ReportesPage() {
  return (
    <div className="h-full w-full flex items-center justify-center p-6 pb-24 lg:pb-6 overflow-y-auto bg-slate-100 select-none overscroll-contain">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 max-w-md w-full border border-gray-200/80 shadow-md text-center flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 shadow-xs">
          <BarChart3 className="w-7 h-7" />
        </div>
        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full mb-2">
          Módulo de Consultoría
        </span>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight mb-2">
          Historial y Reportes
        </h1>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          Generación y exportación de reportes territoriales, métricas de estados de códigos fijos y resúmenes estadísticos. Próximamente disponible.
        </p>
        <Button asChild className="gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs">
          <Link href="/mapa">
            <ArrowLeft className="w-4 h-4" />
            Volver al Mapa
          </Link>
        </Button>
      </div>
    </div>
  );
}
