"use client";

import { Button, Input } from "@components/ui";
import { FormAlert, FormField } from "@components/ui/form";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/shared";
import { translateAuthError } from "@/lib/auth/errors";
import { ArrowLeft, Mail } from "@/lib/icons";
import { resetPassword } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const { t } = useTranslation("auth");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = t("pageTitles.forgotPassword");
  }, [t]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const { error: err } = await resetPassword(email);

    if (err) {
      setError(translateAuthError(err, t));
      setBusy(false);
      return;
    }

    setSent(true);
    setBusy(false);
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {t("forgotPassword.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("forgotPassword.description")}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <FormAlert message={error} variant="error" />
      </motion.div>

      {sent ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="space-y-6"
        >
          <p className="text-sm text-muted-foreground">
            {t("forgotPassword.successMessage")}{" "}
            <span className="font-medium text-foreground">{email}</span>.{" "}
            {t("forgotPassword.successMessagePart2")}
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <Icon icon={ArrowLeft} className="size-4" />
            {t("forgotPassword.backToLogin")}
          </Link>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <FormField
              label={t("forgotPassword.emailLabel")}
              htmlFor="forgot-password-email"
              required
            >
              <Input
                id="forgot-password-email"
                name="email"
                type="email"
                autoComplete="email"
                startIcon={<Icon icon={Mail} className="size-4" />}
                placeholder={t("forgotPassword.emailPlaceholder")}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
              />
            </FormField>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Button
              type="submit"
              className="h-11 w-full text-base"
              disabled={busy}
            >
              {busy
                ? t("forgotPassword.submittingButton")
                : t("forgotPassword.submitButton")}
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="text-center text-sm text-muted-foreground"
          >
            <Link
              href="/auth/login"
              className="font-medium text-primary hover:underline"
            >
              {t("forgotPassword.backToLogin")}
            </Link>
          </motion.p>
        </form>
      )}
    </div>
  );
}
