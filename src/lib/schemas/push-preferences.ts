import { z } from "zod";

import { PUSH_ALERT_TYPES } from "@/lib/push-preferences";

export const pushPreferencesSchema = z.object({
  preferences: z.array(z.enum(PUSH_ALERT_TYPES)).max(PUSH_ALERT_TYPES.length),
});

export type PushPreferencesInput = z.infer<typeof pushPreferencesSchema>;
