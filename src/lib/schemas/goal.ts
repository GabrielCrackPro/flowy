import { z } from "zod";

export const createGoalSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "validation.fieldRequired")
    .max(100, "validation.fieldMaxLength"),
  targetAmount: z
    .number({
      error: "validation.fieldRequired",
    })
    .positive("validation.amountPositive"),
  savedAmount: z.number().min(0).default(0),
  deadline: z.coerce.date().nullable().optional(),
});

export const updateGoalSchema = z.object({
  title: z.string().trim().min(1).max(100).optional(),
  targetAmount: z.number().positive().optional(),
  savedAmount: z.number().min(0).optional(),
  deadline: z.coerce.date().nullable().optional(),
  updatedBy: z.string().optional(),
});

export type CreateGoalSchema = z.infer<typeof createGoalSchema>;
export type UpdateGoalSchema = z.infer<typeof updateGoalSchema>;
