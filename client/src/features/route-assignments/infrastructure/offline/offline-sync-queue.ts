import type {
  OfflineSyncState,
  SyncQueueItem,
} from "../../domain/entities/offline-sync.entity";
import { routeAssignmentRepository } from "../repositories/route-assignment.repository-impl";
import { technicianOfflineDb } from "./technician-offline-db";

export interface SyncProgressEvent {
  readonly type: "ITEM_SYNCED" | "QUEUE_UPDATED" | "BATCH_COMPLETED" | "SYNC_PAUSED";
  readonly assignmentId?: string;
  readonly stopId?: string | null;
  readonly syncedCount?: number;
  readonly pendingCount: number;
  readonly error?: string | null;
}

type StateListener = (state: OfflineSyncState) => void;
type EventListener = (event: SyncProgressEvent) => void;

export function isNetworkOrTransientError(statusCode?: number): boolean {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  if (statusCode === undefined || statusCode === 0) return true;
  return statusCode === 408 || statusCode === 429 || statusCode === 502 || statusCode === 503 || statusCode === 504;
}

class OfflineSyncQueueService {
  private isDraining = false;
  private drainPromise: Promise<void> | null = null;
  private stateListeners = new Set<StateListener>();
  private eventListeners = new Set<EventListener>();

  private currentState: OfflineSyncState = {
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    isSyncing: false,
    pendingCount: 0,
    syncedInBatch: 0,
    totalInBatch: 0,
    lastError: null,
  };

  public getState(): OfflineSyncState {
    return this.currentState;
  }

  public subscribeState(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    listener(this.currentState);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  public subscribeEvents(listener: EventListener): () => void {
    this.eventListeners.add(listener);
    return () => {
      this.eventListeners.delete(listener);
    };
  }

  private setState(patch: Partial<OfflineSyncState>): void {
    this.currentState = { ...this.currentState, ...patch };
    for (const listener of this.stateListeners) {
      try {
        listener(this.currentState);
      } catch {
        // Ignorar errores en suscriptores de UI
      }
    }
  }

  private emitEvent(event: SyncProgressEvent): void {
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch {
        // Ignorar errores en suscriptores
      }
    }
  }

  public async refreshPendingCount(): Promise<number> {
    const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
    const count = await technicianOfflineDb.getPendingCount();
    this.setState({ isOnline, pendingCount: count });
    return count;
  }

  public setOnlineStatus(isOnline: boolean): void {
    this.setState({ isOnline });
  }

  /**
   * Procesa la cola FIFO secuencialmente (1 elemento por vez, en estricto orden cronológico).
   * Se detiene inmediatamente si se vuelve a perder la conexión para preservar el orden FIFO.
   */
  public async processQueue(options?: { retryErrors?: boolean }): Promise<void> {
    if (typeof window === "undefined") return;
    if (!navigator.onLine) {
      const pendingCount = await this.refreshPendingCount();
      this.setState({ isOnline: false, isSyncing: false, pendingCount });
      return;
    }

    if (this.isDraining && this.drainPromise) {
      return this.drainPromise;
    }

    this.isDraining = true;
    this.drainPromise = this.runSequentialDrain(Boolean(options?.retryErrors)).finally(() => {
      this.isDraining = false;
      this.drainPromise = null;
    });

    return this.drainPromise;
  }

