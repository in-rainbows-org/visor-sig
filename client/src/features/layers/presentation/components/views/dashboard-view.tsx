"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/features/shared/presentation/components/layout/page-heading";
import type { Layer, LayerColor } from "../../../domain/entities/layer.entity";
import { ImportDatasetDialog } from "../dialogs/import-dataset-dialog";
import { LayerSideSheet } from "../dialogs/layer-side-sheet";
import { LayerGrid } from "../elements/layer-grid";
import { LayerVersionList } from "../elements/layer-version-list";
import { QuickAccessGrid } from "../elements/quick-access-grid";

import { layerCache } from "../../cache/layer-cache";

export type DashboardViewProps = {
  initialLayers: Layer[];
  hasError?: boolean;
  errorMessage?: string;
};

export function DashboardView({
  initialLayers,
  hasError = false,
  errorMessage,
}: DashboardViewProps) {
  const router = useRouter();

  // Guardar en caché del cliente al recibir las capas iniciales
  React.useEffect(() => {
    if (initialLayers && initialLayers.length > 0) {
      layerCache.setLayers(initialLayers);
    }
  }, [initialLayers]);

  const [colorOverrides, setColorOverrides] = useState<Record<string, LayerColor>>({});
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [layerToImport, setLayerToImport] = useState<Layer | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const baseLayers =
    initialLayers && initialLayers.length > 0
      ? initialLayers
      : (layerCache.getLayers() ?? []);

  const layers = baseLayers.map((l) => ({
    ...l,
    color: colorOverrides[l.id] ?? l.color,
  }));

  const selectedLayer = layers.find((l) => l.id === selectedLayerId) ?? null;
  const isInvalidCount = layers.length !== 4 && !hasError;

  const handleSelectLayer = (layer: Layer) => {
    setSelectedLayerId(layer.id);
  };

  const handleColorChanged = (layerId: string, newColor: LayerColor) => {
    setColorOverrides((prev) => ({ ...prev, [layerId]: newColor }));
    if (layerCache.hasLayers()) {
      const cached = layerCache.getLayers()!;
      layerCache.setLayers(
        cached.map((l) => (l.id === layerId ? { ...l, color: newColor } : l))
      );
    }
    router.refresh();
  };

  const handleOpenImport = (layer: Layer) => {
    setLayerToImport(layer);
    setIsImportDialogOpen(true);
  };

  const handleSuccess = () => {
    layerCache.invalidateAll();
    setRefreshKey((k) => k + 1);
    router.refresh();
  };

  const handleRetry = () => {
    layerCache.invalidateAll();
    router.refresh();
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-50/70 p-4 sm:p-6 md:p-8 overscroll-contain">
      <div className="w-full space-y-8 pb-24 lg:pb-8">
        {/* Encabezado del Dashboard */}
        <PageHeading
          title="Dashboard de Administración"
          description="Gestión integral de capas geográficas del sistema y accesos rápidos a módulos administrativos."
        />

        {/* Alerta si ocurre algún error de carga */}
        {(hasError || isInvalidCount) && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 flex items-start gap-4 text-amber-900 shadow-xs">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold">
                {hasError
                  ? "Error al cargar el catálogo de capas"
                  : "Catálogo de capas incompleto o anómalo"}
              </h4>
              <p className="text-xs text-amber-700 mt-1">
                {errorMessage ??
                  `Se esperaban exactamente 4 capas del sistema (Códigos Fijos, Lotes, Manzanas, Vías), pero se encontraron ${layers.length}.`}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="gap-1.5 rounded-xl border-amber-300 bg-white text-xs font-semibold text-amber-900 hover:bg-amber-100"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reintentar
            </Button>
          </div>
        )}

        {/* Sección 1: Catálogo de Capas */}
        <div className="space-y-3">
          <div className="px-0.5">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Gestión de Capas
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Administra la simbología cromática, importación y versiones de las capas territoriales.
            </p>
          </div>

          <LayerGrid
            layers={layers}
            onSelectLayer={handleSelectLayer}
            onRetry={handleRetry}
          />
        </div>

        {/* Sección 2: Accesos Rápidos */}
        <QuickAccessGrid />

        {/* Panel lateral deslizable (Side Sheet) de la capa seleccionada */}
        <LayerSideSheet
          layer={selectedLayer}
          open={Boolean(selectedLayer)}
          onOpenChange={(open) => {
            if (!open) setSelectedLayerId(null);
          }}
          onColorChanged={handleColorChanged}
          onOpenImport={handleOpenImport}
          historyContent={
            selectedLayer ? (
              <LayerVersionList
                key={`${selectedLayer.id}-${refreshKey}`}
                layerId={selectedLayer.id}
                onVersionActivated={handleSuccess}
              />
            ) : null
          }
        />

        {/* Modal de importación de datos Shapefile ZIP */}
        {layerToImport && (
          <ImportDatasetDialog
            layerId={layerToImport.id}
            layerName={layerToImport.name}
            open={isImportDialogOpen}
            onOpenChange={setIsImportDialogOpen}
            onSuccess={handleSuccess}
          />
        )}
      </div>
    </div>
  );
}

export default DashboardView;
