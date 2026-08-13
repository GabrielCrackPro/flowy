"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Banner } from "@/components/shared/banner";
import { useAuth } from "@/hooks/useAuth";
import { ShieldCheck } from "@/lib/icons";
import { listMfaFactors } from "@/lib/supabase/mfa";

const DISMISS_KEY = "flowy-mfa-banner-dismissed";
const NEW_ACCOUNT_WINDOW_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

function isRecentAccount(createdAt: string | undefined) {
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return false;
  return Date.now() - created < NEW_ACCOUNT_WINDOW_MS;
}

/**
 * Banner nudging users who signed up recently to enable MFA, rendered with the
 * shared Banner design. Shows only while the account is new, MFA is not set up
 * yet, and the banner was not dismissed; it disappears automatically once an
 * authenticator is enrolled.
 */
export function MfaSetupBanner() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [checked, setChecked] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);

  useEffect(() => {
    let active = true;

    const checkMfa = async () => {
      const { data, error } = await listMfaFactors();
      if (!active) return;
      if (!error && data.totp.some((factor) => factor.status === "verified")) {
        setMfaEnabled(true);
      }
      setChecked(true);
    };

    if (user && isRecentAccount(user.created_at)) {
      void checkMfa();
    } else {
      setChecked(true);
    }

    return () => {
      active = false;
    };
  }, [user]);

  const visible =
    checked &&
    !mfaEnabled &&
    !dismissed &&
    pathname === "/dashboard" &&
    isRecentAccount(user?.created_at);

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Ignore storage failures (private mode etc.)
    }
  };

  return (
    <AnimatePresence initial={false}>
      {visible && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className="py-2">
            <div className="mx-auto w-full max-w-7xl px-3 sm:px-4">
              <Banner
                severity="info"
                icon={ShieldCheck}
                title={t("settings.security.mfaBannerText")}
                description={t("settings.security.mfaBannerHint")}
                actionLabel={t("settings.security.mfaBannerAction")}
                onAction={() => router.push("/dashboard/profile#security")}
                onDismiss={dismiss}
                dismissLabel={t("common.close")}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
