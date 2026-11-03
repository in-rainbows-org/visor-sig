"use client";

import { useCallback, useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import type { RouteAssignmentSummary } from "../../domain/entities/route-assignment.entity";
import { routeAssignmentRepository } from "../../infrastructure/repositories/route-assignment.repository-impl";

export function useTechnicianPortal() {
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const [assignments, setAssignments] = useState<RouteAssignmentSummary[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssignments = useCallback(async () => {
    if (!session?.user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await routeAssignmentRepository.getAssignments({
        technicianId: session.user.id,
        page: 1,
        pageSize: 50,
      });

      if (res.ok) {
        setAssignments(res.data.items);
      } else {
        setError(res.errors?.[0] || "No se pudieron obtener tus asignaciones.");
      }
    } catch {
      setError("Error de red al consultar tus asignaciones.");
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (!isSessionPending && session?.user?.id) {
      fetchAssignments();
    } else if (!isSessionPending && !session) {
      setIsLoading(false);
    }
  }, [fetchAssignments, isSessionPending, session]);

  return {
    user: session?.user ?? null,
    assignments,
    isLoading: isLoading || isSessionPending,
    error,
    refetch: fetchAssignments,
  };
}
