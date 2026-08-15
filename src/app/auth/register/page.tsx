"use client";

import {
  Button,
  Checkbox,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui";
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
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { Icon } from "@/components/shared";
import { updateProfile } from "@/lib/api/profile";
import { translateAuthError } from "@/lib/auth/errors";
import { getLocaleCookie, getLocaleStorage, normalizeLocale } from "@/lib/i18n";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
} from "@/lib/icons";
import {
  CURRENCIES,
  currencyName,
  detectCurrency,
  LOCALES,
  languageName,
} from "@/lib/preferences";
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
      // Server-stable defaults; the real detected values are applied after
      // mount (see below) so the initial HTML and client render match.
      locale: "es",
      currency: "USD",
      acceptedTerms: false,
    },
    schema: registerSchema,
    onSubmit: async (values) => {
      const { data, error } = await signUpWithEmail(
        values.email,
        values.password,
        values.fullName,
        { currency: values.currency, locale: values.locale },
      );

      if (error) {
        form.setError(translateAuthError(error, t));
        return;
      }

      if (data.session && data.user) {
        // Belt-and-suspenders: the profile trigger (migration 016) already
        // copies currency/locale from the auth metadata at signup time, so
        // this PATCH only matters for databases that haven't applied it yet.
        try {
          await updateProfile(data.user.id, {
            currency: values.currency,
            locale: values.locale,
          });
        } catch {
          // Ignore — the metadata path still applies.
        }
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      form.setStatus(t("register.statusCreated"));
    },
  });

  // Hydration-safe preference detection: runs once after mount, then syncs
  // the detected language/currency into the form fields.
  const appliedPreferences = useRef(false);
  useEffect(() => {
    if (appliedPreferences.current) return;
    appliedPreferences.current = true;

    const browserLanguage =
      typeof navigator !== "undefined" ? navigator.language : "";
    const storedLocale = getLocaleStorage() ?? getLocaleCookie();
    form.setFieldValue(
      "locale",
      normalizeLocale(storedLocale ?? (browserLanguage || undefined)),
    );
    form.setFieldValue(
      "currency",
      detectCurrency(browserLanguage || storedLocale || "es"),
    );
  }, [form]);

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
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.325 }}
          >
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-foreground">
                {t("register.preferencesTitle")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("register.preferencesHint")}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.375 }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <RHFFormField
                name="locale"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>{t("register.localeLabel")}</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          if (value !== null) field.onChange(value);
                        }}
                      >
                        <SelectTrigger
                          className="h-11 w-full"
                          aria-label={t("register.localeLabel")}
                        >
                          <SelectValue
                            placeholder={form.values.locale}
                            options={LOCALES.map((locale) => ({
                              value: locale,
                              label: languageName(locale, form.values.locale),
                            }))}
                          />
                        </SelectTrigger>
                        <SelectContent className="w-full">
                          {LOCALES.map((locale) => (
                            <SelectItem key={locale} value={locale}>
                              {languageName(locale, form.values.locale)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <RHFFormField
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>
                      {t("register.currencyLabel")}
                    </FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          if (value !== null) field.onChange(value);
                        }}
                      >
                        <SelectTrigger
                          className="h-11 w-full"
                          aria-label={t("register.currencyLabel")}
                        >
                          <SelectValue
                            placeholder={form.values.currency}
                            options={CURRENCIES.map((currency) => ({
                              value: currency,
                              label: `${currencyName(currency, form.values.locale)} (${currency})`,
                            }))}
                          />
                        </SelectTrigger>
                        <SelectContent className="w-full">
                          {CURRENCIES.map((currency) => (
                            <SelectItem key={currency} value={currency}>
                              {currencyName(currency, form.values.locale)} (
                              {currency})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <RHFFormField
              name="acceptedTerms"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormControl>
                    <label
                      htmlFor="accepted-terms"
                      className="flex items-start gap-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <Checkbox
                        id="accepted-terms"
                        name={field.name}
                        checked={field.value}
                        onCheckedChange={(checked) =>
                          field.onChange(checked === true)
                        }
                        aria-invalid={fieldState.invalid || undefined}
                        className="mt-0.5"
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

      <OAuthButtons />

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
