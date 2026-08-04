import { z } from "zod/v4";

const commentEntityType = z.enum([
  "transaction",
  "goal",
  "budget",
  "subscription",
]);
export type CommentEntityType = z.infer<typeof commentEntityType>;

export const createCommentSchema = z.object({
  entityType: commentEntityType,
  entityId: z.string().uuid("ID de entidad inválido"),
  parentId: z
    .string()
    .uuid("ID de comentario padre inválido")
    .nullable()
    .optional(),
  content: z
    .string()
    .trim()
    .min(1, "El comentario no puede estar vacío")
    .max(1000, "El comentario es demasiado largo"),
});

export const updateCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "El comentario no puede estar vacío")
    .max(1000, "El comentario es demasiado largo"),
});

export type CreateCommentSchema = z.infer<typeof createCommentSchema>;
export type UpdateCommentSchema = z.infer<typeof updateCommentSchema>;
