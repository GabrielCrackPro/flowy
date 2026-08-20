"use client";

import {
  onlineManager,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "@/components/shared/toast";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { enqueueOfflineMutation, PENDING_SYNC_FLAG } from "@/lib/offline";
import { invalidateEntityQueries as invalidateRegisteredEntityQueries } from "@/lib/query-invalidation";

function isRateLimitError(error: unknown): boolean {
  return (
    error instanceof Error &&
    "isRateLimit" in error &&
    (error as { isRateLimit: boolean }).isRateLimit === true
  );
}

interface EntityApiConfig<T, F, C, U> {
  queryKey: string;
  listApi: (filters?: F) => Promise<ListResponse<T> | T[]>;
  createApi: (data: C) => Promise<T>;
  updateApi: (id: string, data: U) => Promise<T>;
  deleteApi: (id: string) => Promise<void>;
  /** i18n key for the entity label used in success/error toasts (e.g. "common.transaction"). */
  entityName?: string;
  filters?: F;
  enabled?: boolean;
  invalidateDependentQueries?: boolean;
}

type ListResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type QueryData<T> = ListResponse<T> | T[] | undefined;

/** Optimistic-mutation context shared by the online/offline branches. */
interface EntityMutationContext<T> {
  previous: QueryData<T>;
  offline?: boolean;
  tempId?: string;
}

export function useEntityApi<T, F = undefined, C = unknown, U = unknown>({
  queryKey,
  listApi,
  createApi,
  updateApi,
  deleteApi,
  entityName,
  filters,
  enabled = true,
  invalidateDependentQueries = true,
}: EntityApiConfig<T, F, C, U>) {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { profile } = useProfile();
  const { user } = useAuth();
  const uid = user?.id;
  const activeSpaceId = profile?.activeSpaceId ?? null;

  const entityLabel = t(entityName ?? "common.element");

  // Refetch every query for this entity (any space, filter or view) plus the
  // queries that aggregate it, so no page keeps stale data after a mutation.
  const invalidateEntityQueries = useCallback(
    (client: typeof queryClient) => {
      invalidateRegisteredEntityQueries(client, queryKey, {
        includeDependencies: invalidateDependentQueries,
      });
    },
    [queryKey, invalidateDependentQueries],
  );

  const query = useQuery({
    queryKey: [queryKey, activeSpaceId, filters],
    queryFn: () => listApi(filters),
    enabled,
    staleTime: 10000, // Cache data for 10 seconds to avoid unnecessary refetches
    refetchOnReconnect: true, // Refresh data when the connection comes back
    refetchInterval: 60000, // Poll in the background to catch realtime misses
    refetchIntervalInBackground: false, // Only while the tab is visible
    gcTime: 10000, // Keep cache for 10 seconds after inactive
    placeholderData: (previousData) => previousData, // Keep previous data while loading new data
  });

  const createMutation = useMutation({
    mutationFn: async (data: C) => {
      if (onlineManager.isOnline() || !uid) return createApi(data);
      // Offline: never reach the network; the optimistic entry added in
      // onMutate is what the user sees until the queue flushes.
      return { [PENDING_SYNC_FLAG]: true } as T;
    },
    onMutate: async (
      data: C,
    ): Promise<EntityMutationContext<T> | undefined> => {
      if (onlineManager.isOnline() || !uid) return undefined;

      const tempId = crypto.randomUUID();
      const tempEntity = {
        id: tempId,
        ...(data as object),
        [PENDING_SYNC_FLAG]: true,
      } as T;

      try {
        await enqueueOfflineMutation({
          userId: uid,
          entityKey: queryKey,
          type: "create",
          input: data,
          tempId,
        });
      } catch {
        // IndexedDB unavailable — fail the mutation before touching the cache.
        throw new Error(t("offline.queueFailed"));
      }

      queryClient.setQueryData<QueryData<T>>(
        [queryKey, activeSpaceId, filters],
        (old) => {
          const oldArray = Array.isArray(old) ? old : (old?.data ?? []);
          if (Array.isArray(old)) return [tempEntity, ...oldArray];
          return {
            data: [tempEntity, ...oldArray],
            total: (old?.total ?? 0) + 1,
            page: old?.page ?? 1,
            limit: old?.limit ?? 50,
            totalPages: old?.totalPages ?? 1,
          };
        },
      );

      return {
        previous: queryClient.getQueryData<QueryData<T>>([
          queryKey,
          activeSpaceId,
          filters,
        ]),
        offline: true,
        tempId,
      };
    },
    onSuccess: (newEntity, _data, context) => {
      if (context?.offline) {
        toast.info(t("offline.savedLocally"));
        return;
      }

      queryClient.setQueryData<QueryData<T>>(
        [queryKey, activeSpaceId, filters],
        (old) => {
          const oldArray = Array.isArray(old) ? old : (old?.data ?? []);
          if (Array.isArray(old)) return [newEntity, ...oldArray];
          return {
            data: [newEntity, ...oldArray],
            total: (old?.total ?? 0) + 1,
            page: old?.page ?? 1,
            limit: old?.limit ?? 50,
            totalPages: old?.totalPages ?? 1,
          };
        },
      );
      toast.success(t("common.entityCreated", { entity: entityLabel }));

      // Refresh every view of this entity
      invalidateEntityQueries(queryClient);
    },
    onError: (error, _data, context) => {
      if (context?.offline) {
        queryClient.setQueryData<QueryData<T>>(
          [queryKey, activeSpaceId, filters],
          (old) => {
            const oldArray = Array.isArray(old) ? old : (old?.data ?? []);
            const filteredArray = oldArray.filter(
              (item) => (item as Record<string, unknown>).id !== context.tempId,
            );
            if (Array.isArray(old)) return filteredArray;
            return {
              data: filteredArray,
              total: Math.max(0, (old?.total ?? 0) - 1),
              page: old?.page ?? 1,
              limit: old?.limit ?? 50,
              totalPages: old?.totalPages ?? 1,
            };
          },
        );
        toast.error(t("offline.queueFailed"));
        return;
      }
      if (isRateLimitError(error)) {
        toast.warning(t("errors.rateLimit.message"));
        return;
      }
      toast.error(
        error instanceof Error ? error.message : t("common.errorCreating"),
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: U }) => {
      if (onlineManager.isOnline() || !uid) return updateApi(id, data);
      return { [PENDING_SYNC_FLAG]: true } as T;
    },
    onMutate: async ({
      id,
      data,
    }: {
      id: string;
      data: U;
    }): Promise<EntityMutationContext<T>> => {
      await queryClient.cancelQueries({
        queryKey: [queryKey, activeSpaceId, filters],
      });
      const previous = queryClient.getQueryData<QueryData<T>>([
        queryKey,
        activeSpaceId,
        filters,
      ]);

      if (!onlineManager.isOnline() && uid) {
        try {
          await enqueueOfflineMutation({
            userId: uid,
            entityKey: queryKey,
            type: "update",
            input: { id, data },
          });
        } catch {
          // IndexedDB unavailable — fail before touching the cache.
          throw new Error(t("offline.queueFailed"));
        }
        const offlineContext = { previous, offline: true };
        queryClient.setQueryData<QueryData<T>>(
          [queryKey, activeSpaceId, filters],
          (old) => {
            const oldArray = Array.isArray(old) ? old : (old?.data ?? []);
            const updatedArray = oldArray.map((item) =>
              (item as Record<string, unknown>).id === id
                ? ({ ...item, ...data, [PENDING_SYNC_FLAG]: true } as T)
                : item,
            );
            if (Array.isArray(old)) return updatedArray;
            return {
              data: updatedArray,
              total: old?.total ?? 0,
              page: old?.page ?? 1,
              limit: old?.limit ?? 50,
              totalPages: old?.totalPages ?? 1,
            };
          },
        );
        return offlineContext;
      }

      queryClient.setQueryData<QueryData<T>>(
        [queryKey, activeSpaceId, filters],
        (old) => {
          const oldArray = Array.isArray(old) ? old : (old?.data ?? []);
          const updatedArray = oldArray.map((item) =>
            (item as Record<string, unknown>).id === id
              ? ({ ...item, ...data } as T)
              : item,
          );
          if (Array.isArray(old)) return updatedArray;
          return {
            data: updatedArray,
            total: old?.total ?? 0,
            page: old?.page ?? 1,
            limit: old?.limit ?? 50,
            totalPages: old?.totalPages ?? 1,
          };
        },
      );

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context) {
        queryClient.setQueryData<QueryData<T>>(
          [queryKey, activeSpaceId, filters],
          context.previous,
        );
      }
      if (context?.offline) {
        toast.error(t("offline.queueFailed"));
        return;
      }
    },
    onSuccess: (entity, _variables, context) => {
      if (context?.offline) {
        toast.info(t("offline.savedLocally"));
        return;
      }

      queryClient.setQueryData<QueryData<T>>(
        [queryKey, activeSpaceId, filters],
        (old) => {
          const oldArray = Array.isArray(old) ? old : (old?.data ?? []);
          const updatedArray = oldArray.map((item) =>
            (item as Record<string, unknown>).id ===
            (entity as Record<string, unknown>).id
              ? entity
              : item,
          );
          if (Array.isArray(old)) return updatedArray;
          return {
            data: updatedArray,
            total: old?.total ?? 0,
            page: old?.page ?? 1,
            limit: old?.limit ?? 50,
            totalPages: old?.totalPages ?? 1,
          };
        },
      );

      // Refresh every view of this entity
      invalidateEntityQueries(queryClient);

      toast.success(t("common.entityUpdated", { entity: entityLabel }));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => {
      if (onlineManager.isOnline() || !uid) return deleteApi(id);
      return Promise.resolve();
    },
    onMutate: async (id: string): Promise<EntityMutationContext<T>> => {
      await queryClient.cancelQueries({
        queryKey: [queryKey, activeSpaceId, filters],
      });
      const previous = queryClient.getQueryData<QueryData<T>>([
        queryKey,
        activeSpaceId,
        filters,
      ]);

      if (!onlineManager.isOnline() && uid) {
        try {
          await enqueueOfflineMutation({
            userId: uid,
            entityKey: queryKey,
            type: "delete",
            input: id,
          });
        } catch {
          // IndexedDB unavailable — fail before touching the cache.
          throw new Error(t("offline.queueFailed"));
        }
        const offlineContext = { previous, offline: true };
        queryClient.setQueryData<QueryData<T>>(
          [queryKey, activeSpaceId, filters],
          (old) => {
            const oldArray = Array.isArray(old) ? old : (old?.data ?? []);
            const filteredArray = oldArray.filter(
              (item) => (item as Record<string, unknown>).id !== id,
            );
            if (Array.isArray(old)) return filteredArray;
            return {
              data: filteredArray,
              total: Math.max(0, (old?.total ?? 0) - 1),
              page: old?.page ?? 1,
              limit: old?.limit ?? 50,
              totalPages: old?.totalPages ?? 1,
            };
          },
        );
        return offlineContext;
      }

      queryClient.setQueryData<QueryData<T>>(
        [queryKey, activeSpaceId, filters],
        (old) => {
          const oldArray = Array.isArray(old) ? old : (old?.data ?? []);
          const filteredArray = oldArray.filter(
            (item) => (item as Record<string, unknown>).id !== id,
          );
          if (Array.isArray(old)) return filteredArray;
          return {
            data: filteredArray,
            total: Math.max(0, (old?.total ?? 0) - 1),
            page: old?.page ?? 1,
            limit: old?.limit ?? 50,
            totalPages: old?.totalPages ?? 1,
          };
        },
      );

      return { previous };
    },
    onSuccess: (_result, _variables, context) => {
      if (context?.offline) {
        toast.info(t("offline.savedLocally"));
        return;
      }
      toast.success(t("common.entityDeleted", { entity: entityLabel }));

      // Refresh every view of this entity
      invalidateEntityQueries(queryClient);
    },
    onError: (error, _variables, context) => {
      if (context) {
        queryClient.setQueryData<QueryData<T>>(
          [queryKey, activeSpaceId, filters],
          context.previous,
        );
      }
      if (context?.offline) {
        toast.error(t("offline.queueFailed"));
        return;
      }
      if (isRateLimitError(error)) {
        toast.warning(t("errors.rateLimit.message"));
        return;
      }
      toast.error(
        error instanceof Error ? error.message : t("common.errorDeleting"),
      );
    },
  });

  const create = useCallback(
    (data: C) => createMutation.mutateAsync(data),
    [createMutation],
  );

  const update = useCallback(
    (id: string, data: U) => updateMutation.mutateAsync({ id, data }),
    [updateMutation],
  );

  const remove = useCallback(
    (id: string) => deleteMutation.mutateAsync(id),
    [deleteMutation],
  );

  return {
    data: query.data as QueryData<T>,
    loading: query.isLoading,
    isLoading: query.isLoading,
    error: query.error,
    refresh: (newFilters?: F) => {
      if (newFilters) {
        queryClient.setQueryData(
          [queryKey, activeSpaceId, newFilters],
          query.data,
        );
        return queryClient.invalidateQueries({
          queryKey: [queryKey, activeSpaceId, newFilters],
        });
      }
      return query.refetch();
    },
    create,
    update,
    remove,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
