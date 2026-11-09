"use client";

import { useCallback, useState } from "react";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import type {
  AssignmentDetail,
  AssignmentStopDetail,
} from "../../domain/entities/assignment-detail.entity";
import type { CompleteStopInput } from "../../domain/entities/assignment-execution.entity";
import { routeAssignmentRepository } from "../../infrastructure/repositories/route-assignment.repository-impl";

export type ExecutionActionType = "start" | "transit" | "arrive" | "complete";

export interface UseTechnicianAssignmentExecutionProps {
  assignmentId: string;
  refetch?: () => Promise<void> | void;
  updateAssignmentLocally?: (updater: (prev: AssignmentDetail) => AssignmentDetail) => void;
}

export function openGoogleMapsNavigation(latitude: number, longitude: number): void {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function useTechnicianAssignmentExecution({
  assignmentId,
  refetch,
  updateAssignmentLocally,
}: UseTechnicianAssignmentExecutionProps) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [activeAction, setActiveAction] = useState<ExecutionActionType | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setActionError(null);
  }, []);

  const startAssignment = useCallback(async (): Promise<boolean> => {
    if (!assignmentId || isSubmitting) return false;
    setIsSubmitting(true);
    setActiveAction("start");
    setActionError(null);

    try {
      const res = await routeAssignmentRepository.startAssignment(assignmentId);
      if (!res.ok) {
        const message = res.errors?.[0] || "No se pudo iniciar la asignación.";
        setActionError(message);
        appToast.error("Error al iniciar", message);
        return false;
      }

      // 1. Actualización local inmediata libre de parpadeos
      updateAssignmentLocally?.((prev) => ({
        ...prev,
        status: "IN_PROGRESS",
        startedAt: new Date(),
      }));

      appToast.success("Asignación iniciada", "Puedes comenzar con las paradas de la ruta.");

      // 2. Sincronización silenciosa en background sin recargar la pantalla
      await refetch?.();
      return true;
    } catch {
      const fallback = "Fallo de conexión al iniciar la asignación.";
      setActionError(fallback);
      appToast.error("Error", fallback);
      return false;
    } finally {
      setIsSubmitting(false);
      setActiveAction(null);
    }
  }, [assignmentId, isSubmitting, refetch, updateAssignmentLocally]);

  const startTransit = useCallback(
    async (
      stopId: string,
      latitude?: number | null,
      longitude?: number | null
    ): Promise<boolean> => {
      if (!assignmentId || !stopId || isSubmitting) return false;
      setIsSubmitting(true);
      setActiveAction("transit");
      setActionError(null);

      try {
        const res = await routeAssignmentRepository.startStopTransit(assignmentId, stopId);
        if (!res.ok) {
          const message = res.errors?.[0] || "No se pudo iniciar el traslado a la parada.";
          setActionError(message);
          appToast.error("Error al iniciar traslado", message);
          return false;
        }

        if (latitude != null && longitude != null) {
          openGoogleMapsNavigation(latitude, longitude);
        }

        // 1. Actualización local inmediata libre de parpadeos
        updateAssignmentLocally?.((prev) => ({
          ...prev,
          stops: prev.stops.map((s) =>
            s.id === stopId
              ? {
                  ...s,
                  status: "IN_TRANSIT" as const,
                  inTransitAt: new Date(),
                }
              : s
          ),
        }));

        appToast.success("En camino", "Navegación abierta en Google Maps.");

        // 2. Sincronización silenciosa en background sin recargar la pantalla
        await refetch?.();
        return true;
      } catch {
        const fallback = "Fallo de conexión al iniciar traslado.";
        setActionError(fallback);
        appToast.error("Error", fallback);
        return false;
      } finally {
        setIsSubmitting(false);
        setActiveAction(null);
      }
    },
    [assignmentId, isSubmitting, refetch, updateAssignmentLocally]
  );

  const openNavigation = useCallback((latitude: number, longitude: number): void => {
    openGoogleMapsNavigation(latitude, longitude);
  }, []);

  const arriveAtStop = useCallback(
    async (stopId: string): Promise<boolean> => {
      if (!assignmentId || !stopId || isSubmitting) return false;
      setIsSubmitting(true);
      setActiveAction("arrive");
      setActionError(null);

      try {
        const res = await routeAssignmentRepository.arriveAtStop(assignmentId, stopId);
        if (!res.ok) {
          const message = res.errors?.[0] || "No se pudo registrar el arribo.";
          setActionError(message);
          appToast.error("Error al registrar arribo", message);
          return false;
        }

        // 1. Actualización local inmediata libre de parpadeos
        updateAssignmentLocally?.((prev) => ({
          ...prev,
          stops: prev.stops.map((s) =>
            s.id === stopId
              ? {
                  ...s,
                  status: "ARRIVED" as const,
                  arrivedAt: new Date(),
                }
              : s
          ),
        }));

        appToast.success("Arribo registrado", "Ahora puedes realizar la inspección y finalizar la parada.");

        // 2. Sincronización silenciosa en background sin recargar la pantalla
        await refetch?.();
        return true;
      } catch {
        const fallback = "Fallo de conexión al registrar arribo.";
        setActionError(fallback);
        appToast.error("Error", fallback);
        return false;
      } finally {
        setIsSubmitting(false);
        setActiveAction(null);
      }
    },
    [assignmentId, isSubmitting, refetch, updateAssignmentLocally]
  );

  const completeStop = useCallback(
    async (stopId: string, data: CompleteStopInput): Promise<boolean> => {
      if (!assignmentId || !stopId || isSubmitting) return false;
      setIsSubmitting(true);
      setActiveAction("complete");
      setActionError(null);

      try {
        const res = await routeAssignmentRepository.completeStop(assignmentId, stopId, data);
        if (!res.ok) {
          const message = res.errors?.[0] || "No se pudo concluir la parada.";
          setActionError(message);
          appToast.error("Error al concluir parada", message);
          return false;
        }

        // 1. Actualización local inmediata libre de parpadeos
        const completedData = res.data;
        const newStopStatus = completedData?.status ?? (data.status === "SUCCESS" ? "COMPLETED" : "FAILED");
        updateAssignmentLocally?.((prev) => {
          const updatedStops = prev.stops.map((s) =>
            s.id === stopId
              ? {
                  ...s,
                  status: newStopStatus as AssignmentStopDetail["status"],
                  completedAt: completedData?.completedAt ?? new Date(),
                  meterReading: completedData?.meterReading ?? data.meterReading ?? s.meterReading,
                  observation: completedData?.observation ?? data.observation ?? s.observation,
                  evidencePhotoUrl: completedData?.evidencePhotoUrl ?? s.evidencePhotoUrl,
                }
              : s
          );
          const newCompletedCount = updatedStops.filter(
            (s) => s.status === "COMPLETED" || s.status === "FAILED"
          ).length;
          const isAllDone = newCompletedCount >= prev.totalStops;

          return {
            ...prev,
            completedStops: newCompletedCount,
            status: isAllDone ? "COMPLETED" : prev.status,
            completedAt: isAllDone ? new Date() : prev.completedAt,
            stops: updatedStops,
          };
        });

        const outcomeMsg =
          data.status === "SUCCESS"
            ? "Visita completada exitosamente."
            : "Visita registrada como fallida.";
        appToast.success("Parada finalizada", outcomeMsg);

        // 2. Sincronización silenciosa en background sin recargar la pantalla
        await refetch?.();
        return true;
      } catch {
        const fallback = "Fallo de conexión al concluir la parada.";
        setActionError(fallback);
        appToast.error("Error", fallback);
        return false;
      } finally {
        setIsSubmitting(false);
        setActiveAction(null);
      }
    },
    [assignmentId, isSubmitting, refetch, updateAssignmentLocally]
  );

  return {
    isSubmitting,
    activeAction,
    actionError,
    clearError,
    startAssignment,
    startTransit,
    openNavigation,
    arriveAtStop,
    completeStop,
  };
}
