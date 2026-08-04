import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  currency: z.string().trim().min(3).max(8).optional(),
  locale: z.string().trim().min(2).max(10).optional(),
  showLanguageSelector: z.boolean().optional(),
  dashboardCards: z.array(z.string()).optional(),
});

export const updateThemeSchema = z.object({
  primaryColor: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .nullable(),
  secondaryColor: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .nullable(),
  accentColor: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateThemeInput = z.infer<typeof updateThemeSchema>;
