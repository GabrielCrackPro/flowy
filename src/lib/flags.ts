import { vercelAdapter } from "@flags-sdk/vercel";
import { flag } from "flags/next";

/**
 * Gates OAuth sign-in options (Google, GitHub) on the auth pages.
 *
 * Managed from the Vercel Flags dashboard (`vercel flags` CLI). Falls back to
 * `false` when the `FLAGS` env var is not configured locally, so the app keeps
 * working with password-only auth until the flag is enabled.
 */
export const oauthEnabled = flag<boolean>({
  key: "oauth-enabled",
  description: "Describes if OAuth login flow is enabled",
  defaultValue: false,
  options: [
    { value: false, label: "Off" },
    { value: true, label: "On" },
  ],
  adapter: vercelAdapter,
});

/**
 * Gates the AI chat assistant. Off by default — enable per-environment from
 * the Vercel Flags dashboard once AI_PROVIDER_API_KEY is configured.
 */
export const assistantEnabled = flag<boolean>({
  key: "assistant-enabled",
  description: "Enables the in-app AI chat assistant",
  defaultValue: false,
  options: [
    { value: false, label: "Off" },
    { value: true, label: "On" },
  ],
  adapter: vercelAdapter,
});
