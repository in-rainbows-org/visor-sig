/**
 * Entidades puras de dominio para el funcionamiento Offline-First y la cola de sincronización FIFO.
 */

export type SyncActionType = "START_ASSIGNMENT" | "COMPLETE_STOP";

export type SyncQueueItemStatus = "PENDING" | "SYNCING" | "ERROR";

export interface SyncQueuePayload {
  readonly status?: "SUCCESS" | "FAILED";
  readonly meterReading?: string | null;
  readonly observation?: string | null;
  readonly evidenceBlob?: Blob | null;
  readonly evidenceFileName?: string | null;
  readonly startedAt?: string | null;
  readonly inTransitAt?: string | null;
  readonly arrivedAt?: string | null;
  readonly completedAt?: string | null;
}

export interface SyncQueueItem {
  readonly queueId: string;
  readonly createdAtMs: number;
  readonly actionType: SyncActionType;
  readonly assignmentId: string;
  readonly stopId: string | null;
  readonly payload: SyncQueuePayload;
  readonly syncStatus: SyncQueueItemStatus;
  readonly retryCount: number;
  readonly lastError: string | null;
}

export interface OfflineSyncState {
  readonly isOnline: boolean;
  readonly isSyncing: boolean;
  readonly pendingCount: number;
  readonly syncedInBatch: number;
  readonly totalInBatch: number;
  readonly lastError: string | null;
}

export interface TechnicianSessionSnapshot {
  readonly id: string;
  readonly name: string | null;
  readonly email: string | null;
  readonly image: string | null;
  readonly role: string;
  readonly savedAt: string;
}
