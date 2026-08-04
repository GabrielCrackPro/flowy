import { z } from "zod";

export const createGoalSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "El título es obligatorio")
    .max(100, "El título es demasiado largo"),
  targetAmount: z
    .number({
      error: "El objetivo es obligatorio",
    })
    .positive("El importe debe ser mayor que cero"),
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
