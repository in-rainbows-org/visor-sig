"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { authClient } from "@/lib/auth-client";
import type {
  ActiveAssignmentProgress,
  PendingAssignmentsSummary,
  TechnicianAssignmentItem,
  TechnicianFeedItem,
} from "../../domain/entities/technician-dashboard.entity";
import { technicianPortalRepository } from "../../infrastructure/repositories/technician-portal.repository-impl";

export function useTechnicianPortal() {
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const [assignments, setAssignments] = useState<TechnicianAssignmentItem[]>([]);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [hasFetchedOnce, setHasFetchedOnce] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    setIsFetching(true);
    setError(null);

    try {
      const res = await technicianPortalRepository.getMyAssignments();

      if (res.ok) {
        setAssignments(res.data);
      } else {
        setError(res.errors?.[0] || "No se pudieron obtener tus asignaciones.");
      }
    } catch {
      setError("Error de red al consultar tus asignaciones.");
    } finally {
      setIsFetching(false);
      setHasFetchedOnce(true);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    if (!isSessionPending && session?.user?.id) {
      technicianPortalRepository
        .getMyAssignments()
        .then((res) => {
          if (ignore) return;
          if (res.ok) {
            setAssignments(res.data);
          } else {
            setError(res.errors?.[0] || "No se pudieron obtener tus asignaciones.");
          }
          setIsFetching(false);
          setHasFetchedOnce(true);
        })
        .catch(() => {
          if (ignore) return;
          setError("Error de red al consultar tus asignaciones.");
          setIsFetching(false);
          setHasFetchedOnce(true);
        });
    }

    return () => {
      ignore = true;
    };
  }, [isSessionPending, session?.user?.id]);

  // Asignación activa en progreso (si existe una con estado IN_PROGRESS)
  const activeAssignment = useMemo<ActiveAssignmentProgress | null>(() => {
    const active = assignments.find((a) => a.status === "IN_PROGRESS");
    if (!active) return null;

    return {
      id: active.id,
      routeCode: `ASG-${active.id.slice(0, 8).toUpperCase()}`,
      serviceType: active.assignmentType,
      startedAt: active.startedAt ?? active.createdDate,
      totalStops: active.totalStops,
      totalDistanceKm: active.totalDistanceKm,
      status: "IN_PROGRESS",
      targetUrl: `/mis-asignaciones/${active.id}`,
    };
  }, [assignments]);

  // Resumen cuantitativo de asignaciones pendientes (total y hoy)
  const pendingSummary = useMemo<PendingAssignmentsSummary>(() => {
    const today = new Date().toLocaleDateString("en-CA"); // Formato local YYYY-MM-DD
    const pendingList = assignments.filter(
      (a) => a.status === "PENDING" || a.status === "ASSIGNED"
    );

    return {
      totalPending: pendingList.length,
      todayCount: pendingList.filter((a) => a.scheduledDate === today).length,
    };
  }, [assignments]);

  // Feed de Asignadas (PENDING, ASSIGNED, IN_PROGRESS)
  const assignedFeed = useMemo<TechnicianFeedItem[]>(() => {
    return assignments
      .filter(
        (a) =>
          a.status === "PENDING" ||
          a.status === "ASSIGNED" ||
          a.status === "IN_PROGRESS"
      )
      .map((a) => ({
        id: a.id,
        routeCode: `ASG-${a.id.slice(0, 8).toUpperCase()}`,
        serviceType: a.assignmentType,
        scheduledDate: a.scheduledDate,
        startedAt: a.startedAt,
        completedAt: a.completedAt,
        totalStops: a.totalStops,
        distanceKm: a.totalDistanceKm,
        status: a.status,
      }));
  }, [assignments]);

  // Feed de Completadas (COMPLETED)
  const completedFeed = useMemo<TechnicianFeedItem[]>(() => {
    return assignments
      .filter((a) => a.status === "COMPLETED")
      .map((a) => ({
        id: a.id,
        routeCode: `ASG-${a.id.slice(0, 8).toUpperCase()}`,
        serviceType: a.assignmentType,
        scheduledDate: a.scheduledDate,
        startedAt: a.startedAt,
        completedAt: a.completedAt,
        totalStops: a.totalStops,
        distanceKm: a.totalDistanceKm,
        status: a.status,
      }));
  }, [assignments]);

  const isLoading = isSessionPending || (!hasFetchedOnce && !!session?.user?.id) || isFetching;

  return {
    user: session?.user ?? null,
    assignments,
    activeAssignment,
    pendingSummary,
    assignedFeed,
    completedFeed,
    isLoading,
    error,
    refetch: fetchAssignments,
  };
}
