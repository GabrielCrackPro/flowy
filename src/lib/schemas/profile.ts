import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  currency: z.string().trim().min(3).max(8).optional(),
  locale: z.string().trim().min(2).max(10).optional(),
  preferences: z
    .object({
      showLanguageSelector: z.boolean().optional(),
      sidebarHoverExpand: z.boolean().optional(),
      statusAlertsEnabled: z.boolean().optional(),
      statusAlertComponents: z.array(z.string()).optional(),
      statusAlertSeverities: z.array(z.string()).optional(),
      assistantEnabled: z.boolean().optional(),
      assistantStoreHistory: z.boolean().optional(),
    })
    .optional(),
  dashboardCards: z.array(z.string()).optional().nullable(),
  dashboardOrder: z.array(z.string()).optional().nullable(),
  onboardingCompletedAt: z.string().datetime().optional().nullable(),
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
