"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "@/components/shared/toast";
import { useProfile } from "@/hooks/useProfile";

interface EntityApiConfig<T, F, C, U> {
  queryKey: string;
  listApi: (filters?: F) => Promise<ListResponse<T> | T[]>;
  createApi: (data: C) => Promise<T>;
  updateApi: (id: string, data: U) => Promise<T>;
  deleteApi: (id: string) => Promise<void>;
  entityName?: string;
  filters?: F;
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

// Detail queries that live under a singular key (e.g. ["transaction", ...])
// while the list uses the plural prefix.
const SINGULAR_QUERY_KEYS: Record<string, string> = {
  transactions: "transaction",
};

// Other views that aggregate this entity's data and must refresh on mutation.
const DEPENDENT_QUERY_KEYS: Record<string, string[]> = {
  transactions: ["dashboard", "activities", "notifications", "budgets"],
  budgets: ["dashboard", "notifications"],
  goals: ["dashboard", "notifications"],
  subscriptions: ["dashboard", "notifications"],
  categories: ["transactions", "budgets", "dashboard"],
};

export function useEntityApi<T, F = undefined, C = unknown, U = unknown>({
  queryKey,
  listApi,
  createApi,
  updateApi,
  deleteApi,
  entityName,
  filters,
  invalidateDependentQueries = true,
}: EntityApiConfig<T, F, C, U>) {
  const queryClient = useQueryClient();
  const { profile } = useProfile();
  const activeSpaceId = profile?.activeSpaceId ?? null;

  // Refetch every query for this entity (any space, filter or view) plus the
  // queries that aggregate it, so no page keeps stale data after a mutation.
  const invalidateEntityQueries = useCallback(
    (client: typeof queryClient) => {
      client.invalidateQueries({ queryKey: [queryKey] });
      const singular = SINGULAR_QUERY_KEYS[queryKey];
      if (singular) {
        client.invalidateQueries({ queryKey: [singular] });
      }

      if (invalidateDependentQueries) {
        (DEPENDENT_QUERY_KEYS[queryKey] ?? []).forEach((key) => {
          client.invalidateQueries({ queryKey: [key] });
        });
      }
    },
    [queryKey, invalidateDependentQueries],
  );

  const query = useQuery({
    queryKey: [queryKey, activeSpaceId, filters],
    queryFn: () => listApi(filters),
    staleTime: 10000, // Cache data for 10 seconds to avoid unnecessary refetches
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnReconnect: false, // Don't refetch on reconnect if data is fresh
    gcTime: 10000, // Keep cache for 10 seconds after inactive
    placeholderData: (previousData) => previousData, // Keep previous data while loading new data
  });

  const createMutation = useMutation({
    mutationFn: createApi,
    onSuccess: (newEntity) => {
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
      toast.success(`${entityName ?? "Elemento"} creado correctamente`);

      // Refresh every view of this entity
      invalidateEntityQueries(queryClient);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al crear");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: U }) => updateApi(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({
        queryKey: [queryKey, activeSpaceId, filters],
      });
      const previous = queryClient.getQueryData<QueryData<T>>([
        queryKey,
        activeSpaceId,
        filters,
      ]);

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
    onError: (error, _variables, context) => {
      queryClient.setQueryData<QueryData<T>>(
        [queryKey, activeSpaceId, filters],
        context?.previous,
      );
    },
    onSuccess: (entity) => {
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

      toast.success(`${entityName ?? "Elemento"} actualizado correctamente`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteApi,
    onMutate: async (id) => {
      await queryClient.cancelQueries({
        queryKey: [queryKey, activeSpaceId, filters],
      });
      const previous = queryClient.getQueryData<QueryData<T>>([
        queryKey,
        activeSpaceId,
        filters,
      ]);

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
    onSuccess: () => {
      toast.success(`${entityName ?? "Elemento"} eliminado correctamente`);

      // Refresh every view of this entity
      invalidateEntityQueries(queryClient);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Error al eliminar");
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
