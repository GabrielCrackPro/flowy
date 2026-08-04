"use client";

import type { Session, User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import supabase from "@/lib/supabase/client";

export type OAuthProvider = "google" | "apple" | "github";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = (email: string, password: string) =>
    supabase.auth.signInWithPassword({ email, password });

  const signUp = (email: string, password: string) =>
    supabase.auth.signUp({ email, password });

  const signInWithOAuth = (provider: OAuthProvider) =>
    supabase.auth.signInWithOAuth({ provider });

  const signOut = () => supabase.auth.signOut();

  return {
    session,
    user,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithOAuth,
  };
}
