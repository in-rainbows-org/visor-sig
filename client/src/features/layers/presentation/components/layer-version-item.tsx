"use client";

import React from "react";
import { FileCode, CheckCircle2, Clock, AlertTriangle, ArrowUpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DataVersion } from "../../domain/entities/data-version.entity";
import { formatUpdatedDate } from "./layer-theme-helper";

export type LayerVersionItemProps = {
  version: DataVersion;
  onActivate: (version: DataVersion) => void;
  isActivating?: boolean;
};

export function LayerVersionItem({
  version,
  onActivate,
  isActivating = false,
}: LayerVersionItemProps) {
  const isFailed = version.status === "FAILED";
  const isProcessing = version.status === "PROCESSING";
  const isReady = version.status === "READY";

  return (
    <div
      className={cn(
        "bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs relative transition-all",
        version.isActive && "ring-1 ring-emerald-500/50 border-emerald-300"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5",
              version.isActive
                ? "bg-emerald-50 text-emerald-600"
                : "bg-slate-100 text-slate-600"
            )}
          >
            <FileCode className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-800 truncate">
                {version.sourceFilename}
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                v{version.versionNumber}
              </span>
            </div>

            <p className="text-[11px] text-slate-500 mt-0.5">
              {version.featureCount.toLocaleString()} geometrías procesadas
            </p>

            {version.errorMessage && (
              <p className="text-[11px] text-rose-600 font-medium mt-1">
                {version.errorMessage}
              </p>
            )}
          </div>
        </div>

        {/* Insignia de estado / Botón Activar */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {version.isActive ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Activa
            </span>
          ) : isReady ? (
            <Button
              size="sm"
              variant="outline"
              disabled={isActivating}
              onClick={() => onActivate(version)}
              className="gap-1 h-7 px-2.5 rounded-lg text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 shadow-xs"
            >
              <ArrowUpCircle className="w-3.5 h-3.5" />
              Activar versión
            </Button>
          ) : isProcessing ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="w-3 h-3 text-amber-500" />
              Procesando
            </span>
          ) : isFailed ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
              <AlertTriangle className="w-3 h-3 text-rose-500" />
              Fallido
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>Cargado: {formatUpdatedDate(version.createdAt)}</span>
      </div>
    </div>
  );
}

export default LayerVersionItem;
