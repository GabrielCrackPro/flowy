import type { PersistedClient } from "@tanstack/query-persist-client-core";

/**
 * Offline storage for Flowy, isolated per user.
 *
 * Every signed-in user gets their own IndexedDB database
 * (`flowy-offline-<userId>`) so one account's finances can never be read by
 * another account on a shared device. The database is deleted entirely on
 * sign-out via {@link purgeUserOfflineData}.
 *
 * Stores:
 *  - `cache`:  the dehydrated React Query cache (a single `PersistedClient`).
 *  - `queue`:  pending mutations created while offline, keyed by id.
 *  - `meta`:   sync metadata (e.g. last successful sync timestamp).
 */

const DB_VERSION = 1;
const STORE_CACHE = "cache";
const STORE_QUEUE = "queue";
const STORE_META = "meta";

const CACHE_KEY = "client";
const META_LAST_SYNC = "lastSyncAt";

export type OfflineMutationType = "create" | "update" | "delete";
export type OfflineMutationStatus = "pending" | "failed";

export interface QueuedMutation {
  id: string;
  userId: string;
  entityKey: string;
  type: OfflineMutationType;
  /** `create`: input; `update`: `{ id, data }`; `delete`: id. */
  input: unknown;
  /** Client-generated id used for the optimistic cache entry of a create. */
  tempId?: string;
  createdAt: number;
  attempts: number;
  status: OfflineMutationStatus;
}

type ChangeListener = () => void;

const listeners = new Set<ChangeListener>();

/** Subscribe to queue/meta changes (used by the UI to refresh pending counts). */
export function subscribeOfflineChanges(listener: ChangeListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emitOfflineChanges(): void {
  for (const listener of listeners) {
    try {
      listener();
    } catch {
      // A failing listener must not break the rest.
    }
  }
}

function dbName(userId: string): string {
  return `flowy-offline-${userId}`;
}

function openDb(userId: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName(userId), DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_CACHE)) {
        db.createObjectStore(STORE_CACHE);
      }
      if (!db.objectStoreNames.contains(STORE_QUEUE)) {
        const store = db.createObjectStore(STORE_QUEUE, { keyPath: "id" });
        store.createIndex("status", "status", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("IndexedDB open failed"));
  });
}

async function withDb<T>(
  userId: string,
  fn: (db: IDBDatabase) => Promise<T>,
): Promise<T> {
  const db = await openDb(userId);
  try {
    return await fn(db);
  } finally {
    db.close();
  }
}

function txResult<T>(
  db: IDBDatabase,
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const request = fn(transaction.objectStore(storeName));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("IndexedDB transaction failed"));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
  });
}

/** Run multiple operations on one store inside a single transaction. */
function runInTransaction(
  db: IDBDatabase,
  storeName: string,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    try {
      fn(store);
    } catch (error) {
      transaction.abort();
      reject(error instanceof Error ? error : new Error(String(error)));
      return;
    }
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction failed"));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
  });
}

/* ------------------------------------------------------------------ */
/* Query cache (PersistedClient)                                      */
/* ------------------------------------------------------------------ */

export function getPersistedClient(
  userId: string,
): Promise<PersistedClient | undefined> {
  return withDb(userId, (db) =>
    txResult(db, STORE_CACHE, "readonly", (store) => store.get(CACHE_KEY)),
  );
}

export function setPersistedClient(
  userId: string,
  client: PersistedClient,
): Promise<void> {
  return withDb(userId, (db) =>
    txResult(db, STORE_CACHE, "readwrite", (store) =>
      store.put(client, CACHE_KEY),
    ).then(() => undefined),
  );
}

export function removePersistedClient(userId: string): Promise<void> {
  return withDb(userId, (db) =>
    txResult(db, STORE_CACHE, "readwrite", (store) =>
      store.delete(CACHE_KEY),
    ).then(() => undefined),
  );
}

/* ------------------------------------------------------------------ */
/* Mutation queue                                                     */
/* ------------------------------------------------------------------ */

