"use client";

import { useCallback, useState } from "react";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import type {
  AssignmentDetail,
  AssignmentStopDetail,
} from "../../domain/entities/assignment-detail.entity";
import type { CompleteStopInput } from "../../domain/entities/assignment-execution.entity";
import {
  isNetworkOrTransientError,
  offlineSyncQueue,
} from "../../infrastructure/offline/offline-sync-queue";
import { technicianOfflineDb } from "../../infrastructure/offline/technician-offline-db";
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

  const applyLocalStart = useCallback(
    async (startedAt: Date, queueOffline: boolean) => {
      if (queueOffline) {
        await technicianOfflineDb.enqueueSyncItem({
          actionType: "START_ASSIGNMENT",
          assignmentId,
          stopId: null,
          payload: {
            startedAt: startedAt.toISOString(),
          },
        });
        await offlineSyncQueue.refreshPendingCount();
      }

      updateAssignmentLocally?.((prev) => ({
        ...prev,
        status: "IN_PROGRESS",
        startedAt: prev.startedAt ?? startedAt,
        pendingSyncCount: queueOffline
          ? (prev.pendingSyncCount ?? 0) + 1
          : prev.pendingSyncCount,
      }));

      await technicianOfflineDb.updateCachedAssignmentSummary(assignmentId, {
        status: "IN_PROGRESS",
        startedAt: startedAt.toISOString(),
      });
    },
    [assignmentId, updateAssignmentLocally]
  );

  const startAssignment = useCallback(async (): Promise<boolean> => {
    if (!assignmentId || isSubmitting) return false;
    setIsSubmitting(true);
    setActiveAction("start");
    setActionError(null);

    const now = new Date();
    const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

    try {
      if (isOffline) {
        await applyLocalStart(now, true);
        appToast.info(
          "Asignación iniciada sin conexión",
          "Se sincronizará automáticamente al recuperar internet."
        );
        return true;
      }

      const res = await routeAssignmentRepository.startAssignment(assignmentId, now);
      if (!res.ok) {
        if (isNetworkOrTransientError(res.statusCode)) {
          await applyLocalStart(now, true);
          appToast.info(
            "Asignación iniciada sin conexión",
            "Guardado localmente; se enviará al recuperar señal."
          );
          return true;
        }
        const message = res.errors?.[0] || "No se pudo iniciar la asignación.";
        setActionError(message);
        appToast.error("Error al iniciar", message);
        return false;
      }

      await applyLocalStart(now, false);
      appToast.success("Asignación iniciada", "Puedes comenzar con las paradas de la ruta.");
      await refetch?.();
      return true;
    } catch {
      await applyLocalStart(now, true);
      appToast.info(
        "Asignación iniciada sin conexión",
        "Guardado localmente para sincronizar al recuperar señal."
      );
      return true;
    } finally {
      setIsSubmitting(false);
      setActiveAction(null);
    }
  }, [assignmentId, isSubmitting, applyLocalStart, refetch]);

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

      const now = new Date();
      const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

      const applyLocalTransit = () => {
        if (latitude != null && longitude != null) {
          openGoogleMapsNavigation(latitude, longitude);
        }
        updateAssignmentLocally?.((prev) => ({
          ...prev,
          stops: prev.stops.map((s) =>
            s.id === stopId
              ? {
                  ...s,
                  status: "IN_TRANSIT" as const,
                  inTransitAt: s.inTransitAt ?? now,
                }
              : s
          ),
        }));
      };

      try {
        if (isOffline) {
          applyLocalTransit();
          appToast.info("En camino (Modo sin conexión)", "Progreso guardado en el dispositivo.");
          return true;
        }

        const res = await routeAssignmentRepository.startStopTransit(assignmentId, stopId);
        if (!res.ok) {
          if (isNetworkOrTransientError(res.statusCode)) {
            applyLocalTransit();
            appToast.info("En camino (Sin señal)", "Estado actualizado localmente.");
            return true;
          }
          const message = res.errors?.[0] || "No se pudo iniciar el traslado a la parada.";
          setActionError(message);
          appToast.error("Error al iniciar traslado", message);
          return false;
        }

        applyLocalTransit();
        appToast.success("En camino", "Navegación abierta en Google Maps.");
        await refetch?.();
        return true;
      } catch {
        applyLocalTransit();
        appToast.info("En camino (Sin señal)", "Estado actualizado localmente.");
        return true;
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

      const now = new Date();
      const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

      const applyLocalArrive = () => {
        updateAssignmentLocally?.((prev) => ({
          ...prev,
          stops: prev.stops.map((s) =>
            s.id === stopId
              ? {
                  ...s,
                  status: "ARRIVED" as const,
                  arrivedAt: s.arrivedAt ?? now,
                }
              : s
          ),
        }));
      };

      try {
        if (isOffline) {
          applyLocalArrive();
          appToast.info("Arribo registrado localmente", "Puedes finalizar la parada sin conexión.");
          return true;
        }

        const res = await routeAssignmentRepository.arriveAtStop(assignmentId, stopId);
        if (!res.ok) {
          if (isNetworkOrTransientError(res.statusCode)) {
            applyLocalArrive();
            appToast.info("Arribo registrado sin señal", "Puedes finalizar la parada normalmente.");
            return true;
          }
          const message = res.errors?.[0] || "No se pudo registrar el arribo.";
          setActionError(message);
          appToast.error("Error al registrar arribo", message);
          return false;
        }

        applyLocalArrive();
        appToast.success("Arribo registrado", "Ahora puedes realizar la inspección y finalizar la parada.");
        await refetch?.();
        return true;
      } catch {
        applyLocalArrive();
        appToast.info("Arribo registrado sin señal", "Puedes finalizar la parada normalmente.");
        return true;
      } finally {
        setIsSubmitting(false);
        setActiveAction(null);
      }
    },
    [assignmentId, isSubmitting, refetch, updateAssignmentLocally]
  );

  const applyLocalCompleteStop = useCallback(
    async (
      stopId: string,
      data: CompleteStopInput,
      timestamps: { inTransitAt: Date | null; arrivedAt: Date | null; completedAt: Date },
      options: {
        enqueue: boolean;
        evidencePhotoUrl?: string | null;
        serverStatus?: AssignmentStopDetail["status"];
        knownDetail?: AssignmentDetail | null;
      }
    ) => {
      if (options.enqueue) {
        await technicianOfflineDb.enqueueSyncItem({
          actionType: "COMPLETE_STOP",
          assignmentId,
          stopId,
          payload: {
            status: data.status,
            meterReading: data.meterReading ?? null,
            observation: data.observation ?? null,
            evidenceBlob: data.evidenceFile ?? null,
            evidenceFileName: data.evidenceFile?.name ?? null,
            inTransitAt: timestamps.inTransitAt?.toISOString() ?? null,
            arrivedAt: timestamps.arrivedAt?.toISOString() ?? null,
            completedAt: timestamps.completedAt.toISOString(),
          },
        });
        await offlineSyncQueue.refreshPendingCount();
      }

      const newStopStatus: AssignmentStopDetail["status"] =
        options.serverStatus ?? (data.status === "SUCCESS" ? "COMPLETED" : "FAILED");

      const baseDetail =
        options.knownDetail ?? (await technicianOfflineDb.getAssignmentDetail(assignmentId));
      const allDoneAfter = Boolean(
        baseDetail &&
          baseDetail.totalStops > 0 &&
          baseDetail.stops.filter((s) =>
            s.id === stopId ? true : s.status === "COMPLETED" || s.status === "FAILED"
          ).length >= baseDetail.totalStops
      );

      updateAssignmentLocally?.((prev) => {
        const updatedStops = prev.stops.map((s) =>
          s.id === stopId
            ? {
                ...s,
                status: newStopStatus,
                inTransitAt: timestamps.inTransitAt ?? s.inTransitAt,
                arrivedAt: timestamps.arrivedAt ?? s.arrivedAt,
                completedAt: timestamps.completedAt,
                meterReading: data.meterReading ?? s.meterReading,
                observation: data.observation ?? s.observation,
                evidencePhotoUrl: options.evidencePhotoUrl ?? s.evidencePhotoUrl,
                pendingSync: options.enqueue,
              }
            : s
        );

        const newCompletedCount = updatedStops.filter(
          (s) => s.status === "COMPLETED" || s.status === "FAILED"
        ).length;
        const isAssignmentCompleted = newCompletedCount >= prev.totalStops;

        return {
          ...prev,
          completedStops: newCompletedCount,
          status: isAssignmentCompleted
            ? "COMPLETED"
            : prev.status === "ASSIGNED"
            ? "IN_PROGRESS"
            : prev.status,
          completedAt: isAssignmentCompleted ? timestamps.completedAt : prev.completedAt,
          startedAt: prev.startedAt ?? timestamps.inTransitAt ?? timestamps.completedAt,
          pendingSyncCount: options.enqueue
            ? (prev.pendingSyncCount ?? 0) + 1
            : prev.pendingSyncCount,
          stops: updatedStops,
        };
      });

      if (allDoneAfter) {
        await technicianOfflineDb.updateCachedAssignmentSummary(assignmentId, {
          status: "COMPLETED",
          completedAt: timestamps.completedAt.toISOString(),
        });
      }
    },
    [assignmentId, updateAssignmentLocally]
  );

  const completeStop = useCallback(
    async (stopId: string, data: CompleteStopInput): Promise<boolean> => {
      if (!assignmentId || !stopId || isSubmitting) return false;
      setIsSubmitting(true);
      setActiveAction("complete");
      setActionError(null);

      const now = new Date();
      const cachedDetail = await technicianOfflineDb.getAssignmentDetail(assignmentId);
      const cachedStop = cachedDetail?.stops.find((s) => s.id === stopId);

      const inTransitAt = cachedStop?.inTransitAt ?? now;
      const arrivedAt = cachedStop?.arrivedAt ?? now;
      const completedAt = now;

      const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
      const queueItems = await technicianOfflineDb.getPendingQueueItems();
      const hasActiveQueueItems = queueItems.some((item) => item.syncStatus !== "ERROR");

      try {
        // Si estamos sin internet o existen operaciones activas en la cola FIFO (excluyendo ítems bloqueados en ERROR),
        // encolamos respetando estrictamente el orden FIFO para evitar adelantos fuera de secuencia.
        if (isOffline || hasActiveQueueItems) {
          await applyLocalCompleteStop(
            stopId,
            data,
            { inTransitAt, arrivedAt, completedAt },
            { enqueue: true, knownDetail: cachedDetail }
          );

          if (isOffline) {
            appToast.info(
              "Parada completada sin conexión",
              "Guardada en cola como pendiente de sincronización."
            );
          } else {
            appToast.info(
              "Parada encolada para sincronización",
              "Se enviará en orden secuencial tras las operaciones pendientes."
            );
            void offlineSyncQueue.processQueue();
          }
          return true;
        }

        const res = await routeAssignmentRepository.completeStop(assignmentId, stopId, {
          ...data,
          inTransitAt,
          arrivedAt,
          completedAt,
        });

        if (!res.ok) {
          if (isNetworkOrTransientError(res.statusCode)) {
            await applyLocalCompleteStop(
              stopId,
              data,
              { inTransitAt, arrivedAt, completedAt },
              { enqueue: true, knownDetail: cachedDetail }
            );
            appToast.info(
              "Guardada como pendiente de sincronización",
              "Se enviará al recuperar conexión estable."
            );
            return true;
          }

          const message = res.errors?.[0] || "No se pudo concluir la parada.";
          setActionError(message);
          appToast.error("Error al concluir parada", message);
          return false;
        }

        const completedData = res.data;
        await applyLocalCompleteStop(
          stopId,
          {
            ...data,
            meterReading: completedData?.meterReading ?? data.meterReading,
            observation: completedData?.observation ?? data.observation,
          },
          {
            inTransitAt,
            arrivedAt,
            completedAt: completedData?.completedAt ?? completedAt,
          },
          {
            enqueue: false,
            serverStatus: completedData?.status,
            evidencePhotoUrl: completedData?.evidencePhotoUrl ?? null,
            knownDetail: cachedDetail,
          }
        );

        const outcomeMsg =
          data.status === "SUCCESS"
            ? "Visita completada exitosamente."
            : "Visita registrada como fallida.";
        appToast.success("Parada finalizada", outcomeMsg);

        await refetch?.();
        return true;
      } catch {
        await applyLocalCompleteStop(
          stopId,
          data,
          { inTransitAt, arrivedAt, completedAt },
          { enqueue: true, knownDetail: cachedDetail }
        );
        appToast.info(
          "Guardada como pendiente de sincronización",
          "Se enviará automáticamente cuando vuelva internet."
        );
        return true;
      } finally {
        setIsSubmitting(false);
        setActiveAction(null);
      }
    },
    [assignmentId, isSubmitting, applyLocalCompleteStop, refetch]
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
