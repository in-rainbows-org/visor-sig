"use client";

import { FileCode, Clock, AlertTriangle, ArrowUpCircle } from "lucide-react";
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
        "rounded-2xl p-4 transition-all duration-200 border-0 shadow-none relative select-none",
        version.isActive
          ? "bg-emerald-50/60 hover:bg-emerald-50/80"
          : isFailed
          ? "bg-rose-50/60 hover:bg-rose-50/80"
          : isProcessing
          ? "bg-blue-50/60 hover:bg-blue-50/80"
          : "bg-slate-100/60 hover:bg-slate-100/85"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-2xs border-0",
              version.isActive
                ? "bg-white text-emerald-600"
                : isFailed
                ? "bg-white text-rose-600"
                : isProcessing
                ? "bg-white text-blue-600"
                : "bg-white text-slate-600"
            )}
          >
            <FileCode className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-800 truncate">
                {version.sourceFilename}
              </span>
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] font-bold border-0",
                  version.isActive
                    ? "bg-emerald-100/80 text-emerald-800"
                    : "bg-slate-200/70 text-slate-600"
                )}
              >
                v{version.versionNumber}
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <span>{version.featureCount.toLocaleString()} geometrías</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {formatUpdatedDate(version.createdAt)}
              </span>
            </p>

            {version.errorMessage && (
              <p className="text-xs text-rose-600 font-medium mt-1.5">
                {version.errorMessage}
              </p>
            )}

            <div className="flex items-center gap-2 mt-2 text-[11px]">
              {version.isActive && (
                <span className="inline-flex items-center gap-1.5 font-bold text-emerald-800 bg-white/90 px-2.5 py-0.5 rounded-full shadow-2xs border-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Activa
                </span>
              )}

              {isProcessing && (
                <span className="inline-flex items-center gap-1 font-semibold text-blue-600 bg-white/90 px-2.5 py-0.5 rounded-full shadow-2xs border-0">
                  Procesando
                </span>
              )}

              {isFailed && (
                <span className="inline-flex items-center gap-1 font-semibold text-rose-600 bg-white/90 px-2.5 py-0.5 rounded-full shadow-2xs border-0">
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
            variant="ghost"
            onClick={() => onActivate(version)}
            disabled={isActivating}
            className="flex-shrink-0 h-8 px-3 rounded-full text-xs font-semibold text-blue-600 bg-white hover:bg-blue-50 hover:text-blue-700 shadow-2xs border-0 cursor-pointer"
          >
            <ArrowUpCircle className="w-3.5 h-3.5 mr-1" />
            Activar
          </Button>
        )}
      </div>
    </div>
  );
}

export default LayerVersionItem;
