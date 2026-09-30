"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Spinner } from "@/components/ui/spinner";
import { Database } from "lucide-react";
import type { DataVersion } from "../../domain/entities/data-version.entity";
import { httpDataVersionRepository } from "../../infrastructure/repositories/http-data-version.repository";
import { dataVersionCache } from "../../infrastructure/services/data-version-cache.service";
import { LayerVersionItem } from "./layer-version-item";
import { RollbackConfirmDialog } from "./rollback-confirm-dialog";

export type LayerVersionListProps = {
  layerId: string;
  onVersionActivated?: () => void;
};

export function LayerVersionList({
  layerId,
  onVersionActivated,
}: LayerVersionListProps) {
  const cached = dataVersionCache.get(layerId);
  const [versions, setVersions] = useState<DataVersion[]>(cached ?? []);
  const [isLoading, setIsLoading] = useState<boolean>(!cached);
  const [error, setError] = useState<string | null>(null);
  const [versionToActivate, setVersionToActivate] =
    useState<DataVersion | null>(null);

  const [reloadKey, setReloadKey] = useState(0);

  const fetchVersions = useCallback(() => {
    dataVersionCache.invalidate(layerId);
    setReloadKey((prev) => prev + 1);
  }, [layerId]);

  useEffect(() => {
    // Si ya tenemos versiones cacheadas y no es una recarga explícita, no realizamos petición
    if (dataVersionCache.has(layerId) && reloadKey === 0) {
      return;
    }

    let isMounted = true;
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await httpDataVersionRepository.listByLayer(layerId);
        if (!isMounted) return;
        if (result.ok) {
          dataVersionCache.set(layerId, result.data);
          setVersions(result.data);
        } else {
          setError(result.errors?.[0] ?? "Error al cargar las versiones.");
        }
      } catch {
        if (!isMounted) return;
        setError("Error de conexión al cargar el historial.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [layerId, reloadKey]);

  const handleRollbackSuccess = () => {
    fetchVersions();
    onVersionActivated?.();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 gap-3 bg-white rounded-2xl border border-slate-200/80">
        <Spinner className="w-5 h-5 text-blue-600" />
        <span className="text-xs text-slate-500 font-medium">
          Cargando historial de versiones...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 text-center space-y-2">
        <p>{error}</p>
        <button
          onClick={fetchVersions}
          className="text-blue-600 font-semibold hover:underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300 space-y-2">
        <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center">
          <Database className="w-5 h-5" />
        </div>
        <p className="text-xs font-semibold text-slate-700">
          Sin importaciones de datos
        </p>
        <p className="text-[11px] text-slate-400 max-w-xs">
          Esta capa aún no contiene datos espaciales. Usa el botón &quot;Importar
          Nuevo Dataset (ZIP)&quot; para cargar su primer archivo Shapefile.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {versions.map((ver) => (
          <LayerVersionItem
            key={ver.id}
            version={ver}
            onActivate={setVersionToActivate}
          />
        ))}
      </div>

      <RollbackConfirmDialog
        version={versionToActivate}
        open={Boolean(versionToActivate)}
        onOpenChange={(open) => {
          if (!open) setVersionToActivate(null);
        }}
        onSuccess={handleRollbackSuccess}
      />
    </>
  );
}

export default LayerVersionList;
