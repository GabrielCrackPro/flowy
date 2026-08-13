"use client";

import { useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { REALTIME_QUERY_KEYS } from "@/lib/entity-query-keys";
import supabase from "@/lib/supabase/client";

// Coalesce bursts of changes (e.g. bulk imports) into a single refetch.
const SYNC_DELAY_MS = 300;

const SPACE_SCOPED_TABLES = [
  "transactions",
  "budgets",
  "goals",
  "subscriptions",
  "categories",
  "comments",
  "activities",
] as const;

const USER_SCOPED_TABLES = ["push_subscriptions", "push_deliveries"] as const;

interface SyncRow {
  id?: string;
  user_id?: string | null;
  space_id?: string | null;
}

interface RealtimeChangePayload {
  new?: SyncRow | null;
  old?: SyncRow | null;
}

export function RealtimeSyncProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const queryClient = useQueryClient();
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const userId = user?.id;
  const activeSpaceId = profile?.activeSpaceId ?? null;

  useEffect(() => {
    if (!userId) return;

    const scheduleInvalidation = (keys: string[]) => {
      for (const key of keys) {
        if (timersRef.current.has(key)) continue;
        const timer = setTimeout(() => {
          timersRef.current.delete(key);
          void queryClient.invalidateQueries({ queryKey: [key] });
        }, SYNC_DELAY_MS);
        timersRef.current.set(key, timer);
      }
    };

    const handleChange = (table: string, payload: RealtimeChangePayload) => {
      const row = payload.new ?? payload.old;
      if (!row) return;

      if (table === "profiles") {
        if (row.id !== userId) return;
        scheduleInvalidation(REALTIME_QUERY_KEYS.profiles);
        return;
      }

      if (
        USER_SCOPED_TABLES.includes(
          table as (typeof USER_SCOPED_TABLES)[number],
        )
      ) {
        if (row.user_id !== userId) return;
        scheduleInvalidation(REALTIME_QUERY_KEYS[table] ?? []);
        return;
      }

      // The membership channel is filtered to the current user, and its
      // space_id can refer to an inactive space. Refresh the space switcher
      // and profile regardless of the currently selected space.
      if (table === "space_members") {
        scheduleInvalidation(REALTIME_QUERY_KEYS.space_members);
        return;
      }

      // Realtime bypasses RLS, so accept only rows belonging to the active
      // space. This guard applies to inserts, updates, and deletes.
      if (!activeSpaceId || row.space_id !== activeSpaceId) return;
      scheduleInvalidation(REALTIME_QUERY_KEYS[table] ?? []);
    };

    let channel = supabase.channel(`data-sync-${userId}-${activeSpaceId}`);

    if (activeSpaceId) {
      for (const table of SPACE_SCOPED_TABLES) {
        channel = channel.on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table,
            filter: `space_id=eq.${activeSpaceId}`,
          },
          (payload) =>
            handleChange(table, payload as unknown as RealtimeChangePayload),
        );
      }
    }

    channel = channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "space_members",
        filter: `user_id=eq.${userId}`,
      },
      (payload) =>
        handleChange(
          "space_members",
          payload as unknown as RealtimeChangePayload,
        ),
    );

    channel = channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "profiles",
        filter: `id=eq.${userId}`,
      },
      (payload) =>
        handleChange("profiles", payload as unknown as RealtimeChangePayload),
    );

    for (const table of USER_SCOPED_TABLES) {
      channel = channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: `user_id=eq.${userId}`,
        },
        (payload) =>
          handleChange(table, payload as unknown as RealtimeChangePayload),
      );
    }

    channel = channel.subscribe();

    return () => {
      timersRef.current.forEach((timer) => {
        clearTimeout(timer);
      });
      timersRef.current.clear();
      void supabase.removeChannel(channel);
    };
  }, [userId, activeSpaceId, queryClient]);

  return children;
}
