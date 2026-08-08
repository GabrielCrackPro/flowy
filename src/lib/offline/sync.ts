import type { QueryClient } from "@tanstack/react-query";
import { createBudget, deleteBudget, updateBudget } from "@/lib/api/budget";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/lib/api/category";
import { createGoal, deleteGoal, updateGoal } from "@/lib/api/goal";
import {
  createSubscription,
  deleteSubscription,
  updateSubscription,
} from "@/lib/api/subscription";
import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
} from "@/lib/api/transaction";
import { DEPENDENT_QUERY_KEYS } from "@/lib/entity-query-keys";
import {
  incrementMutationAttempt,
  listPendingMutations,
  markMutationFailed,
  type QueuedMutation,
  remapQueuedTempId,
  removePendingMutations,
  setLastSyncAt,
} from "./storage";

// Params are typed `never` so concrete API functions (with their real input
// types) remain assignable; callers cast at the call site (see `replay`).
interface EntityApis {
  create: (input: never) => Promise<unknown>;
  update: (id: string, input: never) => Promise<unknown>;
  delete: (id: string) => Promise<unknown>;
}

/** Maps `useEntityApi` query keys to the real API functions used for replay. */
const API_MAP: Record<string, EntityApis> = {
  transactions: {
    create: createTransaction,
    update: updateTransaction,
    delete: deleteTransaction,
  },
  budgets: {
    create: createBudget,
    update: updateBudget,
    delete: deleteBudget,
  },
  goals: {
    create: createGoal,
    update: updateGoal,
    delete: deleteGoal,
  },
  subscriptions: {
    create: createSubscription,
    update: updateSubscription,
    delete: deleteSubscription,
  },
  categories: {
    create: createCategory,
    update: updateCategory,
    delete: deleteCategory,
  },
};

/** Number of failed attempts before a mutation is parked as `failed`. */
const MAX_ATTEMPTS = 3;

/** Prevents concurrent flushes from the same tab. */
const flushingUsers = new Set<string>();

/**
 * Serialize flushes across tabs with the Web Locks API so two open Flowy
 * tabs can't replay the same queued mutation (e.g. create the same
 * transaction twice) when they come back online together.
 */
async function withSyncLock<T>(
  userId: string,
  fn: () => Promise<T>,
): Promise<T | null> {
  if (typeof navigator === "undefined" || !("locks" in navigator)) {
    return fn();
  }
  return navigator.locks.request(
    `flowy-offline-sync-${userId}`,
    { ifAvailable: true },
    fn,
  );
}

export interface FlushResult {
  synced: number;
  failed: number;
}

/**
 * Replay all pending offline mutations for a user in FIFO order.
 * Successful replays are removed from the queue; failures stay queued and
 * count attempts (after {@link MAX_ATTEMPTS} the mutation is parked as
 * `failed` and reported to the UI). Affected entity views are invalidated so
 * real server data replaces the optimistic entries.
 */
export async function flushOfflineQueue(
  userId: string,
  queryClient: QueryClient,
): Promise<FlushResult> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { synced: 0, failed: 0 };
  }
  if (flushingUsers.has(userId)) {
    return { synced: 0, failed: 0 };
  }

  // Cross-tab guard: if another tab is already flushing, don't replay the
  // queue here — but refresh the affected views so this tab's optimistic
  // entries are replaced by real server data once the other tab's replay
  // lands.
  const locked = await withSyncLock(userId, () =>
    flushUnlocked(userId, queryClient),
  );
  if (locked) return locked;

  const pending = await listPendingMutations(userId);
  for (const mutation of pending) {
    invalidateEntityKeys(queryClient, mutation.entityKey);
  }
  return { synced: 0, failed: 0 };
}

async function flushUnlocked(
  userId: string,
  queryClient: QueryClient,
): Promise<FlushResult> {
  if (flushingUsers.has(userId)) {
    return { synced: 0, failed: 0 };
  }

  flushingUsers.add(userId);
  try {
    const pending = await listPendingMutations(userId);
    if (pending.length === 0) return { synced: 0, failed: 0 };

    const affectedKeys = new Set<string>();
    let synced = 0;
    let failed = 0;

    for (const mutation of pending) {
      const apis = API_MAP[mutation.entityKey];
      if (!apis) {
        // Entity no longer supported — drop the stale entry.
        await removePendingMutations(userId, [mutation.id]);
        continue;
      }
      affectedKeys.add(mutation.entityKey);

      try {
        await replay(mutation, apis);
        await removePendingMutations(userId, [mutation.id]);
        synced += 1;
      } catch {
        failed += 1;
        if (mutation.attempts >= MAX_ATTEMPTS) {
          await markMutationFailed(userId, mutation.id);
        } else {
          await incrementMutationAttempt(userId, mutation.id);
        }
      }
    }

    if (affectedKeys.size > 0) {
      for (const key of affectedKeys) {
        invalidateEntityKeys(queryClient, key);
      }
      await setLastSyncAt(userId, Date.now());
    }

    return { synced, failed };
  } finally {
    flushingUsers.delete(userId);
  }
}

function invalidateEntityKeys(
  queryClient: QueryClient,
  entityKey: string,
): void {
  queryClient.invalidateQueries({ queryKey: [entityKey] });
  for (const dependent of DEPENDENT_QUERY_KEYS[entityKey] ?? []) {
    queryClient.invalidateQueries({ queryKey: [dependent] });
  }
}

async function replay(
  mutation: QueuedMutation,
  apis: EntityApis,
): Promise<void> {
  if (mutation.type === "create") {
    // At-least-once semantics: if the request reaches the server but the
    // response is lost, the retry duplicates the record. Accepted for v1;
    // an idempotency key would close this gap.
    const created = await apis.create(mutation.input as never);
    // Point later queued updates/deletes at the real id, not the temp id.
    if (mutation.tempId) {
      const serverId = (created as { id?: unknown } | undefined)?.id;
      if (typeof serverId === "string" && serverId !== mutation.tempId) {
        await remapQueuedTempId(mutation.userId, mutation.tempId, serverId);
      }
    }
  } else if (mutation.type === "update") {
    const { id, data } = mutation.input as { id: string; data: unknown };
    await apis.update(id, data as never);
  } else {
    await apis.delete(mutation.input as never);
  }
}