export function enqueueOfflineMutation(
  mutation: Omit<QueuedMutation, "id" | "createdAt" | "attempts" | "status">,
): Promise<void> {
  const queued: QueuedMutation = {
    ...mutation,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    attempts: 0,
    status: "pending",
  };
  return withDb(queued.userId, (db) =>
    txResult(db, STORE_QUEUE, "readwrite", (store) => store.add(queued)).then(
      () => {
        emitOfflineChanges();
      },
    ),
  );
}

export function listPendingMutations(
  userId: string,
): Promise<QueuedMutation[]> {
  return withDb(userId, async (db) => {
    const all = await txResult(db, STORE_QUEUE, "readonly", (store) =>
      store.getAll(),
    );
    return all.sort((a, b) => a.createdAt - b.createdAt);
  });
}

export async function countPendingMutations(userId: string): Promise<number> {
  const pending = await listPendingMutations(userId);
  return pending.length;
}

export function removePendingMutations(
  userId: string,
  ids: string[],
): Promise<void> {
  if (ids.length === 0) return Promise.resolve();
  return withDb(userId, (db) =>
    runInTransaction(db, STORE_QUEUE, "readwrite", (store) => {
      for (const id of ids) {
        store.delete(id);
      }
    }).then(() => {
      emitOfflineChanges();
    }),
  );
}

export function incrementMutationAttempt(
  userId: string,
  id: string,
): Promise<void> {
  return withDb(userId, (db) =>
    runInTransaction(db, STORE_QUEUE, "readwrite", (store) => {
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const existing = getRequest.result as QueuedMutation | undefined;
        if (existing) {
          store.put({ ...existing, attempts: existing.attempts + 1 });
        }
      };
    }),
  );
}

/**
 * After a queued `create` flushes, rewrite any queued update/delete that
 * still references the optimistic temp id so it targets the real server id
 * instead of failing forever against a record that never existed.
 */
export function remapQueuedTempId(
  userId: string,
  tempId: string,
  serverId: string,
): Promise<void> {
  return withDb(userId, (db) =>
    runInTransaction(db, STORE_QUEUE, "readwrite", (store) => {
      const getAllRequest = store.getAll();
      getAllRequest.onsuccess = () => {
        const all = getAllRequest.result as QueuedMutation[];
        for (const existing of all) {
          if (existing.type === "delete" && existing.input === tempId) {
            store.put({ ...existing, input: serverId });
          } else if (existing.type === "update") {
            const { id, data } = existing.input as {
              id: string;
              data: unknown;
            };
            if (id === tempId) {
              store.put({ ...existing, input: { id: serverId, data } });
            }
          }
        }
      };
    }).then(() => {
      emitOfflineChanges();
    }),
  );
}

export function markMutationFailed(userId: string, id: string): Promise<void> {
  return withDb(userId, (db) =>
    runInTransaction(db, STORE_QUEUE, "readwrite", (store) => {
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const existing = getRequest.result as QueuedMutation | undefined;
        if (existing) {
          store.put({ ...existing, status: "failed" });
        }
      };
    }).then(() => {
      emitOfflineChanges();
    }),
  );
}

/* ------------------------------------------------------------------ */
/* Sync metadata                                                      */
/* ------------------------------------------------------------------ */

export function getLastSyncAt(userId: string): Promise<number | undefined> {
  return withDb(userId, (db) =>
    txResult(db, STORE_META, "readonly", (store) => store.get(META_LAST_SYNC)),
  );
}

export function setLastSyncAt(
  userId: string,
  timestamp: number,
): Promise<void> {
  return withDb(userId, (db) =>
    txResult(db, STORE_META, "readwrite", (store) =>
      store.put(timestamp, META_LAST_SYNC),
    ).then(() => {
      emitOfflineChanges();
    }),
  );
}

/* ------------------------------------------------------------------ */
/* Purge (sign-out)                                                   */
/* ------------------------------------------------------------------ */

/** Delete the entire offline database for a user (called on sign-out). */
export function purgeUserOfflineData(userId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(dbName(userId));
    request.onsuccess = () => {
      emitOfflineChanges();
      resolve();
    };
    request.onerror = () =>
      reject(request.error ?? new Error("Failed to purge offline data"));
    // If other connections are open the delete is queued; treat as success.
    request.onblocked = () => resolve();
  });
}
