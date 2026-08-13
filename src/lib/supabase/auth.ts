import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import supabase, { setRememberMe } from "./client";

export type OAuthProvider = "google" | "apple" | "github";

type AuthRedirectOptions = {
  next?: string;
};

function getRedirectUrl({ next }: AuthRedirectOptions = {}) {
  if (typeof window === "undefined") return undefined;

  const callback = new URL("/auth/callback", window.location.origin);
  if (next?.startsWith("/") && !next.startsWith("//")) {
    callback.searchParams.set("next", next);
  }
  return callback.toString();
}

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName?: string,
  preferences?: { currency?: string; locale?: string },
) {
  const data: Record<string, string> = {};
  if (fullName) data.full_name = fullName;
  if (preferences?.currency) data.currency = preferences.currency;
  if (preferences?.locale) data.locale = preferences.locale;

  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: Object.keys(data).length > 0 ? data : undefined,
      emailRedirectTo: getRedirectUrl(),
    },
  });
}

export async function signInWithEmail(
  email: string,
  password: string,
  rememberMe = true,
) {
  setRememberMe(rememberMe);
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signInWithOAuth(
  provider: OAuthProvider,
  options?: AuthRedirectOptions,
) {
  return supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: getRedirectUrl(options),
    },
  });
}

export type SignOutScope = "global" | "local" | "others";

export async function signOut(scope: SignOutScope = "local") {
  return supabase.auth.signOut({ scope });
}

export function onAuthStateChange(
  cb: (event: AuthChangeEvent, session: Session | null) => void,
) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(cb);
  return subscription;
}

export async function getSession(): Promise<Session | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session ?? null;
}

export async function getUser(): Promise<User | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}

export async function resetPassword(email: string) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getRedirectUrl(),
  });
}

export async function updatePassword(password: string) {
  return supabase.auth.updateUser({ password });
}
