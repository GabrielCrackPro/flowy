"use client";

import { Button } from "@components/ui";
import { FormAlert, FormField } from "@components/ui/form";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  OTP_CODE_LENGTH,
  OtpCodeInput,
} from "@/components/auth/otp-code-input";
import { Icon } from "@/components/shared";
import { translateMfaError } from "@/lib/auth/errors";
import { ArrowLeft, Loader2, ShieldCheck, Smartphone } from "@/lib/icons";
import { getSession, signOut } from "@/lib/supabase/auth";
import {
  challengeMfa,
  getMfaAssuranceLevel,
  listMfaFactorNames,
  listMfaFactors,
  verifyMfa,
} from "@/lib/supabase/mfa";

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }
  return value;
}

interface ChallengeFactor {
  id: string;
  label: string;
}

function getFactorLabel(
  friendlyName: string | null | undefined,
  index: number,
  t: (key: string, options?: Record<string, number>) => string,
) {
  if (!friendlyName || /^flowy authenticator /i.test(friendlyName)) {
    return t("settings.security.mfaAuthenticatorNumber", {
      number: index + 1,
    });
  }

  return friendlyName;
}

export default function MfaChallengePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const next = getSafeNextPath(searchParams.get("next"));
  const [factorId, setFactorId] = useState<string | null>(null);
  const [factors, setFactors] = useState<ChallengeFactor[]>([]);
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [aborting, setAborting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const prepareChallenge = async () => {
      const session = await getSession();
      if (!session) {
        router.replace("/auth/login");
        return;
      }

      const { data: assurance, error: assuranceError } =
        await getMfaAssuranceLevel();
      if (assuranceError) {
        if (active) {
          setError(translateMfaError(assuranceError, t));
          setChecking(false);
        }
        return;
      }

      if (assurance.currentLevel === "aal2" || assurance.nextLevel !== "aal2") {
        router.replace(next);
        return;
      }

      const [{ data: factorData, error: factorsError }, { data: factorNames }] =
        await Promise.all([listMfaFactors(), listMfaFactorNames()]);
      const verifiedFactors = factorData?.totp.filter(
        (item) => item.status === "verified",
      );
      if (factorsError || !verifiedFactors?.length) {
        if (active) {
          setError(
            factorsError
              ? translateMfaError(factorsError, t)
              : t("settings.security.mfaChallengeNoFactor"),
          );
          setChecking(false);
        }
        return;
      }

      if (active) {
        const challengeFactors = verifiedFactors.map((factor, index) => ({
          id: factor.id,
          label: getFactorLabel(
            factorNames[factor.id] ?? factor.friendly_name,
            index,
            t,
          ),
        }));
        setFactors(challengeFactors);
        setFactorId(challengeFactors[0].id);
        setChecking(false);
      }
    };

    void prepareChallenge();
    return () => {
      active = false;
    };
  }, [next, router, t]);

  const abortChallenge = async () => {
    if (busy || redirecting || aborting) return;

    setAborting(true);
    await signOut("local");
    router.replace("/auth/login");
  };

  const verifyCode = async (submittedCode = code) => {
    if (
      busy ||
      redirecting ||
      !factorId ||
      submittedCode.length !== OTP_CODE_LENGTH
    ) {
      return;
    }

    setBusy(true);
    setError(null);
    const { data: challenge, error: challengeError } =
      await challengeMfa(factorId);

    if (challengeError || !challenge) {
      setBusy(false);
      setError(translateMfaError(challengeError, t));
      return;
    }

    const { error: verifyError } = await verifyMfa(
      factorId,
      challenge.id,
      submittedCode,
    );
    setBusy(false);

    if (verifyError) {
      setError(translateMfaError(verifyError, t));
      return;
    }

    setRedirecting(true);
    router.replace(next);
  };

  return (
    <div className="space-y-8">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => void abortChallenge()}
        disabled={busy || redirecting || aborting}
        className="-ml-2 gap-2 text-muted-foreground hover:text-foreground"
      >
        {aborting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <ArrowLeft className="size-4" />
        )}
        {t("settings.security.mfaChallengeAbort")}
      </Button>

      <div className="space-y-3 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {checking ? (
            <Icon icon={Loader2} className="size-6 animate-spin" />
          ) : (
            <Icon icon={ShieldCheck} className="size-6" />
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {t("settings.security.mfaChallengeTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {checking
            ? t("settings.security.mfaChallengeChecking")
            : t("settings.security.mfaChallengeDescription")}
        </p>
      </div>

      {!factorId ? <FormAlert message={error} variant="error" /> : null}

      {!checking && factorId ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void verifyCode();
          }}
          className="space-y-5"
        >
          {factors.length > 1 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                {t("settings.security.mfaSelectAuthenticator")}
              </p>
              <div
                className="grid gap-2 sm:grid-cols-2"
                role="radiogroup"
                aria-label={t("settings.security.mfaSelectAuthenticator")}
              >
                {factors.map((factor) => (
                  <label
                    key={factor.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      factor.id === factorId
                        ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <input
                      type="radio"
                      name="mfa-factor"
                      value={factor.id}
                      checked={factor.id === factorId}
                      onChange={() => {
                        setFactorId(factor.id);
                        setCode("");
                        setError(null);
                      }}
                      className="sr-only"
                    />
                    <Smartphone className="size-4 shrink-0" />
                    <span>{factor.label}</span>
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          <FormField
            label={t("settings.security.mfaChallengeCodeLabel")}
            required
          >
            <OtpCodeInput
              value={code}
              onChange={(nextCode) => {
                setCode(nextCode);
                if (error) setError(null);
              }}
              onComplete={(completeCode) => {
                void verifyCode(completeCode);
              }}
              disabled={busy || redirecting}
              label={t("settings.security.mfaChallengeCodeLabel")}
              invalid={Boolean(error)}
              errorMessage={error}
              autoFocus
            />
          </FormField>
          <Button
            type="submit"
            className="h-11 w-full"
            disabled={busy || redirecting || code.length !== OTP_CODE_LENGTH}
          >
            {busy ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {t("settings.security.mfaChallengeVerifying")}
              </>
            ) : (
              t("settings.security.mfaChallengeVerify")
            )}
          </Button>
        </form>
      ) : null}

      {error ? (
        <div className="text-center">
          <button
            type="button"
            onClick={() => void abortChallenge()}
            disabled={aborting}
            className="text-sm font-medium text-primary hover:underline disabled:opacity-60"
          >
            {t("settings.security.mfaChallengeBackToLogin")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
