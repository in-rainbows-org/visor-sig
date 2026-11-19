import type {
  AssignmentDetail,
  AssignmentStopDetail,
} from "../../domain/entities/assignment-detail.entity";
import type { SyncQueueItem } from "../../domain/entities/offline-sync.entity";
import type { TechnicianAssignmentItem } from "../../domain/entities/technician-dashboard.entity";

const DB_NAME = "visorgis_technician_offline_db";
const DB_VERSION = 1;

const STORE_ASSIGNMENTS_LIST = "assignments_list";
const STORE_ASSIGNMENT_DETAILS = "assignment_details";
const STORE_SYNC_OUTBOX = "sync_outbox";

interface CachedRecord<T> {
  id: string;
  data: T;
  updatedAt: string;
}

const STOP_STATUS_RANK: Record<string, number> = {
  PENDING: 0,
  IN_TRANSIT: 1,
  ARRIVED: 2,
  COMPLETED: 3,
  FAILED: 3,
};

const ASSIGNMENT_STATUS_RANK: Record<string, number> = {
  PENDING: 0,
  ASSIGNED: 0,
  IN_PROGRESS: 1,
  COMPLETED: 2,
  CANCELLED: 3,
};

function isBrowserSupported(): boolean {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function toDateOrNull(val: Date | string | null | undefined): Date | null {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function hydrateStopDetail(stop: AssignmentStopDetail): AssignmentStopDetail {
  return {
    ...stop,
    inTransitAt: toDateOrNull(stop.inTransitAt),
    arrivedAt: toDateOrNull(stop.arrivedAt),
    completedAt: toDateOrNull(stop.completedAt),
    pendingSync: Boolean(stop.pendingSync),
  };
}

function hydrateAssignmentDetail(detail: AssignmentDetail): AssignmentDetail {
  return {
    ...detail,
    startedAt: toDateOrNull(detail.startedAt),
    completedAt: toDateOrNull(detail.completedAt),
    stops: (detail.stops ?? []).map(hydrateStopDetail),
  };
}

let dbPromise: Promise<IDBDatabase> | null = null;
let monotonicSeq = 0;

function openOfflineDb(): Promise<IDBDatabase> {
  if (!isBrowserSupported()) {
    return Promise.reject(new Error("IndexedDB no está disponible en este entorno."));
  }
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_ASSIGNMENTS_LIST)) {
        db.createObjectStore(STORE_ASSIGNMENTS_LIST, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(STORE_ASSIGNMENT_DETAILS)) {
        db.createObjectStore(STORE_ASSIGNMENT_DETAILS, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(STORE_SYNC_OUTBOX)) {
        const outboxStore = db.createObjectStore(STORE_SYNC_OUTBOX, {
          keyPath: "queueId",
        });
        outboxStore.createIndex("by_created_at", "createdAtMs", { unique: false });
        outboxStore.createIndex("by_assignment", "assignmentId", { unique: false });
        outboxStore.createIndex("by_stop", "stopId", { unique: false });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };

    request.onerror = () => {
      dbPromise = null;
      reject(request.error ?? new Error("Error al abrir IndexedDB."));
    };
  });

  return dbPromise;
}

function runTx<T>(
  storeNames: string | string[],
  mode: IDBTransactionMode,
  executor: (tx: IDBTransaction) => Promise<T> | IDBRequest<T>
): Promise<T> {
  return openOfflineDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(storeNames, mode);
        let resultValue: T;
        let hasResult = false;

        tx.oncomplete = () => {
          if (hasResult) {
            resolve(resultValue);
          } else {
            resolve(undefined as unknown as T);
          }
        };

        tx.onerror = () => {
          reject(tx.error ?? new Error("Error en transacción de IndexedDB."));
        };

        tx.onabort = () => {
          reject(tx.error ?? new Error("Transacción abortada en IndexedDB."));
        };

        try {
          const maybeReq = executor(tx);
          if (maybeReq instanceof Promise) {
            maybeReq
              .then((val) => {
                resultValue = val;
                hasResult = true;
              })
              .catch((err) => {
                try {
                  tx.abort();
                } catch {
                  // Ignorar si ya cerró
                }
                reject(err);
              });
          } else {
            maybeReq.onsuccess = () => {
              resultValue = maybeReq.result;
              hasResult = true;
            };
          }
        } catch (err) {
          reject(err);
        }
      })
  );
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Repositorio IndexedDB persistente para el portal del técnico.
 * Gestiona caché de listado, detalle con paradas/geometrías y cola FIFO de sincronización.
 */
