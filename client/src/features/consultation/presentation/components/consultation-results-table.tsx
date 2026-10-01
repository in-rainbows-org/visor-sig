"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { FileText, MapPin, AlertCircle, Loader2 } from "lucide-react";
import { ConsultationRecord } from "../../domain/models/consultation";

export interface ConsultationResultsTableProps {
  items: ConsultationRecord[];
  total: number;
  isLoading: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function ConsultationResultsTable({
  items,
  total,
  isLoading,
  error,
  onRetry,
}: ConsultationResultsTableProps) {
  const router = useRouter();

  const handleViewOnMap = (record: ConsultationRecord) => {
    // Redirección al mapa principal transportando parámetros completos de la entidad seleccionada
    const params = new URLSearchParams();
    params.set("from", "consultation");
    params.set("layer", record.layerKind);
    params.set("entity_id", record.id);
    if (record.code) params.set("code", record.code);

    const attrs = (record.attributes || {}) as Record<string, unknown>;
    const fixedCodeNum =
      attrs.fixed_code !== undefined
        ? String(attrs.fixed_code)
        : record.code.replace(/^[^\d]*/, "") || record.code;
    params.set("fixed_code_num", fixedCodeNum);

    const entityName = String(attrs.name || attrs.label || record.manzana || "Predio Registrado");
    params.set("name", entityName);

    const uv = String(attrs.uv || "14");
    const mz = String(attrs.block_number || attrs.mz || (record.manzana ? record.manzana.replace(/^M-/, "") : "08"));
    const lote = String(attrs.lot_number || attrs.lote || "12");

    params.set("uv", uv);
    params.set("mz", mz);
    params.set("lote", lote);

    params.set("status", record.status);
    params.set("status_val", String(attrs.status ?? 1));
    params.set("status_color", record.statusColor);

    if (record.latitude && record.longitude) {
      params.set("lat", String(record.latitude));
      params.set("lng", String(record.longitude));
    }
    router.push(`/mapa?${params.toString()}`);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
      {/* Barra de cabecera de la tabla */}
      <div className="px-5 py-3.5 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <span className="text-blue-600 bg-blue-50 p-1 rounded-lg">
            <FileText className="w-4 h-4" />
          </span>
          <span className="text-sm font-bold text-slate-900">
            Resultados: {total} {total === 1 ? "entidad" : "entidades"}
          </span>
        </div>

        <div className="flex items-center space-x-1.5 text-xs text-slate-600 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs">
          <span className="font-medium">Mostrar 10</span>
        </div>
      </div>

      {/* Contenido de la tabla / Estados */}
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
          <p className="text-xs font-medium">Buscando entidades...</p>
        </div>
      ) : error ? (
        <div className="py-12 px-6 flex flex-col items-center justify-center text-center">
          <AlertCircle className="w-8 h-8 text-amber-500 mb-2" />
          <p className="text-sm font-medium text-slate-800">{error}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
            >
              Reintentar búsqueda
            </button>
          )}
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 px-6 flex flex-col items-center justify-center text-center text-slate-500">
          <FileText className="w-8 h-8 text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-700">
            No se encontraron resultados
          </p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Prueba ajustando los criterios de búsqueda o seleccionando otra capa disponible.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-blue-50/50 text-slate-900 border-b border-slate-100 font-semibold">
              <tr>
                <th className="py-3 px-5">Código</th>
                <th className="py-3 px-5">Manzana</th>
                <th className="py-3 px-5">Superficie</th>
                <th className="py-3 px-5">Estado</th>
                <th className="py-3 px-5">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-normal">
              {items.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  <td className="py-3 px-5 font-medium text-slate-900">
                    {row.code}
                  </td>
                  <td className="py-3 px-5 text-slate-600">
                    {row.manzana || "-"}
                  </td>
                  <td className="py-3 px-5 text-slate-600 font-medium">
                    {row.surface || "-"}
                  </td>
                  <td className="py-3 px-5">
                    <div className="flex items-center">
                      <span
                        className={`w-2.5 h-2.5 rounded-full mr-2 inline-block ${
                          row.statusColor === "emerald"
                            ? "bg-emerald-500"
                            : row.statusColor === "amber"
                            ? "bg-amber-500"
                            : "bg-slate-400"
                        }`}
                      />
                      <span className="text-slate-700 font-medium">
                        {row.status}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-5">
                    <button
                      type="button"
                      onClick={() => handleViewOnMap(row)}
                      className="border border-sky-300 hover:border-sky-400 bg-sky-50/40 hover:bg-sky-50 text-sky-600 rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer w-fit"
                      title="Ver en mapa principal"
                    >
                      <MapPin className="w-3.5 h-3.5 text-sky-500" />
                      <span>Ver en mapa</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
