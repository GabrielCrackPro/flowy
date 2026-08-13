"use client";

import type { Session, User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import {
  getSession,
  type OAuthProvider,
  onAuthStateChange,
  signInWithEmail,
  signOut as signOutSession,
  signUpWithEmail,
  signInWithOAuth as startOAuth,
} from "@/lib/supabase/auth";

export type { OAuthProvider } from "@/lib/supabase/auth";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let authEventReceived = false;

    const subscription = onAuthStateChange((event, newSession) => {
      authEventReceived = true;

      if (event === "SIGNED_OUT") {
        setSession(null);
        setUser(null);
      } else {
        setSession(newSession);
        setUser(newSession?.user ?? null);
      }
      setLoading(false);
    });

    async function init() {
      const currentSession = await getSession();
      if (!active || authEventReceived) return;

      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    }

    void init();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = (email: string, password: string, rememberMe = true) =>
    signInWithEmail(email, password, rememberMe);

  const signUp = (email: string, password: string) =>
    signUpWithEmail(email, password);

  const signInWithOAuth = (provider: OAuthProvider) => startOAuth(provider);

  const signOut = () => signOutSession();

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
