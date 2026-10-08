"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Ban, Loader2 } from "lucide-react";
import type { User } from "../../../domain/entities/user.entity";

export interface BanUserDialogProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    userId: string,
    reason: string,
    durationInSeconds?: number | null
  ) => Promise<boolean>;
  isSubmitting?: boolean;
}

const DURATION_PRESETS = [
  { value: "86400", label: "24 horas (1 día)" },
  { value: "604800", label: "7 días (1 semana)" },
  { value: "2592000", label: "30 días (1 mes)" },
  { value: "permanent", label: "Permanente / Indefinido" },
];

export function BanUserDialog({
  user,
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
}: BanUserDialogProps) {
  const [reason, setReason] = useState("");
  const [durationPreset, setDurationPreset] = useState("86400");
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = (open: boolean) => {
    if (!open && !isSubmitting) {
      setReason("");
      setError(null);
      setDurationPreset("86400");
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      setError("Debes indicar un motivo de bloqueo justificado.");
      return;
    }

    const durationInSeconds =
      durationPreset === "permanent" ? null : parseInt(durationPreset, 10);

    const success = await onConfirm(user.id, trimmedReason, durationInSeconds);
    if (success) {
      setReason("");
      setError(null);
      setDurationPreset("86400");
      onClose();
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md bg-white border border-slate-200 shadow-xl rounded-2xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <Ban className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-slate-900">
                Bloquear Usuario
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Suspender acceso a la plataforma para{" "}
                <span className="font-semibold text-slate-800">{user.name}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Advertencia */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/80 border border-amber-200/60 text-amber-800 text-xs">
            <AlertTriangle className="size-4 shrink-0 text-amber-600 mt-0.5" />
            <p>
              Esta acción revocará inmediatamente todas las sesiones activas del usuario{" "}
              <strong>({user.email})</strong> y denegará futuros accesos hasta que finalice el periodo o sea desbloqueado manualmente.
            </p>
          </div>

          {/* Selector de Duración */}
          <div className="space-y-1.5">
            <Label htmlFor="ban-duration" className="text-xs font-medium text-slate-700">
              Duración de la suspensión
            </Label>
            <Select
              value={durationPreset}
              onValueChange={setDurationPreset}
              disabled={isSubmitting}
            >
              <SelectTrigger
                id="ban-duration"
                className="w-full bg-slate-50/80 border-slate-200 rounded-xl text-xs h-9"
              >
                <SelectValue placeholder="Selecciona la duración" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 rounded-xl text-xs">
                {DURATION_PRESETS.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Motivo de Suspensión */}
          <div className="space-y-1.5">
            <Label htmlFor="ban-reason" className="text-xs font-medium text-slate-700">
              Motivo de la suspensión <span className="text-red-500">*</span>
            </Label>
            <Input
              id="ban-reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Ej. Incumplimiento de políticas, mantenimiento de acceso..."
              disabled={isSubmitting}
              className="bg-slate-50/80 border-slate-200 rounded-xl text-xs h-9"
              autoFocus
            />
            {error && (
              <p className="text-[11px] text-red-600 font-medium">{error}</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
              className="rounded-xl text-xs font-medium"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={isSubmitting || !reason.trim()}
              className="rounded-xl text-xs font-semibold gap-1.5 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Bloqueando...
                </>
              ) : (
                <>
                  <Ban className="size-3.5" />
                  Confirmar Bloqueo
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
