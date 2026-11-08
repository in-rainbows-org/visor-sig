"use client";

import React, { useState, useTransition } from "react";
import {
  AppDialog,
  AppDialogFormActions,
} from "@/features/shared/presentation/components/dialogs/app-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import { createCodigoFijoAction } from "@/features/layers/presentation/actions/create-codigo-fijo.action";
import { AlertCircle } from "lucide-react";

export type CreateFixedCodeModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  latitude: number;
  longitude: number;
  onSuccess?: () => void;
};

export function CreateFixedCodeModal({
  open,
  onOpenChange,
  latitude,
  longitude,
  onSuccess,
}: CreateFixedCodeModalProps) {
  const [fixedCode, setFixedCode] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [statusVal, setStatusVal] = useState<string>("1");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const resetForm = () => {
    setFixedCode("");
    setName("");
    setStatusVal("1");
    setErrorMessage(null);
    setFieldErrors({});
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setFieldErrors({});

    const numCode = parseInt(fixedCode, 10);
    const errors: Record<string, string> = {};

    if (isNaN(numCode) || numCode <= 0) {
      errors.fixedCode = "El código fijo debe ser un número entero positivo.";
    }
    if (!name.trim()) {
      errors.name = "El nombre del titular es obligatorio.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    startTransition(async () => {
      const result = await createCodigoFijoAction({
        fixedCode: numCode,
        name: name.trim(),
        latitude,
        longitude,
        status: parseInt(statusVal, 10) || 1,
      });

      if (!result.ok) {
        const errorMsg =
          result.errors?.[0] || "No se pudo registrar el código fijo.";
        setErrorMessage(errorMsg);
        if (result.validationErrors) {
          const map: Record<string, string> = {};
          for (const [k, v] of Object.entries(result.validationErrors)) {
            if (v && v[0]) {
              map[k] = v[0];
            }
          }
          setFieldErrors(map);
        }
        return;
      }

      appToast.success("Código fijo registrado con éxito");
      handleOpenChange(false);
      onSuccess?.();
    });
  };

  return (
    <AppDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Registrar Código Fijo"
      description="Ingresa los datos del nuevo punto de suministro en la coordenada capturada del mapa."
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="fixedCode">Código Fijo *</Label>
          <Input
            id="fixedCode"
            type="number"
            min={1}
            placeholder="Ej. 104523"
            value={fixedCode}
            onChange={(e) => setFixedCode(e.target.value)}
            disabled={isPending}
            className={
              fieldErrors.fixedCode
                ? "border-destructive focus-visible:ring-destructive"
                : ""
            }
          />
          {fieldErrors.fixedCode && (
            <p className="text-xs text-destructive">{fieldErrors.fixedCode}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="name">Nombre del Titular / Dueño *</Label>
          <Input
            id="name"
            type="text"
            placeholder="Ej. JUAN PEREZ FLORES"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isPending}
            maxLength={120}
            className={
              fieldErrors.name
                ? "border-destructive focus-visible:ring-destructive"
                : ""
            }
          />
          {fieldErrors.name && (
            <p className="text-xs text-destructive">{fieldErrors.name}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="status">Estado del Servicio</Label>
          <Select
            value={statusVal}
            onValueChange={setStatusVal}
            disabled={isPending}
          >
            <SelectTrigger id="status" className="w-full">
              <SelectValue placeholder="Selecciona un estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 - Normal (Activo)</SelectItem>
              <SelectItem value="2">2 - Para Corte (Pendiente)</SelectItem>
              <SelectItem value="3">3 - Cortado</SelectItem>
              <SelectItem value="4">4 - Baja Parcial (Inactivo)</SelectItem>
              <SelectItem value="5">5 - Baja Total</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Latitud (WGS84)
            </Label>
            <Input
              type="text"
              readOnly
              disabled
              value={latitude.toFixed(6)}
              className="bg-muted text-muted-foreground cursor-not-allowed text-xs font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              Longitud (WGS84)
            </Label>
            <Input
              type="text"
              readOnly
              disabled
              value={longitude.toFixed(6)}
              className="bg-muted text-muted-foreground cursor-not-allowed text-xs font-mono"
            />
          </div>
        </div>

        <AppDialogFormActions
          submitText="Guardar"
          submitPendingText="Guardando..."
          onCancel={() => handleOpenChange(false)}
        />
      </form>
    </AppDialog>
  );
}
