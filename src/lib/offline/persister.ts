import type { Persister } from "@tanstack/query-persist-client-core";
import {
  getPersistedClient,
  removePersistedClient,
  setPersistedClient,
} from "./storage";

/**
 * Build a TanStack `Persister` bound to a single user's offline database.
 * Re-create it when the signed-in user changes so each account only ever
 * restores and persists its own cache.
 */
export function createOfflinePersister(userId: string): Persister {
  return {
    persistClient: (client) => setPersistedClient(userId, client),
    restoreClient: () => getPersistedClient(userId),
    removeClient: () => removePersistedClient(userId),
  };
}
