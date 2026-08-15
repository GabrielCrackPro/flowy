"use client";

import type { ComponentType } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AppleIcon } from "@/components/auth/AppleIcon";
import { GithubIcon } from "@/components/auth/GithubIcon";
import { GoogleIcon } from "@/components/auth/GoogleIcon";
import { Button } from "@/components/ui/button";
import { useFlags } from "@/hooks/useFlags";
import { translateAuthError } from "@/lib/auth/errors";
import { type OAuthProvider, signInWithOAuth } from "@/lib/supabase/auth";

const PROVIDERS: {
  id: OAuthProvider;
  labelKey: "google" | "apple" | "github";
  icon: ComponentType<{ size?: number; className?: string }>;
}[] = [
  { id: "google", labelKey: "google", icon: GoogleIcon },
  { id: "apple", labelKey: "apple", icon: AppleIcon },
  { id: "github", labelKey: "github", icon: GithubIcon },
];

export function OAuthButtons() {
  const { t } = useTranslation("auth");
  const { oauthEnabled } = useFlags();
  const [busyProvider, setBusyProvider] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!oauthEnabled) return null;

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
        {PROVIDERS.map(({ id, labelKey, icon: BrandIcon }) => (
          <Button
            key={id}
            type="button"
            variant="outline"
            className="h-10 px-2"
            disabled={busyProvider !== null}
            onClick={() => void handleProvider(id)}
            aria-label={t(`login.${labelKey}`)}
          >
            {/* size-* class needed: the Button forces any bare svg to 16px. */}
            <BrandIcon className="size-5" />
            <span className="sr-only">{t(`login.${labelKey}`)}</span>
          </Button>
        ))}
      </div>

      {error ? (
        <p role="alert" className="text-center text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
