import { z } from "zod";

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
    .min(1, "validation.fieldRequired")
    .max(1000, "validation.fieldMaxLength"),
});

export const updateCommentSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "validation.fieldRequired")
    .max(1000, "validation.fieldMaxLength"),
});

export type CreateCommentSchema = z.infer<typeof createCommentSchema>;
export type UpdateCommentSchema = z.infer<typeof updateCommentSchema>;
