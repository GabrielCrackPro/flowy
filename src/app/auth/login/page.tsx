"use client";

import { Button, Checkbox, Input } from "@components/ui";
import {
  Form,
  FormAlert,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
  RHFFormField,
} from "@components/ui/form";
import { useAuth } from "@hooks/useAuth";
import { useReactForm } from "@hooks/useReactForm";
import { createLoginSchema } from "@lib/schemas";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { Icon } from "@/components/shared";
import { translateAuthError } from "@/lib/auth/errors";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from "@/lib/icons";
import { signInWithEmail } from "@/lib/supabase/auth";
import { getMfaAssuranceLevel } from "@/lib/supabase/mfa";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation("auth");

  const loginSchema = useMemo(() => createLoginSchema(t), [t]);

  const { user, loading } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [authFlow, setAuthFlow] = useState<"idle" | "submitting" | "routing">(
    "idle",
  );

  useEffect(() => {
    document.title = t("pageTitles.login");
  }, [t]);

  const form = useReactForm({
    initialValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
    schema: loginSchema,
    onSubmit: async (values) => {
      setAuthFlow("submitting");
      const { data, error } = await signInWithEmail(
        values.email,
        values.password,
        values.rememberMe,
      );

      if (error) {
        setAuthFlow("idle");
        form.setError(translateAuthError(error, t));
        return;
      }

      if (data.session) {
        const { data: assurance, error: assuranceError } =
          await getMfaAssuranceLevel();
        const requiresMfa =
          assuranceError ||
          (assurance.nextLevel === "aal2" && assurance.currentLevel !== "aal2");

        setAuthFlow("routing");
        router.replace(
          requiresMfa
            ? `/auth/mfa?next=${encodeURIComponent("/dashboard")}`
            : "/dashboard",
        );
        return;
      }

      setAuthFlow("idle");
      form.setStatus(t("login.statusEmailSent"));
    },
  });

  const callbackError = searchParams.get("error") === "callback";
  const { form: rhfForm, error, status, busy, handleSubmit } = form;

  useEffect(() => {
    if (!loading && user && authFlow === "idle") {
      router.replace("/dashboard");
    }
  }, [authFlow, loading, user, router]);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {t("login.formTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("login.formDescription")}
        </p>
      </div>

      <div>
        <FormAlert
          message={callbackError ? t("login.callbackError") : error}
          variant="error"
        />
        <FormAlert message={status} variant="success" />
      </div>

      <Form {...rhfForm}>
        <form onSubmit={(e) => handleSubmit(e)} className="space-y-4">
          <div>
            <RHFFormField
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>{t("common.emailLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      startIcon={<Icon icon={Mail} className="size-4" />}
                      placeholder={t("common.emailPlaceholder")}
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div>
            <RHFFormField
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>{t("common.passwordLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      type={showPassword ? "text" : "password"}
                      autoComplete={showPassword ? "off" : "current-password"}
                      startIcon={<Icon icon={Lock} className="size-4" />}
                      endIcon={
                        <button
                          type="button"
                          aria-label={
                            showPassword
                              ? t("common.hidePassword")
                              : t("common.showPassword")
                          }
                          aria-pressed={showPassword}
                          onClick={() => setShowPassword((v) => !v)}
                          className="flex items-center text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {showPassword ? (
                            <Icon icon={EyeOff} className="size-4" />
                          ) : (
                            <Icon icon={Eye} className="size-4" />
                          )}
                        </button>
                      }
                      placeholder={t("common.passwordPlaceholder")}
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex items-center justify-between">
            <RHFFormField
              name="rememberMe"
              render={({ field, fieldState }) => (
                <label
                  htmlFor="remember-me"
                  className="flex min-h-8 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Checkbox
                    id="remember-me"
                    name={field.name}
                    checked={field.value}
                    onCheckedChange={(checked) =>
                      field.onChange(checked === true)
                    }
                    aria-invalid={fieldState.invalid || undefined}
                  />
                  <span>{t("common.rememberMe")}</span>
                </label>
              )}
            />

            <Link
              href="/auth/forgot-password"
              className="text-sm font-medium text-primary hover:underline transition-colors"
            >
              {t("common.forgotPassword")}
            </Link>
          </div>

          <div>
            <Button
              type="submit"
              className="h-11 w-full text-base"
              disabled={busy}
            >
              {busy ? (
                <>
                  <Icon icon={Loader2} className="mr-2 size-4 animate-spin" />
                  {t("common.submitting")}
                </>
              ) : (
                <>
                  {t("common.submitLogin")}
                  <Icon icon={ArrowRight} className="ml-2 size-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>

      <OAuthButtons />

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {t("common.noAccount")}{" "}
          <Link
            href="/auth/register"
            className="font-semibold text-primary hover:underline transition-colors"
          >
            {t("login.createAccountLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
