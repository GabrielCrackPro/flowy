"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check as CheckData } from "lucide";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BottomSheet } from "@/components/shared/bottom-sheet";
import {
  OTP_CODE_LENGTH,
  SegmentedCodeInput,
} from "@/components/shared/segmented-code-input";
import { toast } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import { FormAlert, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Stepper } from "@/components/ui/stepper";
import { translateMfaError } from "@/lib/auth/errors";
import {
  ArrowRight,
  Camera,
  Check,
  ChevronLeft,
  Copy,
  KeyRound,
  ShieldCheck,
  Smartphone,
  X,
} from "@/lib/icons";
import {
  challengeMfa,
  enrollTotp,
  unenrollMfa,
  updateMfaFactorName,
  verifyMfa,
} from "@/lib/supabase/mfa";
import { cn } from "@/lib/utils";
import {
  getQrImageSource,
  type SetupState,
  StyledQrCode,
} from "../profile/mfa-settings";
import { LoadingIcon } from "./loading-icon";

interface MfaSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

/** Obfuscates a base32 setup key so it can be shown without exposing it fully. */
function maskSecret(secret: string): string {
  if (secret.length <= 8) return secret;
  return `${secret.slice(0, 4)}\u2022\u2022\u2022\u2022${secret.slice(-4)}`;
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
}: MfaSetupDialogProps) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [setup, setSetup] = useState<SetupState | null>(null);
  const [step, setStep] = useState<number>(0);
  const [factorName, setFactorName] = useState("");
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<"qr" | "manual">("qr");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const enrolledOnOpenRef = useRef(false);
  const modeLayoutId = useId();

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
    setStep(0);
    setFactorName("");
    setCode("");
    setCopied(false);
    setMode("qr");
    setError(null);
    void beginEnrollment();
  }, [beginEnrollment]);

  const cancelEnrollment = useCallback(async () => {
    if (busy) return;

    const pendingFactorId = setup?.factorId;
    setSetup(null);
    setStep(0);
    setFactorName("");
    setCode("");
    setCopied(false);
    setMode("qr");
    setError(null);

    if (pendingFactorId) {
      await unenrollMfa(pendingFactorId);
    }
  }, [busy, setup]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) void cancelEnrollment();
      onOpenChange(nextOpen);
    },
    [cancelEnrollment, onOpenChange],
  );

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

  const handleQrFallback = useCallback(() => {
    setMode("manual");
  }, []);

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
    setStep(0);
    setFactorName("");
    setCode("");
    setCopied(false);
    setError(null);
    onOpenChange(false);
    toast.success(t("settings.security.mfaSuccess"));
    onComplete?.();
  };

  const steps = [
    { id: "scan", label: t("settings.security.mfaStepScanLabel") },
    { id: "verify", label: t("settings.security.mfaStepVerifyLabel") },
  ];

  return (
    <BottomSheet
      open={open}
      onOpenChange={handleOpenChange}
      title={t("settings.security.mfaSetupTitle")}
      description={t(
        setup
          ? "settings.security.mfaSetupDescription"
          : "settings.security.mfaSetupPreparing",
      )}
      icon={<ShieldCheck className="size-5" />}
      iconGradient="from-emerald-500/20 to-emerald-500/10"
      iconColor="text-emerald-600 dark:text-emerald-400"
      metadata={
        setup && step === 1 ? (
          <>
            {factorName.trim() ? (
              <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                <Smartphone className="size-3.5 shrink-0" />
                <span className="min-w-0 truncate">{factorName.trim()}</span>
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => void copySecret()}
              aria-label={t("settings.security.mfaCopySecret")}
              aria-pressed={copied}
              title={t("settings.security.mfaCopySecret")}
              className="inline-flex max-w-full cursor-pointer items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-2.5 py-1 font-mono text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background"
            >
              {copied ? (
                <Check className="size-3.5 shrink-0 text-emerald-500" />
              ) : (
                <KeyRound className="size-3.5 shrink-0" />
              )}
              <span className="whitespace-nowrap tabular-nums">
                {maskSecret(setup.secret)}
              </span>
            </button>
          </>
        ) : undefined
      }
      className="sm:max-w-[560px]"
      contentClassName="px-4 py-5 sm:px-6 sm:py-6"
      footerSecondary={
        setup && step === 1 ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setStep(0);
              setError(null);
            }}
            disabled={busy}
            className="h-11 w-full sm:h-10 sm:w-auto sm:px-4"
          >
            <ChevronLeft className="size-4" />
            {t("common.back")}
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={busy}
            className="h-11 w-full sm:h-10 sm:w-auto sm:px-4"
          >
            <X className="size-4" />
            {t("common.cancel")}
          </Button>
        )
      }
      footerPrimary={
        setup ? (
          step === 0 ? (
            <Button
              type="button"
              onClick={() => {
                setError(null);
                setStep(1);
              }}
              disabled={busy || !factorName.trim()}
              className="h-12 w-full gap-2 font-semibold shadow-md shadow-primary/20 sm:h-10 sm:w-auto sm:min-w-28"
            >
              {t("settings.security.mfaContinue")}
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => void verifyEnrollment()}
              disabled={busy || code.length !== OTP_CODE_LENGTH}
              className="h-12 w-full gap-2 font-semibold shadow-md shadow-primary/20 sm:h-10 sm:w-auto sm:min-w-28"
            >
              <LoadingIcon icon={CheckData} loading={busy} size={16} />
              {busy
                ? t("settings.security.mfaVerifying")
                : t("settings.security.mfaVerify")}
            </Button>
          )
        ) : undefined
      }
    >
      {setup ? (
        <div className="space-y-6">
          <Stepper
            steps={steps}
            activeIndex={step}
            onStepClick={(index) => {
              setStep(index);
              setError(null);
            }}
          />
          <AnimatePresence mode="wait" initial={false}>
            {step === 0 ? (
              <motion.div
                key="step-scan"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{
                  duration: reduceMotion ? 0 : 0.2,
                  ease: "easeOut",
                }}
                className="space-y-6"
              >
                <FormAlert message={error} variant="error" />

                <div className="space-y-4">
                  <FormField
                    label={t("settings.security.mfaNameLabel")}
                    required
                  >
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

                <div className="space-y-3">
                  <fieldset
                    aria-label={`${t("settings.security.mfaModeScanLabel")} / ${t("settings.security.mfaModeManualLabel")}`}
                    className="m-0 grid grid-cols-2 gap-1 rounded-2xl border-0 bg-background/80 p-1 shadow-inner"
                  >
                    <motion.button
                      type="button"
                      onClick={() => setMode("qr")}
                      aria-pressed={mode === "qr"}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "relative flex items-center justify-center gap-2 whitespace-nowrap rounded-xl py-2.5 text-sm font-medium transition-colors",
                        mode === "qr"
                          ? "text-foreground"
                          : "text-muted-foreground/70 hover:text-foreground",
                      )}
                    >
                      {mode === "qr" ? (
                        <motion.span
                          layoutId={modeLayoutId}
                          className="absolute inset-0 rounded-xl bg-card shadow-sm ring-1 ring-border/20"
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 32,
                          }}
                        />
                      ) : null}
                      <Camera className="relative size-4 shrink-0" />
                      <span className="relative">
                        {t("settings.security.mfaModeScanLabel")}
                      </span>
                    </motion.button>
                    <motion.button
                      type="button"
                      onClick={() => setMode("manual")}
                      aria-pressed={mode === "manual"}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "relative flex items-center justify-center gap-2 whitespace-nowrap rounded-xl py-2.5 text-sm font-medium transition-colors",
                        mode === "manual"
                          ? "text-foreground"
                          : "text-muted-foreground/70 hover:text-foreground",
                      )}
                    >
                      {mode === "manual" ? (
                        <motion.span
                          layoutId={modeLayoutId}
                          className="absolute inset-0 rounded-xl bg-card shadow-sm ring-1 ring-border/20"
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 32,
                          }}
                        />
                      ) : null}
                      <KeyRound className="relative size-4 shrink-0" />
                      <span className="relative">
                        {t("settings.security.mfaModeManualLabel")}
                      </span>
                    </motion.button>
                  </fieldset>

                  <AnimatePresence mode="wait" initial={false}>
                    {mode === "qr" ? (
                      <motion.div
                        key="mode-qr"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{
                          duration: reduceMotion ? 0 : 0.15,
                          ease: "easeOut",
                        }}
                        className="flex flex-col items-center gap-3"
                      >
                        <div className="flex aspect-square w-full max-w-64 items-center justify-center rounded-xl bg-white p-4 dark:bg-slate-950">
                          <StyledQrCode
                            uri={setup.uri}
                            fallbackSrc={getQrImageSource(setup.qrCode)}
                            alt={t("settings.security.mfaQrAlt")}
                            onFallback={handleQrFallback}
                          />
                        </div>
                        <p className="max-w-sm text-center text-xs leading-relaxed text-muted-foreground">
                          {t("settings.security.mfaScanHint")}
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="mode-manual"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{
                          duration: reduceMotion ? 0 : 0.15,
                          ease: "easeOut",
                        }}
                        className="space-y-2"
                      >
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
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step-verify"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{
                  duration: reduceMotion ? 0 : 0.2,
                  ease: "easeOut",
                }}
                className="space-y-5"
              >
                <div className="flex items-start gap-2.5 rounded-xl bg-emerald-500/[0.06] p-3.5">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t("settings.security.mfaStepVerifyHint")}
                  </p>
                </div>

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
                    autoFocus
                    className="justify-center sm:justify-center"
                  />
                </FormField>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="space-y-5" aria-busy="true">
          <div className="flex items-center gap-3 rounded-xl bg-muted/30 p-4 text-sm text-muted-foreground">
            <LoadingIcon icon={CheckData} loading size={16} />
            {t("settings.security.mfaEnrolling")}
          </div>
          <FormAlert message={error} variant="error" />
        </div>
      )}
    </BottomSheet>
  );
}
