"use client";

import { AuthHeader } from "@components/auth";
import { Button, Input } from "@components/ui";
import { FormAlert, FormField } from "@components/ui/form";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/shared";
import { ArrowLeft, Mail } from "@/lib/icons";
import { resetPassword } from "@/lib/supabase";

export default function ForgotPasswordPage() {
  const { t } = useTranslation("auth");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "Recuperar contraseña | Flowy";
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const { error: err } = await resetPassword(email);

    if (err) {
      setError(err.message);
      setBusy(false);
      return;
    }

    setSent(true);
    setBusy(false);
  }

  return (
    <div className="space-y-8">
      <AuthHeader type="login" />

      <FormAlert message={error} variant="error" />

      {sent ? (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Te hemos enviado un enlace de recuperación a{" "}
            <span className="font-medium text-foreground">{email}</span>. Revisa
            tu bandeja de entrada.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
          >
            <Icon icon={ArrowLeft} className="h-4 w-4" />
            Volver al inicio de sesión
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <FormField label={t("common.emailLabel")} required>
            <Input
              type="email"
              startIcon={<Icon icon={Mail} className="h-4 w-4" />}
              placeholder={t("common.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </FormField>

          <Button
            type="submit"
            className="h-11 w-full"
            disabled={busy || !email}
          >
            {busy ? "Enviando…" : "Enviar enlace de recuperación"}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            <Link
              href="/auth/login"
              className="font-medium text-primary hover:underline"
            >
              Volver al inicio de sesión
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
