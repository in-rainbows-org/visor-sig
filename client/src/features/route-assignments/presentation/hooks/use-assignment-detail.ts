"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AssignmentDetail,
  AssignmentStopDetail,
} from "../../domain/entities/assignment-detail.entity";
import { routeAssignmentRepository } from "../../infrastructure/repositories/route-assignment.repository-impl";

export function useAssignmentDetail(assignmentId: string) {
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);
  const [selectedStop, setSelectedStop] = useState<AssignmentStopDetail | null>(null);
  const hasLoadedRef = useRef<boolean>(false);

  const fetchDetail = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!assignmentId) {
        setIsNotFound(true);
        setIsLoading(false);
        return;
      }

      // Si es silencioso o ya se cargó previamente, evitamos mostrar el skeleton blanco
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
          } else {
            setError(res.errors?.[0] || "Error al cargar el detalle de la asignación.");
          }
          if (!isSilent) {
            setAssignment(null);
          }
        } else if (!res.data) {
          setIsNotFound(true);
          if (!isSilent) {
            setAssignment(null);
          }
          setError(null);
        } else {
          setAssignment(res.data);
          hasLoadedRef.current = true;
          setIsNotFound(false);
          setError(null);
        }
      } catch {
        if (!isSilent) {
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
    fetchDetail();
  }, [fetchDetail]);

  const updateAssignmentLocally = useCallback(
    (updater: (prev: AssignmentDetail) => AssignmentDetail) => {
      setAssignment((current) => {
        if (!current) return current;
        return updater(current);
      });
    },
    []
  );

  const selectStop = useCallback((stop: AssignmentStopDetail) => {
    setSelectedStop((current) => (current?.id === stop.id ? null : stop));
  }, []);

  const clearSelectedStop = useCallback(() => {
    setSelectedStop(null);
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
