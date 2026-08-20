import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";
import { getSupabaseServerConfig } from "@/lib/supabase/server-config";

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const headerStore = await headers();

  const { url, anonKey } = getSupabaseServerConfig();
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Route handlers called from Server Components cannot set cookies.
        }
      },
    },
  });

  const authorization = headerStore.get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    const accessToken = authorization.slice(7);
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (!error && data.user) {
      return data.user;
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}
