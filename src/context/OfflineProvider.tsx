"use client";

// Background Sync API types (not yet in TS lib by default)
declare global {
  interface SyncManager {
    register(tag: string): Promise<void>;
    getTags(): Promise<string[]>;
  }
}

import { onlineManager, useQueryClient } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/components/shared/toast";
import { useAuth } from "@/hooks/useAuth";
import { createOfflinePersister } from "@/lib/offline/persister";
import {
  countPendingMutations,
  getLastSyncAt,
  purgeUserOfflineData,
  storeAuthSession,
  subscribeOfflineChanges,
} from "@/lib/offline/storage";
import { type FlushResult, flushOfflineQueue } from "@/lib/offline/sync";

/** How long a persisted cache is considered valid (30 days). */
const CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;
/** Bumps to invalidate old caches when the persistence format changes. */
const CACHE_BUSTER = "flowy-offline-v1";

interface OfflineContextValue {
  isOnline: boolean;
  pendingCount: number;
  lastSyncAt: number | null;
  flushing: boolean;
  /** Increments on every successful flush, so the UI can pulse on sync. */
  lastSyncEventId: number | null;
  retrySync: () => Promise<FlushResult>;
}

const OfflineContext = createContext<OfflineContextValue | undefined>(
  undefined,
);

/**
 * Owns the offline experience:
 *  - persists the React Query cache per user (restored on next visit),
 *  - flushes queued offline mutations when the connection returns,
 *  - clears the in-memory cache on account switches and purges the previous
 *    user's persisted offline data on sign-out.
 */
export function OfflineProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { user, session } = useAuth();
  const { t } = useTranslation();
  const userId = user?.id ?? null;

  const userIdRef = useRef(userId);
  userIdRef.current = userId;

  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [flushing, setFlushing] = useState(false);
  const [lastSyncEventId, setLastSyncEventId] = useState<number | null>(null);
  const syncEventCounterRef = useRef(0);

  const handleFlushResult = useCallback(
    (result: FlushResult) => {
      if (result.synced > 0) {
        toast.success(t("offline.synced", { count: result.synced }));
        // Bump a monotonically increasing id so the indicator can pulse even
        // when two flushes land in the same millisecond.
        syncEventCounterRef.current += 1;
        setLastSyncEventId(syncEventCounterRef.current);
      } else if (result.failed > 0) {
        toast.error(t("offline.syncFailed"));
      }
    },
    [t],
  );

  const flush = useCallback((): Promise<FlushResult> => {
    const uid = userIdRef.current;
    if (!uid) return Promise.resolve({ synced: 0, failed: 0 });
    setFlushing(true);
    return flushOfflineQueue(uid, queryClient)
      .then((result) => {
        handleFlushResult(result);
        return result;
      })
      .finally(() => setFlushing(false));
  }, [queryClient, handleFlushResult]);

  // Track connectivity (React Query's onlineManager stays in sync with the
  // browser) and replay queued mutations the moment we're back online.
  useEffect(() => {
    const unsubscribe = onlineManager.subscribe((online) => {
      setIsOnline(online);
      if (online && userIdRef.current) {
        void flush();
      }
    });
    setIsOnline(onlineManager.isOnline());
    return unsubscribe;
  }, [flush]);

  // Pending count + last sync, refreshed whenever the offline store changes.
  useEffect(() => {
    if (!userId) {
      setPendingCount(0);
      setLastSyncAt(null);
      return;
    }
    let active = true;
    const refresh = async () => {
      const [count, lastSync] = await Promise.all([
        countPendingMutations(userId),
        getLastSyncAt(userId),
      ]);
      if (active) {
        setPendingCount(count);
        setLastSyncAt(lastSync ?? null);
      }
    };
    void refresh();
    const unsubscribe = subscribeOfflineChanges(() => void refresh());
    return () => {
      active = false;
      unsubscribe();
    };
  }, [userId]);

  // Account lifecycle: drop the in-memory cache on account switches and
  // delete the previous account's persisted offline data on sign-out.
  const prevUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    const prev = prevUserIdRef.current;
    if (prev && prev !== userId) {
      // Cancel in-flight requests before clearing so a response for the
      // previous account can't land in the cache after the switch and leak
      // into the next session on a shared device.
      queryClient.cancelQueries();
      queryClient.clear();
      if (!userId) {
        void purgeUserOfflineData(prev);
      }
    }
    prevUserIdRef.current = userId;
  }, [userId, queryClient]);

  // Per-user cache persistence: restore on mount / account switch, then keep
  // a live subscription so the last-known data survives reloads and offline.
  useEffect(() => {
    if (!userId) return;

    const [unsubscribe, restorePromise] = persistQueryClient({
      queryClient,
      persister: createOfflinePersister(userId),
      maxAge: CACHE_MAX_AGE_MS,
      buster: CACHE_BUSTER,
      dehydrateOptions: {
        // Only persist successfully-loaded GET data — never error/pending
        // states or transient mutations. A missing/corrupt stored cache
        // simply restores to an empty cache (the server is the source of
        // truth).
        shouldDehydrateQuery: (query) =>
          query.state.status === "success" && query.state.data !== undefined,
        shouldDehydrateMutation: () => false,
      },
    });

    void restorePromise.then(() => {
      if (onlineManager.isOnline() && userIdRef.current === userId) {
        void flush();
      }
    });

    return unsubscribe;
  }, [userId, queryClient, flush]);

  // Store the Supabase session in IndexedDB so the service worker can
  // access it for background sync when no client tab is open.
  useEffect(() => {
    if (userId && session?.access_token) {
      void storeAuthSession({
        accessToken: session.access_token,
        expiresAt: session.expires_at ?? Date.now() / 1000 + 3600,
        userId,
      });
    }
  }, [userId, session?.access_token, session?.expires_at]);

  // Register a background sync tag so the service worker replays the
  // offline queue when connectivity returns — even with the app closed.
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (!("SyncManager" in window)) return;

    void navigator.serviceWorker.ready.then((reg) => {
      const sync = (reg as ServiceWorkerRegistration & { sync?: SyncManager })
        .sync;
      if (sync) {
        void sync.register("flowy-offline-queue").catch(() => {
          // sync not supported or permission denied — no-op
        });
      }
    });
  }, []);

  // Re-register sync whenever pendingCount changes (new offline mutations)
  useEffect(() => {
    if (pendingCount === 0) return;
    if (!("serviceWorker" in navigator)) return;
    if (!("SyncManager" in window)) return;

    void navigator.serviceWorker.ready.then((reg) => {
      const sync = (reg as ServiceWorkerRegistration & { sync?: SyncManager })
        .sync;
      if (sync) {
        void sync.register("flowy-offline-queue").catch(() => undefined);
      }
    });
  }, [pendingCount]);

  const value = useMemo(
    () => ({
      isOnline,
      pendingCount,
      lastSyncAt,
      flushing,
      lastSyncEventId,
      retrySync: flush,
    }),
    [isOnline, pendingCount, lastSyncAt, flushing, lastSyncEventId, flush],
  );

  return (
    <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>
  );
}

export function useOfflineStatus(): OfflineContextValue {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error("useOfflineStatus must be used within an OfflineProvider");
  }
  return context;
}
