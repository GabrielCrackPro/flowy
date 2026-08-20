"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/shared/icon";
import { useAuth } from "@/hooks/useAuth";
import { Droplet } from "@/lib/icons";
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

  const prefersReducedMotion = useReducedMotion();

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-4"
          aria-label={t("settings.security.mfaChallengeChecking")}
        >
          <div className="relative">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20">
              <Icon icon={Droplet} className="size-6" />
            </div>
            {!prefersReducedMotion ? (
              <motion.div
                className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 blur-xl"
                animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.08, 1] }}
                transition={{
                  duration: 1.6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            ) : null}
          </div>
          {!prefersReducedMotion ? (
            <div className="flex items-center gap-1.5" aria-hidden="true">
              <div className="size-1.5 animate-pulse rounded-full bg-primary" />
              <div
                className="size-1.5 animate-pulse rounded-full bg-primary/40"
                style={{ animationDelay: "75ms" }}
              />
              <div
                className="size-1.5 animate-pulse rounded-full bg-primary/20"
                style={{ animationDelay: "150ms" }}
              />
            </div>
          ) : (
            <span className="text-xs font-medium text-muted-foreground">
              {t("settings.security.mfaChallengeChecking")}
            </span>
          )}
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
