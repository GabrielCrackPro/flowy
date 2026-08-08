"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";

import { useAuth } from "@/hooks/useAuth";
import { ensureProfile, getProfile, updateProfile } from "@/lib/api/profile";
import type { Profile } from "@/types/Profile";

export interface ProfileContextValue {
  profile: Profile | null;
  loading: boolean;
  error: string | null;

  refresh: () => Promise<void>;

  update: (values: Partial<Omit<Profile, "id" | "createdAt">>) => Promise<void>;
}

export const ProfileContext = createContext<ProfileContextValue | undefined>(
  undefined,
);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: () => {
      if (!user?.id) throw new Error("No hay un usuario autenticado.");
      return getProfile(user.id);
    },
    enabled: !!user?.id,
    retry: false,
  });

  const updateMutation = useMutation({
    mutationFn: (values: Partial<Omit<Profile, "id" | "createdAt">>) => {
      if (!user?.id) throw new Error("No hay un usuario autenticado.");
      return updateProfile(user.id, values);
    },
    onSuccess: (profile) => {
      queryClient.setQueryData(["profile", user?.id], profile);
    },
  });

  const refresh = useCallback(async () => {
    if (!user?.id) {
      queryClient.setQueryData(["profile", user?.id], null);
      return;
    }

    try {
      await query.refetch();
    } catch {
      // Error handled by query
    }
  }, [user?.id, query, queryClient]);

  const update = useCallback(
    async (values: Partial<Omit<Profile, "id" | "createdAt">>) => {
      if (!user?.id) {
        throw new Error("No hay un usuario autenticado.");
      }

      await updateMutation.mutateAsync(values);
    },
    [user?.id, updateMutation],
  );

  useEffect(() => {
    if (!user?.id) {
      queryClient.setQueryData(["profile", user?.id], null);
      return;
    }

    const loadProfile = async () => {
      try {
        await query.refetch();
      } catch {
        try {
          const profile = await ensureProfile();
          queryClient.setQueryData(["profile", user?.id], profile);
        } catch {
          // Error already stored in query.error
        }
      }
    };

    loadProfile().catch(() => {
      // Avoid unhandled promise rejection.
    });
  }, [user?.id, query, queryClient]);

  const value = useMemo(
    () => ({
      profile: query.data as Profile | null,
      loading: query.isLoading,
      error: query.error instanceof Error ? query.error.message : null,
      refresh,
      update,
    }),
    [query.data, query.isLoading, query.error, refresh, update],
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfileContext() {
  const context = useContext(ProfileContext);

  if (!context) {
    throw new Error("useProfileContext must be used within a ProfileProvider");
  }

  return context;
}
