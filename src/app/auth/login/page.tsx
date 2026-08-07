"use client";

import { Button, Input } from "@components/ui";
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
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/shared";
import { ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from "@/lib/icons";
import { signInWithEmail } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation("auth");

  const loginSchema = useMemo(() => createLoginSchema(t), [t]);

  const { user, loading } = useAuth();

  const [showPassword, setShowPassword] = useState(false);

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
      const { data, error } = await signInWithEmail(
        values.email,
        values.password,
        values.rememberMe,
      );

      if (error) {
        form.setError(error.message);
        return;
      }

      if (data.session) {
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      form.setStatus(t("login.statusEmailSent"));
    },
  });

  const { form: rhfForm, error, status, busy, handleSubmit } = form;

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {t("login.formTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("login.formDescription")}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <FormAlert message={error} variant="error" />
        <FormAlert message={status} variant="success" />
      </motion.div>

      <Form {...rhfForm}>
        <form onSubmit={(e) => handleSubmit(e)} className="space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
          >
            <RHFFormField
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>{t("common.emailLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      startIcon={<Icon icon={Mail} className="h-4 w-4" />}
                      placeholder={t("common.emailPlaceholder")}
                      className="h-11"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <RHFFormField
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>{t("common.passwordLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      type={showPassword ? "text" : "password"}
                      startIcon={<Icon icon={Lock} className="h-4 w-4" />}
                      endIcon={
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="flex items-center text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {showPassword ? (
                            <Icon icon={EyeOff} className="h-4 w-4" />
                          ) : (
                            <Icon icon={Eye} className="h-4 w-4" />
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
            className="flex items-center justify-between"
          >
            <RHFFormField
              name="rememberMe"
              render={({ field }) => (
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-4 w-4 rounded border-border"
                  />
                  {t("common.rememberMe")}
                </label>
              )}
            />

            <Link
              href="/auth/forgot-password"
              className="text-sm font-medium text-primary hover:underline transition-colors"
            >
              {t("common.forgotPassword")}
            </Link>
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
              {busy ? (
                <>
                  <Icon icon={Loader2} className="mr-2 h-4 w-4 animate-spin" />
                  {t("common.submitting")}
                </>
              ) : (
                <>
                  {t("common.submitLogin")}
                  <Icon icon={ArrowRight} className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </motion.div>
        </form>
      </Form>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.35 }}
        className="text-center"
      >
        <p className="text-sm text-muted-foreground">
          {t("common.noAccount")}{" "}
          <Link
            href="/auth/register"
            className="font-semibold text-primary hover:underline transition-colors"
          >
            {t("login.createAccountLink")}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
