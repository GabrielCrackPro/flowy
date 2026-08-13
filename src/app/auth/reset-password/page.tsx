"use client";

import { Button, Input } from "@components/ui";
import { FormAlert, FormField } from "@components/ui/form";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/shared";
import { useReactForm } from "@/hooks/useReactForm";
import { translateAuthError } from "@/lib/auth/errors";
import { ArrowLeft, Eye, EyeOff, KeyRound, Loader2, Lock } from "@/lib/icons";
import { createResetPasswordSchema } from "@/lib/schemas/auth";
import { updatePassword } from "@/lib/supabase/auth";

export default function ResetPasswordPage() {
  const { t } = useTranslation("auth");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [completed, setCompleted] = useState(false);
  const schema = useMemo(() => createResetPasswordSchema(t), [t]);

  useEffect(() => {
    document.title = t("pageTitles.resetPassword");
  }, [t]);

  const form = useReactForm({
    initialValues: { newPassword: "", confirmPassword: "" },
    schema,
    onSubmit: async (values) => {
      const { error } = await updatePassword(values.newPassword);
      if (error) {
        form.setError(translateAuthError(error, t));
        return;
      }
      setCompleted(true);
      form.reset();
    },
  });

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {t("resetPassword.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("resetPassword.description")}
        </p>
      </div>

      <FormAlert message={form.error} variant="error" />
      <FormAlert
        message={completed ? t("resetPassword.successMessage") : null}
        variant="success"
      />

      {completed ? (
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <Icon icon={ArrowLeft} className="size-4" />
          {t("resetPassword.backToLogin")}
        </Link>
      ) : (
        <form
          onSubmit={(event) => void form.handleSubmit(event)}
          className="space-y-5"
        >
          <FormField
            label={t("resetPassword.newPasswordLabel")}
            error={form.errors.newPassword}
            required
          >
            <Input
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              value={form.values.newPassword}
              onChange={form.handleChange("newPassword")}
              disabled={form.busy}
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
                  onClick={() => setShowPassword((value) => !value)}
                  className="flex items-center text-muted-foreground hover:text-foreground"
                >
                  <Icon icon={showPassword ? EyeOff : Eye} className="size-4" />
                </button>
              }
              className="h-11"
            />
          </FormField>

          <FormField
            label={t("resetPassword.confirmPasswordLabel")}
            error={form.errors.confirmPassword}
            required
          >
            <Input
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              value={form.values.confirmPassword}
              onChange={form.handleChange("confirmPassword")}
              disabled={form.busy}
              startIcon={<Icon icon={Lock} className="size-4" />}
              endIcon={
                <button
                  type="button"
                  aria-label={
                    showConfirm
                      ? t("common.hidePassword")
                      : t("common.showPassword")
                  }
                  aria-pressed={showConfirm}
                  onClick={() => setShowConfirm((value) => !value)}
                  className="flex items-center text-muted-foreground hover:text-foreground"
                >
                  <Icon icon={showConfirm ? EyeOff : Eye} className="size-4" />
                </button>
              }
              className="h-11"
            />
          </FormField>

          <Button
            type="submit"
            className="h-11 w-full text-base"
            disabled={form.busy}
          >
            {form.busy ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {t("resetPassword.submittingButton")}
              </>
            ) : (
              <>
                {t("resetPassword.submitButton")}
                <KeyRound className="ml-2 size-4" />
              </>
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
