import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js";
import supabase, { setRememberMe } from "./client";

const redirectUrl =
  typeof window !== "undefined"
    ? `${window.location.origin}/auth/callback`
    : undefined;

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
      emailRedirectTo: redirectUrl,
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

export async function signInWithOAuth(provider: "google" | "apple") {
  return supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: redirectUrl,
    },
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export function onAuthStateChange(
  cb: (event: AuthChangeEvent, session: Session | null) => void,
) {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(cb);
  return subscription;
}

export async function getUser(): Promise<User | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}

export async function resetPassword(email: string) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  });
}
