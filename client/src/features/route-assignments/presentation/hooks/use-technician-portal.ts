"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import type {
  ActiveAssignmentProgress,
  PendingAssignmentsSummary,
  TechnicianAssignmentItem,
  TechnicianFeedItem,
} from "../../domain/entities/technician-dashboard.entity";
import {
  isNetworkOrTransientError,
  offlineSyncQueue,
} from "../../infrastructure/offline/offline-sync-queue";
import { technicianOfflineDb } from "../../infrastructure/offline/technician-offline-db";
import { technicianSessionCache } from "../../infrastructure/offline/technician-session-cache";
import { routeAssignmentRepository } from "../../infrastructure/repositories/route-assignment.repository-impl";
import { technicianPortalRepository } from "../../infrastructure/repositories/technician-portal.repository-impl";
import { yoloMeterOcrService } from "../../infrastructure/services/yolo-meter-ocr.service";
import { warmServiceWorkerCache } from "./use-offline-sync";

export function useTechnicianPortal() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const cachedSession = useSyncExternalStore(
    technicianSessionCache.subscribe,
    technicianSessionCache.get,
    technicianSessionCache.getServerSnapshot
  );
  const [assignments, setAssignments] = useState<TechnicianAssignmentItem[]>([]);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [hasFetchedOnce, setHasFetchedOnce] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const hasPrefetchedRef = useRef<boolean>(false);
  const assignmentsCountRef = useRef<number>(0);
  const clearingCacheRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    assignmentsCountRef.current = assignments.length;
  }, [assignments.length]);

  /**
   * Pre-carga silenciosa de asignaciones activas/pendientes, shells de ruta y modelo OCR
   * para garantizar disponibilidad total cuando el técnico salga a campo sin señal.
   */
  const prefetchActiveAssignments = useCallback(
    async (items: TechnicianAssignmentItem[]) => {
      if (typeof window === "undefined" || !navigator.onLine) return;

      const eligible = items
        .filter((a) => a.status === "IN_PROGRESS" || a.status === "ASSIGNED")
        .slice(0, 10);

      // 1. Pre-cargar pesos del modelo YOLO en CacheStorage para lectura de medidores offline
      void yoloMeterOcrService.ensureLoaded().catch(() => {});

      // 2. Calentar los App Shells `/mis-asignaciones/[id]` vía Service Worker una vez que esté listo
      const detailRoutes = eligible.map((item) => `/mis-asignaciones/${item.id}`);
      void warmServiceWorkerCache(["/mis-asignaciones", ...detailRoutes]);

      // 3. Descargar y guardar detalles de asignaciones activas/pendientes en IndexedDB y prefetch de Next Router
      for (const item of eligible) {
        if (typeof navigator !== "undefined" && !navigator.onLine) break;
        try {
          const detailRes = await routeAssignmentRepository.getAssignmentDetail(item.id);
          if (detailRes.ok && detailRes.data) {
            await technicianOfflineDb.saveAssignmentDetailFromServer(detailRes.data);
          }
          router.prefetch(`/mis-asignaciones/${item.id}`);
        } catch {
          // Ignorar fallos individuales de prefetch
        }
      }
    },
    [router]
  );

  // 1. Carga inmediata desde caché local IndexedDB para arranque offline instantáneo
  useEffect(() => {
    let ignore = false;

    technicianOfflineDb
      .getAssignmentsList()
      .then((cached) => {
        if (ignore) return;
        if (cached.length > 0) {
          setAssignments(cached);
          setHasFetchedOnce(true);
        } else if (typeof navigator !== "undefined" && !navigator.onLine) {
          setHasFetchedOnce(true);
        }
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, []);

  // 2. Sincronizar snapshot de sesión al autenticarse en línea y limpiar caché si cambió el técnico
  useEffect(() => {
    if (!session?.user?.id) return;
    const prev = technicianSessionCache.get();
    if (prev && prev.id !== session.user.id) {
      const clearPromise = technicianOfflineDb
        .clearAllCaches()
        .catch(() => {})
        .finally(() => {
          if (clearingCacheRef.current === clearPromise) {
            clearingCacheRef.current = null;
          }
        });
      clearingCacheRef.current = clearPromise;
    }
    const nextRole = (session.user as { role?: string }).role ?? "TECHNICIAN";
    if (
      !prev ||
      prev.id !== session.user.id ||
      prev.name !== (session.user.name ?? null) ||
      prev.email !== (session.user.email ?? null) ||
      prev.role !== nextRole
    ) {
      technicianSessionCache.save({
        id: session.user.id,
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        image: session.user.image ?? null,
        role: nextRole,
      });
    }
  }, [session?.user]);

  const fetchAssignments = useCallback(async () => {
    if (clearingCacheRef.current) {
      await clearingCacheRef.current;
    }

    const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
    if (isOffline) {
      const cached = await technicianOfflineDb.getAssignmentsList();
      setAssignments(cached);
      setError(null);
      setIsFetching(false);
      setHasFetchedOnce(true);
      return;
    }

    setIsFetching(assignmentsCountRef.current === 0);
    setError(null);

    try {
      const res = await technicianPortalRepository.getMyAssignments();

      if (res.ok) {
        const merged = await technicianOfflineDb.saveAssignmentsList(res.data);
        setAssignments(merged);
        if (!hasPrefetchedRef.current) {
          hasPrefetchedRef.current = true;
          void prefetchActiveAssignments(merged);
        }
      } else if (isNetworkOrTransientError(res.statusCode)) {
        const cached = await technicianOfflineDb.getAssignmentsList();
        if (cached.length > 0) {
          setAssignments(cached);
        } else {
          setError(res.errors?.[0] || "Error de conexión al consultar tus asignaciones.");
        }
      } else {
        setError(res.errors?.[0] || "No se pudieron obtener tus asignaciones.");
      }
    } catch {
      const cached = await technicianOfflineDb.getAssignmentsList();
      if (cached.length > 0) {
        setAssignments(cached);
      } else {
        setError("Error de red al consultar tus asignaciones.");
      }
    } finally {
      setIsFetching(false);
      setHasFetchedOnce(true);
    }
  }, [prefetchActiveAssignments]);

  // 3. Consulta inicial / actualización al entrar con internet o fallback inmediato sin internet
  useEffect(() => {
    const hasEffectiveUser = Boolean(session?.user?.id || cachedSession?.id);
    if (!hasEffectiveUser) return;

    let cancelled = false;

    const timerId = setTimeout(() => {
      void (async () => {
        if (clearingCacheRef.current) {
          await clearingCacheRef.current;
        }
        if (cancelled) return;

        const isOffline = typeof navigator !== "undefined" && !navigator.onLine;
        if (isOffline) {
          const cached = await technicianOfflineDb.getAssignmentsList();
          if (cancelled) return;
          setAssignments(cached);
          setHasFetchedOnce(true);
          setIsFetching(false);
          return;
        }

        if (session?.user?.id || (!isSessionPending && cachedSession?.id)) {
          await fetchAssignments();
        }
      })();
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timerId);
    };
  }, [isSessionPending, session?.user?.id, cachedSession?.id, fetchAssignments]);

  // 4. Escuchar eventos de la cola FIFO para actualizar badges pendientes y estados en tiempo real
  useEffect(() => {
    const unsubscribe = offlineSyncQueue.subscribeEvents((event) => {
      if (event.type === "ITEM_SYNCED" || event.type === "QUEUE_UPDATED") {
        void technicianOfflineDb.getAssignmentsList().then((cached) => {
          setAssignments(cached);
        });
      } else if (event.type === "BATCH_COMPLETED") {
        void fetchAssignments();
      }
    });
    return unsubscribe;
  }, [fetchAssignments]);

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
      pendingSyncCount: active.pendingSyncCount ?? 0,
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
        pendingSyncCount: a.pendingSyncCount ?? 0,
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
        pendingSyncCount: a.pendingSyncCount ?? 0,
      }));
  }, [assignments]);

  const effectiveUser = session?.user ?? cachedSession ?? null;
  const isLoading =
    (isSessionPending && !cachedSession && !hasFetchedOnce) ||
    (!hasFetchedOnce && Boolean(effectiveUser)) ||
    (isFetching && assignments.length === 0);

  return {
    user: effectiveUser,
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
