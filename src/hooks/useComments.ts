"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "@/components/shared/toast";
import { useProfile } from "@/hooks/useProfile";
import { commentApi } from "@/lib/api/comment";
import type { Comment, CreateCommentInput } from "@/types/Comment";

export function useComments(entityType: string, entityId: string | null) {
  const queryClient = useQueryClient();
  const { profile } = useProfile();
  const activeSpaceId = profile?.activeSpaceId ?? null;

  const queryKey = ["comments", activeSpaceId, entityType, entityId];

  const query = useQuery({
    queryKey,
    queryFn: () => commentApi.list(entityType, entityId ?? ""),
    enabled: !!entityType && !!entityId,
  });

  const addCommentMutation = useMutation({
    mutationFn: (data: { content: string; parentId?: string | null }) =>
      commentApi.create({
        entityType: entityType as CreateCommentInput["entityType"],
        entityId: entityId ?? "",
        content: data.content,
        parentId: data.parentId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Comentario añadido");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Error al añadir comentario",
      );
    },
  });

  const editCommentMutation = useMutation({
    mutationFn: (data: { id: string; content: string }) =>
      commentApi.update(data.id, { content: data.content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Comentario actualizado");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al actualizar comentario",
      );
    },
  });

  const removeCommentMutation = useMutation({
    mutationFn: (id: string) => commentApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Comentario eliminado");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Error al eliminar comentario",
      );
    },
  });

  const addComment = useCallback(
    (content: string, parentId?: string | null) => {
      return addCommentMutation.mutateAsync({ content, parentId });
    },
    [addCommentMutation],
  );

  const editComment = useCallback(
    (id: string, content: string) => {
      return editCommentMutation.mutateAsync({ id, content });
    },
    [editCommentMutation],
  );

  const removeComment = useCallback(
    (id: string) => {
      return removeCommentMutation.mutateAsync(id);
    },
    [removeCommentMutation],
  );

  return {
    comments: (query.data as Comment[] | undefined) ?? [],
    loading: query.isLoading,
    busy:
      addCommentMutation.isPending ||
      editCommentMutation.isPending ||
      removeCommentMutation.isPending,
    error: query.error,
    refresh: () => query.refetch(),
    addComment,
    editComment,
    removeComment,
  };
}
