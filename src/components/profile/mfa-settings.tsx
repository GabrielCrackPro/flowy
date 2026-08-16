"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ConfirmDialog, Icon } from "@/components/shared";
import { MfaSetupDialog } from "@/components/shared/mfa-setup-dialog";
import {
  OTP_CODE_LENGTH,
  SegmentedCodeInput,
} from "@/components/shared/segmented-code-input";
import { toast } from "@/components/shared/toast";
import { Badge } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { FormAlert, FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/hooks/useTheme";
import { translateMfaError } from "@/lib/auth/errors";
import {
  Check,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  ShieldCheck,
  Smartphone,
  X,
} from "@/lib/icons";
import {
  challengeMfa,
  listMfaFactorNames,
  listMfaFactors,
  removeMfaFactorName,
  unenrollMfa,
  updateMfaFactorName,
  verifyMfa,
} from "@/lib/supabase/mfa";

interface FactorSummary {
  id: string;
  name: string | null;
}

export interface SetupState {
  factorId: string;
  qrCode: string;
  secret: string;
  uri: string;
}

function getFactorLabel(
  factor: FactorSummary,
  index: number,
  t: (key: string, options?: Record<string, number>) => string,
) {
  if (!factor.name || /^flowy authenticator /i.test(factor.name)) {
    return t("settings.security.mfaAuthenticatorNumber", {
      number: index + 1,
    });
  }

  return factor.name;
}

export function getQrImageSource(qrCode: string) {
  const value = qrCode.trim();

  if (value.startsWith("data:image/")) {
    return value;
  }

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(value)}`;
}

const QR_LIGHT_COLORS = {
  dots: "#2563eb",
  corners: "#1d4ed8",
  background: "#ffffff",
};

const QR_DARK_COLORS = {
  dots: "#bfdbfe",
  corners: "#93c5fd",
  background: "#0f172a",
};

export function StyledQrCode({
  uri,
  fallbackSrc,
  alt,
  onFallback,
}: {
  uri: string;
  fallbackSrc: string;
  alt: string;
  onFallback?: () => void;
}) {
  const { isDark } = useTheme();
  const reduceMotion = useReducedMotion();
  const lightRef = useRef<HTMLDivElement>(null);
  const darkRef = useRef<HTMLDivElement>(null);
  const onFallbackRef = useRef(onFallback);
  const [status, setStatus] = useState<"loading" | "ready" | "fallback">(
    "loading",
  );

  useEffect(() => {
    onFallbackRef.current = onFallback;
  }, [onFallback]);

  useEffect(() => {
    let disposed = false;
    const lightContainer = lightRef.current;
    const darkContainer = darkRef.current;

    if (!lightContainer || !darkContainer) return;

    lightContainer.replaceChildren();
    darkContainer.replaceChildren();
    setStatus("loading");

    void import("qr-code-styling")
      .then(({ default: QRCodeStyling }) => {
        if (disposed || !lightContainer || !darkContainer) return;

        const render = (
          container: HTMLDivElement,
          colors: { dots: string; corners: string; background: string },
        ) => {
          const qrCode = new QRCodeStyling({
            width: 256,
            height: 256,
            type: "svg",
            data: uri,
            image: "/app-icon.svg",
            margin: 12,
            qrOptions: {
              errorCorrectionLevel: "H",
            },
            dotsOptions: {
              type: "rounded",
              color: colors.dots,
            },
            cornersSquareOptions: {
              type: "extra-rounded",
              color: colors.corners,
            },
            cornersDotOptions: {
              type: "dot",
              color: colors.corners,
            },
            backgroundOptions: {
              color: colors.background,
            },
            imageOptions: {
              hideBackgroundDots: true,
              imageSize: 0.18,
              margin: 4,
              crossOrigin: "anonymous",
            },
          });

          qrCode.append(container);
          const svg = container.querySelector("svg");
          if (svg) {
            svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
            svg.style.display = "block";
            svg.style.height = "100%";
            svg.style.width = "100%";
          }
        };

        render(lightContainer, QR_LIGHT_COLORS);
        render(darkContainer, QR_DARK_COLORS);
        setStatus("ready");
      })
      .catch(() => {
        if (!disposed) {
          setStatus("fallback");
          onFallbackRef.current?.();
        }
      });

    return () => {
      disposed = true;
      lightContainer.replaceChildren();
      darkContainer.replaceChildren();
    };
  }, [uri]);

  if (status === "fallback") {
    return (
      /* biome-ignore lint/performance/noImgElement: Supabase's SVG data URL is the resilient fallback renderer. */
      <img
        src={fallbackSrc}
        alt={alt}
        decoding="async"
        className="size-full object-contain"
      />
    );
  }

  return (
    <div className="relative size-full" role="img" aria-label={alt}>
      <motion.div
        ref={lightRef}
        className="absolute inset-0"
        initial={false}
        animate={{
          opacity: status === "ready" && !isDark ? 1 : 0,
          scale: status === "ready" ? 1 : 0.96,
        }}
        transition={{ duration: reduceMotion ? 0 : 0.35, ease: "easeOut" }}
      />
      <motion.div
        ref={darkRef}
        className="absolute inset-0"
        initial={false}
        animate={{
          opacity: status === "ready" && isDark ? 1 : 0,
          scale: status === "ready" ? 1 : 0.96,
        }}
        transition={{ duration: reduceMotion ? 0 : 0.35, ease: "easeOut" }}
      />
      <AnimatePresence>
        {status === "loading" ? (
          <motion.div
            key="qr-skeleton"
            className="absolute inset-0"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
          >
            <div className="size-full animate-pulse">
              <div className="size-full rounded-lg bg-muted/60" />
              <span className="absolute left-[8%] top-[8%] size-[22%] rounded-[3px] border-2 border-foreground/20" />
              <span className="absolute right-[8%] top-[8%] size-[22%] rounded-[3px] border-2 border-foreground/20" />
              <span className="absolute bottom-[8%] left-[8%] size-[22%] rounded-[3px] border-2 border-foreground/20" />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function MfaSettings() {
  const { t } = useTranslation();
  const [factors, setFactors] = useState<FactorSummary[]>([]);
  const [setupOpen, setSetupOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [factorToRemove, setFactorToRemove] = useState<string | null>(null);
  const [removalChallengeId, setRemovalChallengeId] = useState<string | null>(
    null,
  );
  const [removalCode, setRemovalCode] = useState("");
  const [removalBusy, setRemovalBusy] = useState(false);
  const [removalPreparing, setRemovalPreparing] = useState(false);
  const [removalVerified, setRemovalVerified] = useState(false);
  const [removalError, setRemovalError] = useState<string | null>(null);
  const [factorToRename, setFactorToRename] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameBusy, setRenameBusy] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);

  const loadFactors = useCallback(async () => {
    setLoading(true);
    const [{ data, error: factorsError }, { data: factorNames }] =
      await Promise.all([listMfaFactors(), listMfaFactorNames()]);

    if (factorsError) {
      setError(translateMfaError(factorsError, t));
    } else {
      setFactors(
        data.totp
          .filter((factor) => factor.status === "verified")
          .map((factor) => ({
            id: factor.id,
            name: factorNames[factor.id] ?? factor.friendly_name ?? null,
          })),
      );
      setError(null);
    }
    setLoading(false);
  }, [t]);

  useEffect(() => {
    void loadFactors();
  }, [loadFactors]);

  const openEnrollment = () => {
    setError(null);
    setSetupOpen(true);
  };

  const startFactorRename = (factor: FactorSummary) => {
    setFactorToRename(factor.id);
    setRenameValue(getFactorLabel(factor, factors.indexOf(factor), t));
    setRenameError(null);
  };

  const cancelFactorRename = () => {
    setFactorToRename(null);
    setRenameValue("");
    setRenameError(null);
  };

  const saveFactorRename = async () => {
    const name = renameValue.trim();
    if (!factorToRename || renameBusy) return;

    if (!name) {
      setRenameError(t("settings.security.mfaNameRequired"));
      return;
    }

    setRenameBusy(true);
    setRenameError(null);
    const { error: updateError } = await updateMfaFactorName(
      factorToRename,
      name,
    );
    setRenameBusy(false);

    if (updateError) {
      setRenameError(translateMfaError(updateError, t));
      return;
    }

    cancelFactorRename();
    await loadFactors();
    toast.success(t("settings.security.mfaRenameSuccess"));
  };

  const clearFactorRemoval = () => {
    setFactorToRemove(null);
    setRemovalChallengeId(null);
    setRemovalCode("");
    setRemovalPreparing(false);
    setRemovalVerified(false);
    setRemovalError(null);
  };

  const prepareRemovalChallenge = async (factorId: string) => {
    setRemovalPreparing(true);
    setRemovalError(null);
    const { data: challenge, error: challengeError } =
      await challengeMfa(factorId);
    setRemovalPreparing(false);

    if (challengeError || !challenge) {
      setRemovalError(translateMfaError(challengeError, t));
      return;
    }

    setRemovalChallengeId(challenge.id);
  };

  const openFactorRemoval = (factorId: string) => {
    setFactorToRemove(factorId);
    setRemovalCode("");
    setRemovalChallengeId(null);
    setRemovalError(null);
    void prepareRemovalChallenge(factorId);
  };

  const removeFactor = async (submittedCode = removalCode) => {
    if (
      !factorToRemove ||
      removalBusy ||
      (!removalVerified &&
        (!removalChallengeId || submittedCode.length !== OTP_CODE_LENGTH))
    ) {
      return;
    }

    setRemovalBusy(true);
    setRemovalError(null);

    if (!removalVerified) {
      if (!removalChallengeId) {
        setRemovalBusy(false);
        return;
      }

      const { error: verifyError } = await verifyMfa(
        factorToRemove,
        removalChallengeId,
        submittedCode,
      );

      if (verifyError) {
        setRemovalBusy(false);
        setRemovalError(translateMfaError(verifyError, t));
        return;
      }

      setRemovalVerified(true);
    }

    const { error: removeError } = await unenrollMfa(factorToRemove);
    setRemovalBusy(false);

    if (removeError) {
      setRemovalError(translateMfaError(removeError, t));
      return;
    }

    await removeMfaFactorName(factorToRemove);
    clearFactorRemoval();
    await loadFactors();
    toast.success(t("settings.security.mfaDisabled"));
  };

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="space-y-3" aria-busy="true">
          <div className="h-16 animate-pulse rounded-xl bg-muted/50" />
          <div className="h-9 w-36 animate-pulse rounded-lg bg-muted/40" />
        </div>
      ) : null}

      {!setupOpen ? <FormAlert message={error} variant="error" /> : null}

      {!loading && factors.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("settings.security.mfaAuthenticator")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("settings.security.mfaEnabledHint")}
              </p>
            </div>
            <Badge variant="secondary" className="shrink-0 tabular-nums">
              {factors.length}
            </Badge>
          </div>

          <div className="space-y-2">
            {factors.map((factor) => (
              <div
                key={factor.id}
                className="group flex flex-col gap-3 rounded-xl bg-muted/25 p-3.5 transition-colors hover:bg-primary/[0.05] sm:flex-row sm:items-center"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Smartphone className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  {factorToRename === factor.id ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        value={renameValue}
                        onChange={(event) => {
                          setRenameValue(event.target.value);
                          if (renameError) setRenameError(null);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            void saveFactorRename();
                          }
                          if (event.key === "Escape") cancelFactorRename();
                        }}
                        maxLength={50}
                        autoFocus
                        disabled={renameBusy}
                        aria-label={t("settings.security.mfaNameLabel")}
                        className="h-8 min-w-44 flex-1"
                      />
                      <Button
                        type="button"
                        size="icon-sm"
                        onClick={() => void saveFactorRename()}
                        disabled={renameBusy}
                        aria-label={t("settings.security.mfaRename")}
                        title={t("settings.security.mfaRename")}
                      >
                        {renameBusy ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Check className="size-3.5" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={cancelFactorRename}
                        disabled={renameBusy}
                        aria-label={t("common.cancel")}
                        title={t("common.cancel")}
                      >
                        <X className="size-3.5" />
                      </Button>
                      {renameError ? (
                        <p
                          className="basis-full text-xs text-destructive"
                          role="alert"
                        >
                          {renameError}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="truncate text-sm font-medium text-foreground">
                      {getFactorLabel(factor, factors.indexOf(factor), t)}
                    </p>
                  )}
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                    <span className="size-1.5 rounded-full bg-emerald-500" />
                    {t("settings.security.mfaEnabled")}
                  </p>
                </div>
                <div className="flex w-full gap-1 sm:w-auto">
                  {factorToRename !== factor.id ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => startFactorRename(factor)}
                      disabled={removalBusy || removalPreparing || renameBusy}
                      aria-label={t("settings.security.mfaRename")}
                      title={t("settings.security.mfaRename")}
                      className="text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => openFactorRemoval(factor.id)}
                    disabled={removalBusy || removalPreparing || renameBusy}
                    className="w-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive sm:w-auto"
                  >
                    <X className="size-3.5" />
                    {t("settings.security.mfaDisable")}
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 rounded-xl bg-amber-500/[0.06] p-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-2.5">
              <KeyRound className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-400">
                {t("settings.security.mfaBackupWarning")}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={openEnrollment}
              className="w-full shrink-0 gap-2 sm:w-auto"
            >
              <Plus className="size-4" />
              {t("settings.security.mfaAddBackup")}
            </Button>
          </div>
        </div>
      ) : null}

      {!loading && factors.length === 0 && !setupOpen ? (
        <div className="flex flex-col gap-3 rounded-xl bg-muted/25 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Smartphone className="size-4" />
            </span>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {t("settings.security.mfaEnable")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("settings.security.mfaEnabledHint")}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={openEnrollment}
            className="w-full shrink-0 gap-2 sm:w-auto"
          >
            <Plus className="size-4" />
            {t("settings.security.mfaEnable")}
          </Button>
        </div>
      ) : null}

      <MfaSetupDialog
        open={setupOpen}
        onOpenChange={setSetupOpen}
        onComplete={() => void loadFactors()}
      />

      <ConfirmDialog
        open={factorToRemove !== null}
        onOpenChange={(open) => {
          if (!open && !removalBusy) clearFactorRemoval();
        }}
        title={t("settings.security.mfaDisableConfirmTitle")}
        description={t("settings.security.mfaDisableVerificationDescription")}
        icon={<Icon icon={ShieldCheck} className="size-5" />}
        confirmLabel={
          <>
            {removalBusy ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <X className="size-4" />
            )}
            {removalBusy
              ? t("settings.security.mfaDisabling")
              : t("settings.security.mfaDisable")}
          </>
        }
        onConfirm={() => void removeFactor()}
        closeOnConfirm={false}
        confirmDisabled={
          removalBusy ||
          removalPreparing ||
          (!removalVerified &&
            (removalChallengeId === null ||
              removalCode.length !== OTP_CODE_LENGTH))
        }
        cancelDisabled={removalBusy}
      >
        <div className="space-y-3">
          <FormField
            label={t("settings.security.mfaChallengeCodeLabel")}
            required
          >
            <SegmentedCodeInput
              value={removalCode}
              onChange={(nextCode) => {
                setRemovalCode(nextCode);
                if (removalError) setRemovalError(null);
              }}
              onComplete={(completeCode) => {
                void removeFactor(completeCode);
              }}
              disabled={removalBusy || removalPreparing || removalVerified}
              label={t("settings.security.mfaChallengeCodeLabel")}
              invalid={Boolean(removalError)}
              errorMessage={removalError}
              autoFocus
              className="justify-center sm:justify-center"
            />
          </FormField>
          <p className="text-xs text-muted-foreground">
            {removalPreparing
              ? t("settings.security.mfaChallengeChecking")
              : t("settings.security.mfaChallengeDescription")}
          </p>
        </div>
      </ConfirmDialog>
    </div>
  );
}
