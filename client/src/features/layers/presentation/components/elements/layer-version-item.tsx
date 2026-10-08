"use client";

import React from "react";
import { FileCode, CheckCircle2, Clock, AlertTriangle, ArrowUpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DataVersion } from "../../../domain/entities/data-version.entity";
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

            <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatUpdatedDate(version.createdAt)}
              </span>

              {version.isActive && (
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  <CheckCircle2 className="w-3 h-3" />
                  Activa
                </span>
              )}

              {isProcessing && (
                <span className="inline-flex items-center gap-1 font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  Procesando
                </span>
              )}

              {isFailed && (
                <span className="inline-flex items-center gap-1 font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                  <AlertTriangle className="w-3 h-3" />
                  Falló
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Botón de activación / reversión */}
        {isReady && !version.isActive && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onActivate(version)}
            disabled={isActivating}
            className="flex-shrink-0 gap-1.5 text-xs rounded-xl border-slate-200 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50"
          >
            <ArrowUpCircle className="w-3.5 h-3.5" />
            Activar
          </Button>
        )}
      </div>
    </div>
  );
}

export default LayerVersionItem;
