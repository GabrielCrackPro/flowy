import { z } from "zod";

export const billingCycleSchema = z.enum([
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "QUARTERLY",
  "YEARLY",
]);

export const createSubscriptionSchema = z.object({
  merchant: z.string().trim().min(1, "El comerciante es obligatorio").max(100),
  amount: z.number().positive("El importe debe ser mayor que cero"),
  billingCycle: billingCycleSchema,
  nextPayment: z.coerce.date().optional(),
  active: z.boolean().default(true),
});

export const updateSubscriptionSchema = z.object({
  merchant: z.string().trim().min(1).max(100).optional(),
  amount: z.number().positive().optional(),
  billingCycle: billingCycleSchema.optional(),
  nextPayment: z.coerce.date().optional(),
  active: z.boolean().optional(),
});

export type CreateSubscriptionSchema = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionSchema = z.infer<typeof updateSubscriptionSchema>;
