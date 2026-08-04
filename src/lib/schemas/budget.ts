import { z } from "zod";

export const createBudgetSchema = z.object({
  categoryIds: z.array(z.string().uuid()).min(1, "Category is required"),
  budgetLimit: z
    .number({
      error: "El limite es obligatorio",
    })
    .positive("El límite debe ser mayor que cero"),
  month: z
    .number()
    .int()
    .min(1, "El mes debe estar entre 1 y 12")
    .max(12, "El mes debe estar entre 1 y 12")
    .optional(),
  year: z.number().int().min(2000).max(2100).nullable().optional(),
});

export const updateBudgetSchema = createBudgetSchema.partial();

export type CreateBudgetSchema = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetSchema = z.infer<typeof updateBudgetSchema>;
