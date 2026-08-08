/**
 * Flag stamped on optimistic entries in the query cache when an entity was
 * created or edited while offline. The real server entity replaces the entry
 * after the mutation queue flushes.
 */
export const PENDING_SYNC_FLAG = "_pendingSync";

/** True when `entity` is an optimistic local entry waiting to sync. */
export function isPendingSync(entity: unknown): boolean {
  return (
    typeof entity === "object" &&
    entity !== null &&
    (entity as Record<string, unknown>)[PENDING_SYNC_FLAG] === true
  );
}
