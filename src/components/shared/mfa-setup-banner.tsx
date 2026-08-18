"use client";

import { AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Banner } from "@/components/shared/banner";
import {
  BannerStripMotion,
  useBannerStackItem,
} from "@/components/shared/banner-stack";
import { MfaSetupDialog } from "@/components/shared/mfa-setup-dialog";
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
 * Strip in the under-header banner stack nudging users who signed up recently
 * to enable MFA, rendered with the shared strip design (same place as the
 * offline/push/incident status alerts). Shows only while the account is new,
 * MFA is not set up yet, and the banner was not dismissed; it disappears
 * automatically once an authenticator is enrolled.
 */
export function MfaSetupBanner() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { user } = useAuth();
  const [setupOpen, setSetupOpen] = useState(false);
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

  const checkMfa = useCallback(async () => {
    const { data, error } = await listMfaFactors();
    if (!error && data.totp.some((factor) => factor.status === "verified")) {
      setMfaEnabled(true);
    }
    setChecked(true);
  }, []);

  useEffect(() => {
    let active = true;

    const runCheck = async () => {
      if (!active) return;
      await checkMfa();
    };

    if (user && isRecentAccount(user.created_at)) {
      void runCheck();
    } else {
      setChecked(true);
    }

    return () => {
      active = false;
    };
  }, [user, checkMfa]);

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

  const { ownDismissHidden, staggerDelay } = useBannerStackItem({
    visible,
    onDismiss: dismiss,
  });

  return (
    <>
      <AnimatePresence initial={false}>
        {visible && (
          <BannerStripMotion delay={staggerDelay}>
            <Banner
              variant="strip"
              severity="info"
              icon={ShieldCheck}
              title={t("settings.security.mfaBannerText")}
              description={t("settings.security.mfaBannerHint")}
              actionLabel={t("settings.security.mfaBannerAction")}
              onAction={() => setSetupOpen(true)}
              onDismiss={ownDismissHidden ? undefined : dismiss}
              dismissLabel={t("common.close")}
            />
          </BannerStripMotion>
        )}
      </AnimatePresence>

      <MfaSetupDialog
        open={setupOpen}
        onOpenChange={setSetupOpen}
        onComplete={() => void checkMfa()}
      />
    </>
  );
}
