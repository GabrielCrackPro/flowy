"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { getMfaAssuranceLevel } from "@/lib/supabase/mfa";

export function MfaGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/auth/login");
      return;
    }

    let active = true;
    const checkAssurance = async () => {
      const { data, error } = await getMfaAssuranceLevel();
      if (!active) return;

      if (error) {
        // Keep the dashboard behind MFA when the client cannot determine the
        // current assurance level.
        router.replace(
          `/auth/mfa?next=${encodeURIComponent(pathname || "/dashboard")}`,
        );
        return;
      }

      if (data.nextLevel === "aal2" && data.currentLevel !== "aal2") {
        router.replace(
          `/auth/mfa?next=${encodeURIComponent(pathname || "/dashboard")}`,
        );
        return;
      }

      setReady(true);
    };

    void checkAssurance();
    return () => {
      active = false;
    };
  }, [loading, pathname, router, user]);

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4 text-sm text-muted-foreground">
        {t("settings.security.mfaChallengeChecking")}
      </div>
    );
  }

  return <>{children}</>;
}
