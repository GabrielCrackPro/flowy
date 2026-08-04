import type {
  Comment,
  CreateCommentInput,
  UpdateCommentInput,
} from "@/types/Comment";
import { authenticatedRequest } from "./client";

export const commentApi = {
  list: (entityType: string, entityId: string) =>
    authenticatedRequest<Comment[]>(
      `/api/comment?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`,
    ),

  create: (data: CreateCommentInput) =>
    authenticatedRequest<Comment>("/api/comment", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: string, data: UpdateCommentInput) =>
    authenticatedRequest<Comment>(`/api/comment/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    authenticatedRequest<void>(`/api/comment/${id}`, {
      method: "DELETE",
    }),
};