export const technicianOfflineDb = {
  // ─── 1. Cola FIFO (`sync_outbox`) ─────────────────────────────────────────

  async getPendingQueueItems(): Promise<SyncQueueItem[]> {
    if (!isBrowserSupported()) return [];
    try {
      const items = await runTx<SyncQueueItem[]>(
        STORE_SYNC_OUTBOX,
        "readonly",
        (tx) => {
          const store = tx.objectStore(STORE_SYNC_OUTBOX);
          return reqToPromise(store.getAll()) as Promise<SyncQueueItem[]>;
        }
      );
      return (items ?? []).sort(
        (a, b) => a.createdAtMs - b.createdAtMs || a.queueId.localeCompare(b.queueId)
      );
    } catch {
      return [];
    }
  },

  async getPendingCount(): Promise<number> {
    if (!isBrowserSupported()) return 0;
    try {
      return await runTx<number>(STORE_SYNC_OUTBOX, "readonly", (tx) => {
        const store = tx.objectStore(STORE_SYNC_OUTBOX);
        return reqToPromise(store.count());
      });
    } catch {
      return 0;
    }
  },

  async getPendingCountByAssignment(): Promise<Record<string, number>> {
    const items = await this.getPendingQueueItems();
    const counts: Record<string, number> = {};
    for (const item of items) {
      counts[item.assignmentId] = (counts[item.assignmentId] ?? 0) + 1;
    }
    return counts;
  },

  async enqueueSyncItem(
    input: Omit<
      SyncQueueItem,
      "queueId" | "createdAtMs" | "syncStatus" | "retryCount" | "lastError"
    >
  ): Promise<SyncQueueItem> {
    const nowMs = Date.now();
    monotonicSeq = (monotonicSeq + 1) % 10000;
    const paddedSeq = String(monotonicSeq).padStart(4, "0");
    const randomSuffix =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID().slice(0, 8)
        : Math.random().toString(36).slice(2, 10);

    const item: SyncQueueItem = {
      ...input,
      createdAtMs: nowMs,
      queueId: `${nowMs}-${paddedSeq}-${randomSuffix}`,
      syncStatus: "PENDING",
      retryCount: 0,
      lastError: null,
    };

    if (!isBrowserSupported()) return item;

    // Evitar duplicados exactos de COMPLETE_STOP para la misma parada o START_ASSIGNMENT repetido
    const existing = await this.getPendingQueueItems();
    if (item.actionType === "START_ASSIGNMENT") {
      const alreadyQueued = existing.find(
        (e) => e.actionType === "START_ASSIGNMENT" && e.assignmentId === item.assignmentId
      );
      if (alreadyQueued) {
        return alreadyQueued;
      }
    } else if (item.actionType === "COMPLETE_STOP" && item.stopId) {
      const existingStop = existing.find(
        (e) =>
          e.actionType === "COMPLETE_STOP" &&
          e.assignmentId === item.assignmentId &&
          e.stopId === item.stopId
      );
      if (existingStop) {
        const updatedItem: SyncQueueItem = {
          ...existingStop,
          payload: item.payload,
          syncStatus: "PENDING",
          lastError: null,
        };
        await runTx(STORE_SYNC_OUTBOX, "readwrite", (tx) =>
          reqToPromise(tx.objectStore(STORE_SYNC_OUTBOX).put(updatedItem))
        );
        return updatedItem;
      }
    }

    await runTx(STORE_SYNC_OUTBOX, "readwrite", (tx) =>
      reqToPromise(tx.objectStore(STORE_SYNC_OUTBOX).add(item))
    );
    return item;
  },

  async updateSyncItem(
    queueId: string,
    patch: Partial<SyncQueueItem>
  ): Promise<void> {
    if (!isBrowserSupported()) return;
    await runTx(STORE_SYNC_OUTBOX, "readwrite", async (tx) => {
      const store = tx.objectStore(STORE_SYNC_OUTBOX);
      const current = await reqToPromise<SyncQueueItem | undefined>(store.get(queueId));
      if (!current) return;
      const updated: SyncQueueItem = { ...current, ...patch };
      await reqToPromise(store.put(updated));
    });
  },

  async removeSyncItem(queueId: string): Promise<void> {
    if (!isBrowserSupported()) return;
    await runTx(STORE_SYNC_OUTBOX, "readwrite", (tx) =>
      reqToPromise(tx.objectStore(STORE_SYNC_OUTBOX).delete(queueId))
    );
  },

  // ─── 2. Detalle de Asignación (`assignment_details`) ──────────────────────

  async getAssignmentDetail(assignmentId: string): Promise<AssignmentDetail | null> {
    if (!isBrowserSupported() || !assignmentId) return null;
    try {
      const record = await runTx<CachedRecord<AssignmentDetail> | undefined>(
        STORE_ASSIGNMENT_DETAILS,
        "readonly",
        (tx) => reqToPromise(tx.objectStore(STORE_ASSIGNMENT_DETAILS).get(assignmentId))
      );
      if (!record?.data) return null;
      const hydrated = hydrateAssignmentDetail(record.data);
      return await this.mergeAssignmentDetailWithQueue(hydrated);
    } catch {
      return null;
    }
  },

  async saveAssignmentDetail(detail: AssignmentDetail): Promise<AssignmentDetail> {
    const merged = await this.mergeAssignmentDetailWithQueue(hydrateAssignmentDetail(detail));
    if (!isBrowserSupported()) return merged;

    const record: CachedRecord<AssignmentDetail> = {
      id: merged.id,
      data: merged,
      updatedAt: new Date().toISOString(),
    };
    await runTx(STORE_ASSIGNMENT_DETAILS, "readwrite", (tx) =>
      reqToPromise(tx.objectStore(STORE_ASSIGNMENT_DETAILS).put(record))
    );
    return merged;
  },

  /**
   * Guarda un detalle recién llegado del servidor preservando cualquier parada
   * adelantada localmente o pendiente en la cola FIFO.
   */
  async saveAssignmentDetailFromServer(
    serverDetail: AssignmentDetail
  ): Promise<AssignmentDetail> {
    if (!isBrowserSupported()) return serverDetail;

    const existingRecord = await runTx<CachedRecord<AssignmentDetail> | undefined>(
      STORE_ASSIGNMENT_DETAILS,
      "readonly",
      (tx) => reqToPromise(tx.objectStore(STORE_ASSIGNMENT_DETAILS).get(serverDetail.id))
    ).catch(() => undefined);

    const queueItems = (await this.getPendingQueueItems()).filter(
      (q) => q.assignmentId === serverDetail.id
    );

    const cachedDetail = existingRecord?.data
      ? hydrateAssignmentDetail(existingRecord.data)
      : null;

    let baseDetail = hydrateAssignmentDetail(serverDetail);

    // Preservar transiciones locales no concluidas (IN_TRANSIT / ARRIVED) si la cola aún tiene acciones pendientes
    if (cachedDetail && queueItems.length > 0) {
      const cachedRank = ASSIGNMENT_STATUS_RANK[cachedDetail.status] ?? 0;
      const serverRank = ASSIGNMENT_STATUS_RANK[baseDetail.status] ?? 0;

      baseDetail = {
        ...baseDetail,
        status: cachedRank > serverRank ? cachedDetail.status : baseDetail.status,
        startedAt: baseDetail.startedAt ?? cachedDetail.startedAt,
        stops: baseDetail.stops.map((sStop) => {
          const cStop = cachedDetail.stops.find((c) => c.id === sStop.id);
          if (!cStop) return sStop;
          const cRank = STOP_STATUS_RANK[cStop.status] ?? 0;
          const sRank = STOP_STATUS_RANK[sStop.status] ?? 0;
          if (cRank > sRank) {
            return {
              ...sStop,
              status: cStop.status,
              inTransitAt: cStop.inTransitAt ?? sStop.inTransitAt,
              arrivedAt: cStop.arrivedAt ?? sStop.arrivedAt,
              completedAt: cStop.completedAt ?? sStop.completedAt,
              meterReading: cStop.meterReading ?? sStop.meterReading,
              observation: cStop.observation ?? sStop.observation,
              pendingSync: cStop.pendingSync,
            };
          }
          return sStop;
        }),
      };
    }

    return await this.saveAssignmentDetail(baseDetail);
  },

  async updateCachedAssignmentDetail(
    assignmentId: string,
    updater: (prev: AssignmentDetail) => AssignmentDetail
  ): Promise<AssignmentDetail | null> {
    const current = await this.getAssignmentDetail(assignmentId);
    if (!current) return null;
    const updated = hydrateAssignmentDetail(updater(current));
    return await this.saveAssignmentDetail(updated);
  },

  async mergeAssignmentDetailWithQueue(
    detail: AssignmentDetail,
    providedQueueItems?: SyncQueueItem[]
  ): Promise<AssignmentDetail> {
    const allQueue = providedQueueItems ?? (await this.getPendingQueueItems());
    const assignmentQueue = allQueue.filter((q) => q.assignmentId === detail.id);

    if (assignmentQueue.length === 0) {
      return {
        ...detail,
        pendingSyncCount: 0,
        stops: detail.stops.map((s) => ({ ...s, pendingSync: false })),
      };
    }

    const startItem = assignmentQueue.find((q) => q.actionType === "START_ASSIGNMENT");
    const stopQueueMap = new Map<string, SyncQueueItem>();
    for (const q of assignmentQueue) {
      if (q.actionType === "COMPLETE_STOP" && q.stopId) {
        stopQueueMap.set(q.stopId, q);
      }
    }

    const updatedStops = detail.stops.map((stop) => {
      const queued = stopQueueMap.get(stop.id);
      if (!queued) {
        return { ...stop, pendingSync: false };
      }

      const targetStatus =
        queued.payload.status === "FAILED" ? "FAILED" : "COMPLETED";

      return {
        ...stop,
        status: targetStatus as AssignmentStopDetail["status"],
        inTransitAt:
          toDateOrNull(queued.payload.inTransitAt) ?? stop.inTransitAt,
        arrivedAt: toDateOrNull(queued.payload.arrivedAt) ?? stop.arrivedAt,
        completedAt:
          toDateOrNull(queued.payload.completedAt) ??
          stop.completedAt ??
          new Date(queued.createdAtMs),
        meterReading: queued.payload.meterReading ?? stop.meterReading,
        observation: queued.payload.observation ?? stop.observation,
        pendingSync: true,
      };
    });

    const completedCount = updatedStops.filter(
      (s) => s.status === "COMPLETED" || s.status === "FAILED"
    ).length;
    const allTerminal =
      updatedStops.length > 0 && completedCount >= updatedStops.length;

    let nextStatus = detail.status;
    if (allTerminal) {
      nextStatus = "COMPLETED";
    } else if (
      detail.status === "ASSIGNED" &&
      (startItem || stopQueueMap.size > 0)
    ) {
      nextStatus = "IN_PROGRESS";
    }

    return {
      ...detail,
      status: nextStatus,
      startedAt:
        detail.startedAt ??
        (startItem ? toDateOrNull(startItem.payload.startedAt) : null) ??
        (stopQueueMap.size > 0 ? new Date() : null),
      completedAt: allTerminal ? detail.completedAt ?? new Date() : detail.completedAt,
      completedStops: completedCount,
      pendingSyncCount: assignmentQueue.length,
      stops: updatedStops,
    };
  },

  // ─── 3. Listado de Asignaciones (`assignments_list`) ──────────────────────

  async getAssignmentsList(): Promise<TechnicianAssignmentItem[]> {
    if (!isBrowserSupported()) return [];
    try {
      const records = await runTx<CachedRecord<TechnicianAssignmentItem>[]>(
        STORE_ASSIGNMENTS_LIST,
        "readonly",
        (tx) => reqToPromise(tx.objectStore(STORE_ASSIGNMENTS_LIST).getAll())
      );
      const items = (records ?? []).map((r) => r.data);
      return await this.mergeAssignmentsListWithQueue(items);
    } catch {
      return [];
    }
  },

  async saveAssignmentsList(
    items: TechnicianAssignmentItem[]
  ): Promise<TechnicianAssignmentItem[]> {
    const merged = await this.mergeAssignmentsListWithQueue(items);
    if (!isBrowserSupported()) return merged;

    const nowIso = new Date().toISOString();
    await runTx(STORE_ASSIGNMENTS_LIST, "readwrite", async (tx) => {
      const store = tx.objectStore(STORE_ASSIGNMENTS_LIST);
      await reqToPromise(store.clear());
      for (const item of merged) {
        const rec: CachedRecord<TechnicianAssignmentItem> = {
          id: item.id,
          data: item,
          updatedAt: nowIso,
        };
        await reqToPromise(store.put(rec));
      }
    });
    return merged;
  },

  async updateCachedAssignmentSummary(
    assignmentId: string,
    patch: Partial<TechnicianAssignmentItem>
  ): Promise<void> {
    if (!isBrowserSupported()) return;
    await runTx(STORE_ASSIGNMENTS_LIST, "readwrite", async (tx) => {
      const store = tx.objectStore(STORE_ASSIGNMENTS_LIST);
      const current = await reqToPromise<
        CachedRecord<TechnicianAssignmentItem> | undefined
      >(store.get(assignmentId));
      if (!current) return;
      const updated: CachedRecord<TechnicianAssignmentItem> = {
        ...current,
        data: { ...current.data, ...patch },
        updatedAt: new Date().toISOString(),
      };
      await reqToPromise(store.put(updated));
    }).catch(() => {});
  },

  async mergeAssignmentsListWithQueue(
    items: TechnicianAssignmentItem[]
  ): Promise<TechnicianAssignmentItem[]> {
    const queueItems = await this.getPendingQueueItems();
    if (queueItems.length === 0) {
      return items.map((item) => ({ ...item, pendingSyncCount: 0 }));
    }

    const byAssignment = new Map<string, SyncQueueItem[]>();
    for (const q of queueItems) {
      const list = byAssignment.get(q.assignmentId) ?? [];
      list.push(q);
      byAssignment.set(q.assignmentId, list);
    }

    const result: TechnicianAssignmentItem[] = [];
    for (const item of items) {
      const pending = byAssignment.get(item.id) ?? [];
      if (pending.length === 0) {
        result.push({ ...item, pendingSyncCount: 0 });
        continue;
      }

      // Intentar verificar en detalle cacheado si ya se completaron todas las paradas offline
      let nextStatus = item.status;
      let nextStartedAt = item.startedAt;
      let nextCompletedAt = item.completedAt;

      const startItem = pending.find((q) => q.actionType === "START_ASSIGNMENT");
      if (
        (nextStatus === "ASSIGNED" || nextStatus === "PENDING") &&
        (startItem || pending.some((q) => q.actionType === "COMPLETE_STOP"))
      ) {
        nextStatus = "IN_PROGRESS";
        nextStartedAt =
          nextStartedAt ??
          startItem?.payload.startedAt ??
          new Date(pending[0].createdAtMs).toISOString();
      }

      const cachedDetail = await runTx<CachedRecord<AssignmentDetail> | undefined>(
        STORE_ASSIGNMENT_DETAILS,
        "readonly",
        (tx) => reqToPromise(tx.objectStore(STORE_ASSIGNMENT_DETAILS).get(item.id))
      ).catch(() => undefined);

      if (cachedDetail?.data) {
        const stopsCompleted = cachedDetail.data.stops.filter(
          (s) => s.status === "COMPLETED" || s.status === "FAILED"
        ).length;
        if (
          cachedDetail.data.stops.length > 0 &&
          stopsCompleted >= cachedDetail.data.stops.length
        ) {
          nextStatus = "COMPLETED";
          nextCompletedAt =
            nextCompletedAt ?? new Date(pending[pending.length - 1].createdAtMs).toISOString();
        }
      }

      result.push({
        ...item,
        status: nextStatus,
        startedAt: nextStartedAt,
        completedAt: nextCompletedAt,
        pendingSyncCount: pending.length,
      });
    }

    return result;
  },

  async clearAllCaches(): Promise<void> {
    if (!isBrowserSupported()) return;
    await runTx(
      [STORE_ASSIGNMENTS_LIST, STORE_ASSIGNMENT_DETAILS, STORE_SYNC_OUTBOX],
      "readwrite",
      async (tx) => {
        await reqToPromise(tx.objectStore(STORE_ASSIGNMENTS_LIST).clear());
        await reqToPromise(tx.objectStore(STORE_ASSIGNMENT_DETAILS).clear());
        await reqToPromise(tx.objectStore(STORE_SYNC_OUTBOX).clear());
      }
    ).catch(() => {});
  },
};
