"use client";

import { useCallback, useEffect, useState } from "react";
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

  const fetchDetail = useCallback(async () => {
    if (!assignmentId) {
      setIsNotFound(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
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
        setAssignment(null);
      } else if (!res.data) {
        setIsNotFound(true);
        setAssignment(null);
        setError(null);
      } else {
        setAssignment(res.data);
        setIsNotFound(false);
        setError(null);
      }
    } catch {
      setError("Fallo de conexión al cargar la asignación.");
      setAssignment(null);
    } finally {
      setIsLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const selectStop = useCallback((stop: AssignmentStopDetail) => {
    setSelectedStop((current) => (current?.id === stop.id ? null : stop));
  }, []);

  const clearSelectedStop = useCallback(() => {
    setSelectedStop(null);
  }, []);

  return {
    assignment,
    isLoading,
    error,
    isNotFound,
    selectedStop,
    selectStop,
    clearSelectedStop,
    refetch: fetchDetail,
  };
}
