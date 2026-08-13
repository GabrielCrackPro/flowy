"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { translateAuthError } from "@/lib/auth/errors";
import { type OAuthProvider, signInWithOAuth } from "@/lib/supabase/auth";

const PROVIDERS: {
  id: OAuthProvider;
  labelKey: "google" | "apple" | "github";
}[] = [
  { id: "google", labelKey: "google" },
  { id: "apple", labelKey: "apple" },
  { id: "github", labelKey: "github" },
];

export function OAuthButtons() {
  const { t } = useTranslation("auth");
  const [busyProvider, setBusyProvider] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleProvider(provider: OAuthProvider) {
    if (busyProvider) return;

    setError(null);
    setBusyProvider(provider);
    const { error: authError } = await signInWithOAuth(provider);

    if (authError) {
      setError(translateAuthError(authError, t));
      setBusyProvider(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative flex items-center">
        <div className="h-px flex-1 bg-border" />
        <span className="px-3 text-xs text-muted-foreground">
          {t("login.oauthTitle")}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {PROVIDERS.map(({ id, labelKey }) => (
          <Button
            key={id}
            type="button"
            variant="outline"
            className="h-10 px-2"
            disabled={busyProvider !== null}
            onClick={() => void handleProvider(id)}
            aria-label={t(`login.${labelKey}`)}
          >
            <span aria-hidden="true" className="text-sm font-semibold">
              {id === "google" ? "G" : id === "apple" ? "" : "GH"}
            </span>
            <span className="sr-only">{t(`login.${labelKey}`)}</span>
          </Button>
        ))}
      </div>

      {error ? (
        <p className="text-center text-sm text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
