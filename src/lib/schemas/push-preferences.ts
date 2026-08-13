import { z } from "zod";

import { PUSH_ALERT_TYPES, PUSH_ALERTS_DISABLED } from "@/lib/push-preferences";

export const pushPreferencesSchema = z.object({
  preferences: z
    .array(z.union([z.enum(PUSH_ALERT_TYPES), z.literal(PUSH_ALERTS_DISABLED)]))
    .max(PUSH_ALERT_TYPES.length)
    .refine(
      (preferences) =>
        !preferences.includes(PUSH_ALERTS_DISABLED) || preferences.length === 1,
      { message: "The disable-all sentinel must be used by itself" },
    ),
});

export type PushPreferencesInput = z.infer<typeof pushPreferencesSchema>;