  private async runSequentialDrain(retryErrors: boolean): Promise<void> {
    const allItems = await technicianOfflineDb.getPendingQueueItems();
    const eligibleItems = retryErrors
      ? allItems
      : allItems.filter((item) => item.syncStatus !== "ERROR");

    if (eligibleItems.length === 0) {
      await this.refreshPendingCount();
      return;
    }

    this.setState({
      isOnline: true,
      isSyncing: true,
      pendingCount: allItems.length,
      syncedInBatch: 0,
      totalInBatch: eligibleItems.length,
      lastError: null,
    });

    let syncedInBatch = 0;

    for (const item of eligibleItems) {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        this.setState({ isOnline: false, isSyncing: false });
        this.emitEvent({
          type: "SYNC_PAUSED",
          pendingCount: await technicianOfflineDb.getPendingCount(),
        });
        return;
      }

      await technicianOfflineDb.updateSyncItem(item.queueId, {
        syncStatus: "SYNCING",
        lastError: null,
      });

      const result = await this.dispatchSingleItem(item);

      if (result.ok) {
        await technicianOfflineDb.removeSyncItem(item.queueId);

        if (item.actionType === "COMPLETE_STOP" && item.stopId) {
          await technicianOfflineDb.updateCachedAssignmentDetail(
            item.assignmentId,
            (prev) => ({
              ...prev,
              stops: prev.stops.map((s) =>
                s.id === item.stopId
                  ? {
                      ...s,
                      pendingSync: false,
                      evidencePhotoUrl: result.evidencePhotoUrl ?? s.evidencePhotoUrl,
                    }
                  : s
              ),
            })
          );
        }

        syncedInBatch += 1;
        const remaining = await technicianOfflineDb.getPendingCount();

        this.setState({
          syncedInBatch,
          pendingCount: remaining,
          lastError: null,
        });

        this.emitEvent({
          type: "ITEM_SYNCED",
          assignmentId: item.assignmentId,
          stopId: item.stopId,
          syncedCount: syncedInBatch,
          pendingCount: remaining,
        });
      } else if (result.isTransient || result.isAuthError) {
        // Error de red o sesión expirada: restaurar a PENDING y detener el drenado para respetar orden FIFO
        await technicianOfflineDb.updateSyncItem(item.queueId, {
          syncStatus: "PENDING",
          retryCount: item.retryCount + 1,
          lastError: result.errorMessage,
        });

        const remaining = await technicianOfflineDb.getPendingCount();
        this.setState({
          isSyncing: false,
          pendingCount: remaining,
          lastError: result.errorMessage,
        });
        this.emitEvent({
          type: "SYNC_PAUSED",
          pendingCount: remaining,
          error: result.errorMessage,
        });
        return;
      } else {
        // Error permanente de validación/negocio (400/404/422): marcar ERROR y continuar con el resto
        await technicianOfflineDb.updateSyncItem(item.queueId, {
          syncStatus: "ERROR",
          retryCount: item.retryCount + 1,
          lastError: result.errorMessage,
        });

        const remaining = await technicianOfflineDb.getPendingCount();
        this.setState({
          pendingCount: remaining,
          lastError: result.errorMessage,
        });
      }
    }

    const finalPending = await technicianOfflineDb.getPendingCount();
    this.setState({
      isSyncing: false,
      pendingCount: finalPending,
    });

    if (syncedInBatch > 0) {
      this.emitEvent({
        type: "BATCH_COMPLETED",
        syncedCount: syncedInBatch,
        pendingCount: finalPending,
      });
    }
  }

  private async dispatchSingleItem(item: SyncQueueItem): Promise<{
    ok: boolean;
    isTransient: boolean;
    isAuthError: boolean;
    errorMessage: string | null;
    evidencePhotoUrl?: string | null;
  }> {
    if (item.actionType === "START_ASSIGNMENT") {
      const res = await routeAssignmentRepository.startAssignment(
        item.assignmentId,
        item.payload.startedAt
      );
      if (res.ok) {
        return { ok: true, isTransient: false, isAuthError: false, errorMessage: null };
      }
      return {
        ok: false,
        isTransient: isNetworkOrTransientError(res.statusCode),
        isAuthError: res.statusCode === 401,
        errorMessage: res.errors?.[0] ?? "No se pudo sincronizar el inicio de asignación.",
      };
    }

    if (item.actionType === "COMPLETE_STOP" && item.stopId) {
      let evidenceFile: File | null = null;
      if (item.payload.evidenceBlob) {
        const blob = item.payload.evidenceBlob;
        const fileName = item.payload.evidenceFileName || `medidor-${item.stopId}.jpg`;
        evidenceFile = new File([blob], fileName, {
          type: blob.type || "image/jpeg",
        });
      }

      const res = await routeAssignmentRepository.completeStop(
        item.assignmentId,
        item.stopId,
        {
          status: item.payload.status ?? "SUCCESS",
          meterReading: item.payload.meterReading ?? undefined,
          observation: item.payload.observation ?? undefined,
          evidenceFile,
          inTransitAt: item.payload.inTransitAt,
          arrivedAt: item.payload.arrivedAt,
          completedAt: item.payload.completedAt,
        }
      );

      if (res.ok) {
        return {
          ok: true,
          isTransient: false,
          isAuthError: false,
          errorMessage: null,
          evidencePhotoUrl: res.data?.evidencePhotoUrl ?? null,
        };
      }

      return {
        ok: false,
        isTransient: isNetworkOrTransientError(res.statusCode),
        isAuthError: res.statusCode === 401,
        errorMessage: res.errors?.[0] ?? "No se pudo sincronizar la parada completada.",
      };
    }

    return {
      ok: false,
      isTransient: false,
      isAuthError: false,
      errorMessage: "Tipo de acción desconocida en la cola.",
    };
  }
}

export const offlineSyncQueue = new OfflineSyncQueueService();
