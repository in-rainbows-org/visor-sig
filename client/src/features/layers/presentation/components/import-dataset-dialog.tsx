"use client";

import React, { useState } from "react";
import { AppDialog } from "@/features/shared/presentation/components/dialogs/app-dialog";
import { Button } from "@/components/ui/button";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import { importGeographicDataAction } from "../actions/import-geographic-data.action";
import { ShapefileUploader } from "./shapefile-uploader";

export type ImportDatasetDialogProps = {
  layerId: string;
  layerName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function ImportDatasetDialog({
  layerId,
  layerName,
  open,
  onOpenChange,
  onSuccess,
}: ImportDatasetDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage("Por favor selecciona un archivo comprimido .zip.");
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("layerId", layerId);
      formData.append("file", file);

      const result = await importGeographicDataAction(formData);

      if (!result.ok) {
        setErrorMessage(
          result.errors?.[0] ??
            "Ocurrió un error al procesar el archivo geográfico."
        );
        return;
      }

      appToast.success(
        `Dataset importado con éxito: ${result.data.featureCount.toLocaleString()} geometrías procesadas.`
      );
      setFile(null);
      onOpenChange(false);
      onSuccess?.();
    } catch {
      setErrorMessage("Error de conexión durante la subida del dataset.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = (newOpen: boolean) => {
    if (!isUploading) {
      setFile(null);
      setErrorMessage(null);
      onOpenChange(newOpen);
    }
  };

  return (
    <AppDialog
      open={open}
      onOpenChange={handleClose}
      title="Importar Datos Geográficos"
      description={`Carga un paquete Shapefile ZIP para la capa "${layerName}"`}
      size="md"
      showCloseButton={!isUploading}
    >
      <form onSubmit={handleUpload} className="p-6 space-y-5">
        {errorMessage && (
          <div className="p-3 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-xl leading-relaxed">
            {errorMessage}
          </div>
        )}

        <ShapefileUploader
          selectedFile={file}
          onFileSelect={setFile}
          disabled={isUploading}
        />

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isUploading}
            className="rounded-xl text-xs font-semibold"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={!file || isUploading}
            className="rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs px-5"
          >
            {isUploading ? "Procesando importación..." : "Comenzar Importación"}
          </Button>
        </div>
      </form>
    </AppDialog>
  );
}

export default ImportDatasetDialog;
