"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import type { OfflineSyncState } from "../../domain/entities/offline-sync.entity";
import { offlineSyncQueue } from "../../infrastructure/offline/offline-sync-queue";

const INITIAL_SYNC_STATE: OfflineSyncState = {
  isOnline: true,
  isSyncing: false,
  pendingCount: 0,
  syncedInBatch: 0,
  totalInBatch: 0,
  lastError: null,
};

const BASE_RETRY_DELAY_MS = 5_000;
const MAX_RETRY_DELAY_MS = 30_000;
const SW_READY_TIMEOUT_MS = 2_500;

let isSwRegistered = false;
let hasWarmedShellThisLoad = false;

/**
 * Envía al Service Worker activo una lista de rutas `/mis-asignaciones*` y activos `/_next/static/*`
 * para pre-calentar el App Shell inmediatamente después de que tome control (`ready`).
 */
export async function warmServiceWorkerCache(urls: string[]): Promise<void> {
  if (typeof window === "undefined" || !navigator.onLine || !("serviceWorker" in navigator)) {
    return;
  }
  if (urls.length === 0) return;

  try {
    const registration = await Promise.race<ServiceWorkerRegistration | null>([
      navigator.serviceWorker.ready,
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), SW_READY_TIMEOUT_MS);
      }),
    ]);

    const target = registration?.active ?? navigator.serviceWorker.controller;
    if (target) {
      target.postMessage({ type: "WARM_URLS", urls });
    }
  } catch {
    // Ignorar si el navegador restringe el Service Worker
  }
}

function collectCurrentDocumentStaticUrls(): string[] {
  if (typeof window === "undefined" || typeof document === "undefined") return [];

  const urls = new Set<string>([
    "/mis-asignaciones",
    window.location.pathname,
  ]);

  document.querySelectorAll<HTMLScriptElement>("script[src]").forEach((el) => {
    if (el.src && el.src.includes("/_next/static/")) {
      urls.add(el.src);
    }
  });

  document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][href], link[rel="preload"][href]').forEach((el) => {
    if (el.href && el.href.includes("/_next/static/")) {
      urls.add(el.href);
    }
  });

  if (typeof performance !== "undefined" && typeof performance.getEntriesByType === "function") {
    for (const entry of performance.getEntriesByType("resource")) {
      if (entry.name.includes("/_next/static/")) {
        urls.add(entry.name);
      }
    }
  }

  return Array.from(urls);
}

/**
 * Hook reactivo que:
 * 1. Registra el Service Worker (`/sw.js`) y pre-calienta los recursos activos del App Shell tras `ready`.
 * 2. Detecta cambios de conectividad (`online` / `offline` / foco).
 * 3. Dispara automáticamente el drenado secuencial FIFO (1 por 1) con reintento automático con backoff ante fallos transitorios.
 */
export function useOfflineSync() {
  const [syncState, setSyncState] = useState<OfflineSyncState>(INITIAL_SYNC_STATE);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryAttemptRef = useRef<number>(0);

  const clearRetryTimer = useCallback(() => {
    if (retryTimerRef.current !== null) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Registrar Service Worker una única vez y calentar App Shell + scripts activos
    if (!isSwRegistered && "serviceWorker" in navigator) {
      isSwRegistered = true;
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => {
          isSwRegistered = false;
        });
    }

    let timerWarm: ReturnType<typeof setTimeout> | null = null;
    if (!hasWarmedShellThisLoad && navigator.onLine) {
      hasWarmedShellThisLoad = true;
      timerWarm = setTimeout(() => {
        timerWarm = null;
        void warmServiceWorkerCache(collectCurrentDocumentStaticUrls());
      }, 300);
    }

    // 2. Suscribirse al estado global del gestor FIFO
    const unsubscribeState = offlineSyncQueue.subscribeState((next) => {
      setSyncState(next);
    });

    const scheduleBackoffRetry = () => {
      if (!navigator.onLine) return;
      if (retryTimerRef.current !== null) return;

      const delayMs = Math.min(
        MAX_RETRY_DELAY_MS,
        BASE_RETRY_DELAY_MS * Math.pow(2, retryAttemptRef.current)
      );
      retryAttemptRef.current = Math.min(retryAttemptRef.current + 1, 5);

      retryTimerRef.current = setTimeout(() => {
        retryTimerRef.current = null;
        if (typeof navigator !== "undefined" && navigator.onLine) {
          void offlineSyncQueue.processQueue();
        }
      }, delayMs);
    };

    const unsubscribeEvents = offlineSyncQueue.subscribeEvents((event) => {
      if (event.type === "ITEM_SYNCED") {
        retryAttemptRef.current = 0;
      } else if (event.type === "BATCH_COMPLETED") {
        retryAttemptRef.current = 0;
        clearRetryTimer();
        if ((event.syncedCount ?? 0) > 0) {
          const count = event.syncedCount ?? 0;
          appToast.success(
            "Sincronización completada",
            `${count} ${count === 1 ? "operación sincronizada" : "operaciones sincronizadas"} con el servidor.`
          );
        }
      } else if (event.type === "SYNC_PAUSED" && event.pendingCount > 0 && navigator.onLine) {
        scheduleBackoffRetry();
      }
    });

    // 3. Consultar pendientes iniciales y arrancar sincronización si hay red
    offlineSyncQueue.setOnlineStatus(navigator.onLine);
    void offlineSyncQueue.refreshPendingCount().then((count) => {
      if (navigator.onLine && count > 0) {
        void offlineSyncQueue.processQueue();
      }
    });

    const handleOnline = () => {
      retryAttemptRef.current = 0;
      clearRetryTimer();
      offlineSyncQueue.setOnlineStatus(true);
      void offlineSyncQueue.processQueue();
    };

    const handleOffline = () => {
      clearRetryTimer();
      offlineSyncQueue.setOnlineStatus(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && navigator.onLine) {
        clearRetryTimer();
        void offlineSyncQueue.processQueue();
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (timerWarm !== null) {
        clearTimeout(timerWarm);
        hasWarmedShellThisLoad = false;
      }
      clearRetryTimer();
      unsubscribeState();
      unsubscribeEvents();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [clearRetryTimer]);

  const triggerSync = useCallback(async () => {
    retryAttemptRef.current = 0;
    clearRetryTimer();
    await offlineSyncQueue.processQueue({ retryErrors: true });
  }, [clearRetryTimer]);

  return {
    ...syncState,
    triggerSync,
  };
}
