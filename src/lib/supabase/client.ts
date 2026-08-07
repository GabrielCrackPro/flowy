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

const REMEMBER_ME_KEY = "flowy-remember-me";

function rememberMeEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.sessionStorage.getItem(REMEMBER_ME_KEY) !== "0";
  } catch {
    return true;
  }
}

export function setRememberMe(enabled: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (enabled) {
      window.sessionStorage.removeItem(REMEMBER_ME_KEY);
    } else {
      window.sessionStorage.setItem(REMEMBER_ME_KEY, "0");
    }
  } catch {
    // Ignore: storage can be unavailable (private mode, disabled storage).
  }
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
      const remember = rememberMeEnabled();
      cookiesToSet.forEach(({ name, value, options }) => {
        const isAuthCookie = name.startsWith("sb-");
        const sessionOnly = isAuthCookie && value !== "" && !remember;
        const cookieOptions = sessionOnly
          ? { ...options, maxAge: undefined, expires: undefined }
          : options;

        if ("cookieStore" in window) {
          const sameSite =
            typeof cookieOptions?.sameSite === "string"
              ? cookieOptions.sameSite
              : undefined;

          void window.cookieStore.set({
            name,
            value,
            domain: cookieOptions?.domain,
            expires: cookieOptions?.expires?.getTime(),
            path: cookieOptions?.path,
            sameSite,
          });
          return;
        }

        const parts: string[] = [`${name}=${value}`];
        if (cookieOptions?.path) parts.push(`path=${cookieOptions.path}`);
        if (cookieOptions?.domain) {
          parts.push(`domain=${cookieOptions.domain}`);
        }
        if (cookieOptions?.secure) parts.push("secure");
        if (cookieOptions?.sameSite) {
          parts.push(`samesite=${cookieOptions.sameSite}`);
        }
        if (typeof cookieOptions?.maxAge === "number") {
          parts.push(`max-age=${cookieOptions.maxAge}`);
        }
        if (cookieOptions?.expires) {
          parts.push(`expires=${cookieOptions.expires.toUTCString()}`);
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
