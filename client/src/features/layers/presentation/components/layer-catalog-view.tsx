"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/features/shared/presentation/components/layout/page-heading";
import { ImportDatasetDialog } from "./import-dataset-dialog";
import { LayerVersionList } from "./layer-version-list";
import { dataVersionCache } from "../../infrastructure/services/data-version-cache.service";
import type { Layer, LayerColor } from "../../domain/entities/layer.entity";
import { LayerGrid } from "./layer-grid";
import { LayerSideSheet } from "./layer-side-sheet";

export type LayerCatalogViewProps = {
  initialLayers: Layer[];
  hasError?: boolean;
  errorMessage?: string;
};

export function LayerCatalogView({
  initialLayers,
  hasError = false,
  errorMessage,
}: LayerCatalogViewProps) {
  const router = useRouter();
  const [colorOverrides, setColorOverrides] = useState<Record<string, LayerColor>>({});
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [layerToImport, setLayerToImport] = useState<Layer | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const layers = initialLayers.map((l) => ({
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
    router.refresh();
  };

  const handleOpenImport = (layer: Layer) => {
    setLayerToImport(layer);
    setIsImportDialogOpen(true);
  };

  const handleSuccess = () => {
    if (selectedLayerId) {
      dataVersionCache.invalidate(selectedLayerId);
    }
    if (layerToImport) {
      dataVersionCache.invalidate(layerToImport.id);
    }
    setRefreshKey((k) => k + 1);
    router.refresh();
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-50/70 p-6 md:p-8">
      <div className="w-full space-y-7 pb-20 lg:pb-8">
        <PageHeading
          title="Catálogo de Capas"
          description="Visualiza las 4 capas geográficas del sistema y gestiona su simbología cromática e importaciones de datos."
        />

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
              onClick={() => router.refresh()}
              className="gap-1.5 rounded-xl border-amber-300 bg-white text-xs font-semibold text-amber-900 hover:bg-amber-100"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reintentar
            </Button>
          </div>
        )}

        <LayerGrid
          layers={layers}
          onSelectLayer={handleSelectLayer}
        />

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

export default LayerCatalogView;
