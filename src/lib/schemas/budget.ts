import { z } from "zod";

export const createBudgetSchema = z.object({
  categoryIds: z.array(z.string().uuid()).min(1, "validation.categoryRequired"),
  budgetLimit: z
    .number({
      error: "validation.fieldRequired",
    })
    .positive("validation.amountPositive"),
  month: z
    .number()
    .int()
    .min(1, "validation.monthRange")
    .max(12, "validation.monthRange")
    .optional(),
  year: z.number().int().min(2000).max(2100).nullable().optional(),
});

export const updateBudgetSchema = createBudgetSchema.partial();

export type CreateBudgetSchema = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetSchema = z.infer<typeof updateBudgetSchema>;
