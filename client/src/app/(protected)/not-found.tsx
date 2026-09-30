import React from "react";
import Link from "next/link";
import { Compass, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProtectedNotFound() {
  return (
    <div className="h-full w-full flex items-center justify-center p-6 bg-slate-100 select-none">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 max-w-md w-full border border-gray-200/80 shadow-md text-center flex flex-col items-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 shadow-xs">
          <Compass className="w-7 h-7" />
        </div>
        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/60 px-2.5 py-0.5 rounded-full mb-2">
          Error 404
        </span>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight mb-2">
          Página no encontrada
        </h1>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          La ruta que intentas consultar no existe o no se encuentra disponible dentro del sistema geoespacial.
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
