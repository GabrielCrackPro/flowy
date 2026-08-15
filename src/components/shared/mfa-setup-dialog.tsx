"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  OTP_CODE_LENGTH,
  SegmentedCodeInput,
} from "@/components/shared/segmented-code-input";
import { toast } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import { FormAlert, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SheetClose } from "@/components/ui/sheet";
import { SheetLayout } from "@/components/ui/sheet-layout";
import { translateMfaError } from "@/lib/auth/errors";
import { Check, Copy, KeyRound, Loader2, ShieldCheck, X } from "@/lib/icons";
import {
  challengeMfa,
  enrollTotp,
  unenrollMfa,
  updateMfaFactorName,
  verifyMfa,
} from "@/lib/supabase/mfa";
import {
  getQrImageSource,
  type SetupState,
  StyledQrCode,
} from "../profile/mfa-settings";

interface MfaSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
  titleId?: string;
}

/**
 * MFA authenticator enrollment flow (QR code, manual secret, OTP verification).
 * Self-contained so both the security settings panel and the dashboard MFA
 * banner can trigger the same setup sheet.
 */
export function MfaSetupDialog({
  open,
  onOpenChange,
  onComplete,
  titleId,
}: MfaSetupDialogProps) {
  const { t } = useTranslation();
  const [setup, setSetup] = useState<SetupState | null>(null);
  const [factorName, setFactorName] = useState("");
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const enrolledOnOpenRef = useRef(false);

  const beginEnrollment = useCallback(async () => {
    if (busy) return;

    setBusy(true);
    setError(null);
    const { data, error: enrollError } = await enrollTotp(
      `Flowy authenticator ${Date.now()}`,
    );
    setBusy(false);

    if (enrollError || !data) {
      setError(translateMfaError(enrollError, t));
      return;
    }

    setSetup({
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
      uri: data.totp.uri,
    });
    setCode("");
    setCopied(false);
  }, [busy, t]);

  const openEnrollment = useCallback(() => {
    setSetup(null);
    setFactorName("");
    setCode("");
    setCopied(false);
    setError(null);
    void beginEnrollment();
  }, [beginEnrollment]);

  const cancelEnrollment = useCallback(async () => {
    if (busy) return;

    const pendingFactorId = setup?.factorId;
    setSetup(null);
    setFactorName("");
    setCode("");
    setCopied(false);
    setError(null);

    if (pendingFactorId) {
      await unenrollMfa(pendingFactorId);
    }
  }, [busy, setup]);

  useEffect(() => {
    if (!open) {
      enrolledOnOpenRef.current = false;
      return;
    }
    if (enrolledOnOpenRef.current) return;
    enrolledOnOpenRef.current = true;
    openEnrollment();
  }, [open, openEnrollment]);

  // Clean up the pending (unverified) factor when the dialog unmounts while
  // enrollment is in progress, so storage is not left dangling.
  const pendingFactorRef = useRef<string | null>(null);
  useEffect(() => {
    pendingFactorRef.current = setup?.factorId ?? null;
  }, [setup]);
  useEffect(() => {
    return () => {
      const pending = pendingFactorRef.current;
      if (pending) void unenrollMfa(pending);
    };
  }, []);

  const copySecret = async () => {
    if (!setup) return;

    try {
      await navigator.clipboard.writeText(setup.secret);
      setCopied(true);
      toast.success(t("settings.security.mfaSecretCopied"));
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError(t("settings.security.mfaError"));
    }
  };

  const verifyEnrollment = async (submittedCode = code) => {
    const normalizedCode = submittedCode.trim();
    const name = factorName.trim();
    if (busy || !setup || normalizedCode.length !== OTP_CODE_LENGTH) {
      return;
    }

    if (!name) {
      setError(t("settings.security.mfaNameRequired"));
      return;
    }

    setBusy(true);
    setError(null);
    const { data: challenge, error: challengeError } = await challengeMfa(
      setup.factorId,
    );

    if (challengeError || !challenge) {
      setBusy(false);
      setError(translateMfaError(challengeError, t));
      return;
    }

    const { error: verifyError } = await verifyMfa(
      setup.factorId,
      challenge.id,
      normalizedCode,
    );
    setBusy(false);

    if (verifyError) {
      setError(translateMfaError(verifyError, t));
      return;
    }

    await updateMfaFactorName(setup.factorId, name);
    setSetup(null);
    setFactorName("");
    setCode("");
    setCopied(false);
    setError(null);
    onOpenChange(false);
    toast.success(t("settings.security.mfaSuccess"));
    onComplete?.();
  };

  return (
    <SheetLayout
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) void cancelEnrollment();
        onOpenChange(nextOpen);
      }}
      title={t("settings.security.mfaSetupTitle")}
      description={t(
        setup
          ? "settings.security.mfaSetupDescription"
          : "settings.security.mfaSetupPreparing",
      )}
      icon={ShieldCheck}
      iconGradient="from-emerald-500/20 to-emerald-500/10"
      iconColor="text-emerald-600 dark:text-emerald-400"
      maxWidth="sm:max-w-[560px]"
      titleId={titleId}
      footerRight={
        setup ? (
          <>
            <SheetClose>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                className="h-10"
              >
                <X className="size-4" />
                {t("common.cancel")}
              </Button>
            </SheetClose>
            <Button
              type="button"
              onClick={() => void verifyEnrollment()}
              disabled={
                busy || !factorName.trim() || code.length !== OTP_CODE_LENGTH
              }
              className="h-10 gap-2"
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              {busy ? (
                t("settings.security.mfaVerifying")
              ) : (
                <>
                  <Check className="size-4" />
                  {t("settings.security.mfaVerify")}
                </>
              )}
            </Button>
          </>
        ) : (
          <SheetClose>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              className="h-10"
            >
              <X className="size-4" />
              {t("common.cancel")}
            </Button>
          </SheetClose>
        )
      }
    >
      {setup ? (
        <div className="space-y-6">
          <div className="space-y-4">
            <FormField label={t("settings.security.mfaNameLabel")} required>
              <Input
                value={factorName}
                onChange={(event) => {
                  setFactorName(event.target.value);
                  if (error) setError(null);
                }}
                placeholder={t("settings.security.mfaNamePlaceholder")}
                autoFocus
                maxLength={50}
                disabled={busy}
              />
            </FormField>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {t("settings.security.mfaNameHint")}
            </p>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="flex aspect-square w-full max-w-64 items-center justify-center rounded-xl bg-white p-4 dark:bg-slate-950">
              <StyledQrCode
                uri={setup.uri}
                fallbackSrc={getQrImageSource(setup.qrCode)}
                alt={t("settings.security.mfaQrAlt")}
              />
            </div>
            <p className="max-w-sm text-center text-xs leading-relaxed text-muted-foreground">
              {t("settings.security.mfaScanHint")}
            </p>
          </div>

          <div className="space-y-5 pt-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <KeyRound className="size-4 shrink-0 text-muted-foreground" />
                <p className="text-xs font-semibold text-foreground">
                  {t("settings.security.mfaManualSecretLabel")}
                </p>
              </div>
              <div className="relative">
                <code className="block overflow-x-auto rounded-lg border border-border/40 bg-muted/30 px-3 py-2 pr-11 font-mono text-xs tracking-[0.12em] text-foreground">
                  {setup.secret}
                </code>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => void copySecret()}
                  aria-label={t("settings.security.mfaCopySecret")}
                  aria-pressed={copied}
                  title={t("settings.security.mfaCopySecret")}
                  className="absolute right-1.5 top-1/2 size-7 -translate-y-1/2 rounded-md bg-background/80 text-muted-foreground shadow-sm hover:bg-background hover:text-foreground"
                >
                  {copied ? (
                    <Check className="size-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                </Button>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {t("settings.security.mfaManualSecret")}
              </p>
            </div>

            <div className="space-y-3 pt-1">
              <FormField label={t("settings.security.mfaCodeLabel")} required>
                <SegmentedCodeInput
                  value={code}
                  onChange={(nextCode) => {
                    setCode(nextCode);
                    if (error) setError(null);
                  }}
                  onComplete={(completeCode) => {
                    void verifyEnrollment(completeCode);
                  }}
                  disabled={busy}
                  label={t("settings.security.mfaCodeLabel")}
                  invalid={Boolean(error)}
                  errorMessage={error}
                  className="justify-center sm:justify-center"
                />
              </FormField>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-5" aria-busy="true">
          <div className="flex items-center gap-3 rounded-xl bg-muted/30 p-4 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {t("settings.security.mfaEnrolling")}
          </div>
          <FormAlert message={error} variant="error" />
        </div>
      )}
    </SheetLayout>
  );
}
