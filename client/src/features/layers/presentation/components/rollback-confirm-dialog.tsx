"use client";

import React, { useState } from "react";
import { AppAlertDialog } from "@/features/shared/presentation/components/dialogs/app-alert-dialog";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import type { DataVersion } from "../../domain/entities/data-version.entity";
import { activateDataVersionAction } from "../actions/activate-data-version.action";

export type RollbackConfirmDialogProps = {
  version: DataVersion | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export function RollbackConfirmDialog({
  version,
  open,
  onOpenChange,
  onSuccess,
}: RollbackConfirmDialogProps) {
  const [isActivating, setIsActivating] = useState(false);

  if (!version) return null;

  const handleConfirm = async () => {
    setIsActivating(true);
    try {
      const result = await activateDataVersionAction({
        layerId: version.layerId,
        versionId: version.id,
      });

      if (!result.ok) {
        appToast.error(
          "Error al activar versión",
          result.errors?.[0] ?? "No se pudo activar la versión seleccionada."
        );
        return;
      }

      appToast.success(
        `Versión v${version.versionNumber} activada exitosamente.`
      );
      onOpenChange(false);
      onSuccess?.();
    } catch {
      appToast.error(
        "Error de conexión",
        "No se pudo comunicar con el servidor para activar la versión."
      );
    } finally {
      setIsActivating(false);
    }
  };

  return (
    <AppAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title="¿Activar esta versión de datos?"
      description={`Al activar la versión v${version.versionNumber} (${version.sourceFilename}), los datos espaciales visibles en el visor cartográfico se conmutarán inmediatamente a este conjunto de datos. La versión actual pasará a estado inactivo.`}
      actionText={isActivating ? "Activando..." : "Sí, activar versión"}
      cancelText="Cancelar"
      onAction={handleConfirm}
      actionDisabled={isActivating}
    />
  );
}

export default RollbackConfirmDialog;
