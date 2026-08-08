"use client";

import { useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import supabase from "@/lib/supabase/client";

// Coalesce bursts of changes (e.g. bulk imports) into a single refetch.
const SYNC_DELAY_MS = 300;

// Query key prefixes invalidated per table change. Mirrors the dependent-key
// mapping in useEntityApi so every view of an entity refreshes on remote writes.
const TABLE_QUERY_KEYS: Record<string, string[]> = {
  transactions: [
    "transactions",
    "transaction",
    "dashboard",
    "activities",
    "notifications",
    "budgets",
  ],
  budgets: ["budgets", "dashboard", "notifications"],
  goals: ["goals", "dashboard", "notifications"],
  subscriptions: ["subscriptions", "dashboard", "notifications"],
  categories: ["categories", "transactions", "budgets", "dashboard"],
  space_members: ["spaces", "profile"],
};

interface SyncRow {
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
    if (!userId || !activeSpaceId) return;

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

      // The space_members channel is already filtered to the current user, and
      // its space_id refers to a space the user may not have active yet.
      if (table === "space_members") {
        scheduleInvalidation(TABLE_QUERY_KEYS.space_members);
        return;
      }

      // Realtime ignores RLS, so only accept events for the active space.
      if (row.space_id !== activeSpaceId) return;
      scheduleInvalidation(TABLE_QUERY_KEYS[table] ?? []);
    };

    const channel = supabase
      .channel(`data-sync-${userId}-${activeSpaceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `space_id=eq.${activeSpaceId}`,
        },
        (payload) => handleChange("transactions", payload),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "budgets",
          filter: `space_id=eq.${activeSpaceId}`,
        },
        (payload) => handleChange("budgets", payload),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "goals",
          filter: `space_id=eq.${activeSpaceId}`,
        },
        (payload) => handleChange("goals", payload),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subscriptions",
          filter: `space_id=eq.${activeSpaceId}`,
        },
        (payload) => handleChange("subscriptions", payload),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "categories",
          filter: `space_id=eq.${activeSpaceId}`,
        },
        (payload) => handleChange("categories", payload),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "space_members",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => handleChange("space_members", payload),
      )
      .subscribe();

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
