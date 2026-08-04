import { createBrowserClient, isBrowser, parse } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "";

if (!url || !anonKey) {
  throw new Error(
    "Supabase client initialization failed: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) are required.",
  );
}

export const supabase = createBrowserClient(url, anonKey, {
  cookies: {
    getAll() {
      if (!isBrowser()) return [];
      const parsed = parse(document.cookie);
      const cookies: { name: string; value: string }[] = [];
      for (const [name, value] of Object.entries(parsed)) {
        if (typeof value === "string") {
          cookies.push({ name, value });
        }
      }
      return cookies;
    },
    setAll(cookiesToSet) {
      if (!isBrowser()) return;
      cookiesToSet.forEach(({ name, value, options }) => {
        if ("cookieStore" in window) {
          const sameSite =
            typeof options?.sameSite === "string"
              ? options.sameSite
              : undefined;

          void window.cookieStore.set({
            name,
            value,
            domain: options?.domain,
            expires: options?.expires?.getTime(),
            path: options?.path,
            sameSite,
          });
          return;
        }

        const parts: string[] = [`${name}=${value}`];
        if (options?.path) parts.push(`path=${options.path}`);
        if (options?.domain) parts.push(`domain=${options.domain}`);
        if (options?.secure) parts.push("secure");
        if (options?.sameSite) parts.push(`samesite=${options.sameSite}`);
        if (typeof options?.maxAge === "number") {
          parts.push(`max-age=${options.maxAge}`);
        }
        if (options?.expires) {
          parts.push(`expires=${options.expires.toUTCString()}`);
        }
        /* biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API fallback for browsers without support. */
        document.cookie = parts.join("; ");
      });
    },
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
});

export function createServiceRoleClient(): SupabaseClient {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export default supabase;
