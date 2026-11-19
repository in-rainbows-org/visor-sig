"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AssignmentDetail,
  AssignmentStopDetail,
} from "../../domain/entities/assignment-detail.entity";
import {
  isNetworkOrTransientError,
  offlineSyncQueue,
} from "../../infrastructure/offline/offline-sync-queue";
import { technicianOfflineDb } from "../../infrastructure/offline/technician-offline-db";
import { routeAssignmentRepository } from "../../infrastructure/repositories/route-assignment.repository-impl";

export function useAssignmentDetail(assignmentId: string) {
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const hasLoadedRef = useRef<boolean>(false);

  const fetchDetail = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!assignmentId) {
        setIsNotFound(true);
        setIsLoading(false);
        return;
      }

      // 1. Intentar cargar primero desde caché IndexedDB para disponibilidad inmediata offline/online
      let cached: AssignmentDetail | null = null;
      try {
        cached = await technicianOfflineDb.getAssignmentDetail(assignmentId);
        if (cached) {
          setAssignment(cached);
          hasLoadedRef.current = true;
          setIsNotFound(false);
          setError(null);
          setIsLoading(false);
        }
      } catch {
        cached = null;
      }

      // 2. Si el navegador está sin conexión, quedarnos limpiamente con la copia en caché local
      const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
      if (isOffline) {
        if (!cached && !hasLoadedRef.current) {
          setError(
            "No hay conexión a internet y esta asignación no fue descargada previamente en el dispositivo."
          );
        }
        setIsLoading(false);
        return;
      }

      // Si es silencioso o ya se cargó desde caché/red, evitamos mostrar el skeleton blanco
      const isSilent = options?.silent ?? hasLoadedRef.current;
      if (!isSilent) {
        setIsLoading(true);
      }
      setError(null);
      setIsNotFound(false);

      try {
        const res = await routeAssignmentRepository.getAssignmentDetail(assignmentId);

        if (!res.ok) {
          if (res.statusCode === 404) {
            setIsNotFound(true);
            if (!isSilent) {
              setAssignment(null);
            }
          } else if (isNetworkOrTransientError(res.statusCode) && (cached || hasLoadedRef.current)) {
            // Fallo de red pero ya tenemos datos en caché: operar en modo offline sin bloquear al técnico
            setError(null);
          } else {
            setError(res.errors?.[0] || "Error al cargar el detalle de la asignación.");
            if (!isSilent) {
              setAssignment(null);
            }
          }
        } else if (!res.data) {
          setIsNotFound(true);
          if (!isSilent) {
            setAssignment(null);
          }
          setError(null);
        } else {
          // Preservar en caché cualquier estado local aún en cola FIFO
          const merged = await technicianOfflineDb.saveAssignmentDetailFromServer(res.data);
          setAssignment(merged);
          hasLoadedRef.current = true;
          setIsNotFound(false);
          setError(null);
        }
      } catch {
        if (!isSilent && !cached && !hasLoadedRef.current) {
          setError("Fallo de conexión al cargar la asignación.");
          setAssignment(null);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [assignmentId]
  );

  useEffect(() => {
    hasLoadedRef.current = false;
    const timerId = setTimeout(() => {
      void fetchDetail();
    }, 0);
    return () => clearTimeout(timerId);
  }, [fetchDetail]);

  // Escuchar cambios de la cola de sincronización FIFO para actualizar badges al instante
  useEffect(() => {
    if (!assignmentId) return;
    const unsubscribe = offlineSyncQueue.subscribeEvents((event) => {
      if (
        (event.type === "ITEM_SYNCED" || event.type === "QUEUE_UPDATED") &&
        (!event.assignmentId || event.assignmentId === assignmentId)
      ) {
        void technicianOfflineDb.getAssignmentDetail(assignmentId).then((cached) => {
          if (cached) {
            setAssignment(cached);
          }
        });
      } else if (event.type === "BATCH_COMPLETED") {
        void fetchDetail({ silent: true });
      }
    });
    return unsubscribe;
  }, [assignmentId, fetchDetail]);

  const updateAssignmentLocally = useCallback(
    (updater: (prev: AssignmentDetail) => AssignmentDetail) => {
      setAssignment((current) => {
        if (!current) return current;
        const next = updater(current);
        void technicianOfflineDb.saveAssignmentDetail(next);
        return next;
      });
    },
    []
  );

  const selectedStop = selectedStopId
    ? assignment?.stops.find((stop) => stop.id === selectedStopId) ?? null
    : null;

  const selectStop = useCallback((stop: AssignmentStopDetail) => {
    setSelectedStopId((current) => (current === stop.id ? null : stop.id));
  }, []);

  const clearSelectedStop = useCallback(() => {
    setSelectedStopId(null);
  }, []);

  const refetch = useCallback(
    async (options?: { silent?: boolean } | unknown) => {
      const isSilent =
        options && typeof options === "object" && "silent" in options
          ? Boolean((options as { silent?: boolean }).silent)
          : undefined;
      return fetchDetail(isSilent !== undefined ? { silent: isSilent } : undefined);
    },
    [fetchDetail]
  );

  return {
    assignment,
    isLoading,
    error,
    isNotFound,
    selectedStop,
    selectStop,
    clearSelectedStop,
    refetch,
    updateAssignmentLocally,
  };
}
