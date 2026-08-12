import { z } from "zod";

export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "validation.fieldRequired")
    .max(50, "validation.fieldMaxLength"),
  icon: z.string().trim().max(50).optional(),
  color: z.string().trim().max(20).optional(),
  type: z.enum(["INCOME", "EXPENSE"]),
});

export const updateCategorySchema = createCategorySchema.partial();
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
