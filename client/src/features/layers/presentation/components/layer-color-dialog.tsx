"use client";

import React, { useState } from "react";
import { AppDialog } from "@/features/shared/presentation/components/dialogs/app-dialog";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import type { Layer } from "../../domain/entities/layer.entity";
import { changeLayerColorAction } from "../actions/change-layer-color.action";
import { LayerColorForm, type LayerColorFormData } from "./layer-color-form";

export type LayerColorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  layer: Layer | null;
  onSuccess?: () => void;
};

export function LayerColorDialog({
  open,
  onOpenChange,
  layer,
  onSuccess,
}: LayerColorDialogProps) {
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!layer) return null;

  const handleSubmit = async (data: LayerColorFormData) => {
    setIsPending(true);
    setErrorMessage(null);

    try {
      const result = await changeLayerColorAction(layer.id, data);

      if (!result.ok) {
        setErrorMessage(
          result.errors?.[0] ?? "Ocurrió un error al actualizar el color de la capa."
        );
        return;
      }

      appToast.success(`Color de "${layer.name}" actualizado con éxito.`);
      onOpenChange(false);
      onSuccess?.();
    } catch {
      setErrorMessage("Error de conexión. Intenta de nuevo.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <AppDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Cambiar Color de la Capa"
      description={`Modifica la apariencia cromática de "${layer.name}"`}
      size="md"
      showCloseButton
    >
      <div className="p-6">
        <LayerColorForm
          key={`${layer.id}-${layer.color}`}
          layer={layer}
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          isPending={isPending}
          errorMessage={errorMessage}
        />
      </div>
    </AppDialog>
  );
}

export default LayerColorDialog;
