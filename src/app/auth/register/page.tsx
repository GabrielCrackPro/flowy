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
import { createRegisterSchema } from "@lib/schemas";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/shared";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
} from "@/lib/icons";
import { signUpWithEmail } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useTranslation("auth");

  const registerSchema = useMemo(() => createRegisterSchema(t), [t]);

  const { user, loading } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    document.title = t("pageTitles.register");
  }, [t]);

  const form = useReactForm({
    initialValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      acceptedTerms: false,
    },
    schema: registerSchema,
    onSubmit: async (values) => {
      const { data, error } = await signUpWithEmail(
        values.email,
        values.password,
        values.fullName,
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

      form.setStatus(t("register.statusCreated"));
    },
  });

  const { form: rhfForm, error, status, busy, handleSubmit } = form;

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {t("register.formTitle")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("register.formDescription")}
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
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>{t("common.fullNameLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      autoComplete="name"
                      startIcon={<Icon icon={User} className="size-4" />}
                      placeholder={t("common.fullNamePlaceholder")}
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
          >
            <RHFFormField
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>{t("common.passwordLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      type={showPassword ? "text" : "password"}
                      autoComplete={showPassword ? "off" : "new-password"}
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
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <RHFFormField
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel required>
                    {t("common.confirmPasswordLabel")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete={
                        showConfirmPassword ? "off" : "new-password"
                      }
                      startIcon={<Icon icon={Lock} className="size-4" />}
                      endIcon={
                        <button
                          type="button"
                          aria-label={
                            showConfirmPassword
                              ? t("common.hidePassword")
                              : t("common.showPassword")
                          }
                          aria-pressed={showConfirmPassword}
                          onClick={() => setShowConfirmPassword((v) => !v)}
                          className="flex items-center text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {showConfirmPassword ? (
                            <Icon icon={EyeOff} className="size-4" />
                          ) : (
                            <Icon icon={Eye} className="size-4" />
                          )}
                        </button>
                      }
                      placeholder={t("common.confirmPasswordPlaceholder")}
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
            transition={{ duration: 0.3, delay: 0.35 }}
          >
            <RHFFormField
              name="acceptedTerms"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <label className="flex items-start gap-3 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="mt-0.5 size-4 rounded border-border"
                      />
                      <span>{t("common.acceptTerms")}</span>
                    </label>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Button
              type="submit"
              className="h-11 w-full text-base"
              disabled={busy}
            >
              {busy ? (
                <>
                  <Icon icon={Loader2} className="mr-2 size-4 animate-spin" />
                  {t("common.creatingAccount")}
                </>
              ) : (
                <>
                  {t("common.submitRegister")}
                  <Icon icon={ArrowRight} className="ml-2 size-4" />
                </>
              )}
            </Button>
          </motion.div>
        </form>
      </Form>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.45 }}
        className="text-center"
      >
        <p className="text-sm text-muted-foreground">
          {t("common.haveAccount")}{" "}
          <Link
            href="/auth/login"
            className="font-semibold text-primary hover:underline transition-colors"
          >
            {t("register.haveAccountLink")}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
