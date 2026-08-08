"use client";

import { useTranslation } from "react-i18next";
import { Icon } from "@/components/shared";
import { toast } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useLocaleContext } from "@/context/LocaleContext";
import { useProfile } from "@/hooks/useProfile";
import { useReactForm } from "@/hooks/useReactForm";
import { AtSign, Languages, UserRound } from "@/lib/icons";
import { updateProfileSchema } from "@/lib/schemas/profile";
import type { Profile } from "@/types/Profile";
import { AvatarUploader } from "./avatar-uploader";

interface ProfileFormProps {
  profile: Profile;
  onCancel?: () => void;
  onSuccess?: () => void;
}

const CURRENCIES = [
  "EUR",
  "USD",
  "GBP",
  "MXN",
  "ARS",
  "CLP",
  "COP",
  "BRL",
  "CAD",
  "AUD",
  "CHF",
  "JPY",
  "PEN",
  "UYU",
];

const LOCALES = ["es", "en"] as const;

function currencyName(code: string, locale: string): string {
  try {
    return (
      new Intl.DisplayNames([locale], { type: "currency" }).of(code) ?? code
    );
  } catch {
    return code;
  }
}

function languageName(code: string, locale: string): string {
  try {
    return (
      new Intl.DisplayNames([locale], { type: "language" }).of(code) ?? code
    );
  } catch {
    return code;
  }
}

export function ProfileForm({
  profile,
  onCancel,
  onSuccess,
}: ProfileFormProps) {
  const { t } = useTranslation();
  const { update } = useProfile();
  const { locale: appLocale } = useLocaleContext();

  const form = useReactForm({
    initialValues: {
      name: profile.name || "",
      avatarUrl: profile.avatarUrl,
      currency: profile.currency || "USD",
      locale: profile.locale || "es",
      showLanguageSelector: profile.showLanguageSelector ?? true,
    },
    schema: updateProfileSchema,
    onSubmit: async (values) => {
      await update({
        name: values.name || null,
        avatarUrl: values.avatarUrl || null,
        currency: values.currency,
        locale: values.locale,
        showLanguageSelector: values.showLanguageSelector,
      });
      toast.success(t("settings.profile.updateSuccess"));
      onSuccess?.();
    },
  });

  return (
    <form onSubmit={form.handleSubmit} className="space-y-5">
      <AvatarUploader
        profile={profile}
        value={form.values.avatarUrl}
        onChange={form.handleValueChange("avatarUrl")}
        disabled={form.busy}
      />

      <div className="space-y-4">
        <FormField
          label={t("settings.profile.nameLabel")}
          error={form.errors.name}
          hint={t("settings.profile.nameHint")}
        >
          <Input
            type="text"
            value={form.values.name}
            onChange={form.handleChange("name")}
            placeholder={t("settings.profile.namePlaceholder")}
            disabled={form.busy}
            startIcon={<Icon icon={UserRound} className="size-4" />}
          />
        </FormField>

        <FormField
          label={t("settings.profile.emailLabel")}
          hint={t("settings.profile.emailHint")}
        >
          <Input
            type="email"
            value={profile.email || ""}
            disabled
            className="bg-muted/50"
            startIcon={<Icon icon={AtSign} className="size-4" />}
          />
        </FormField>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label={t("settings.profile.currencyLabel")}
            error={form.errors.currency}
          >
            <Select
              value={form.values.currency}
              onValueChange={(val) => {
                if (val !== null) form.handleValueChange("currency")(val);
              }}
            >
              <SelectTrigger
                className="h-11 w-full"
                aria-label={t("settings.profile.currencyLabel")}
              >
                <SelectValue
                  placeholder={form.values.currency || "USD"}
                  options={CURRENCIES.map((currency) => ({
                    value: currency,
                    label: `${currencyName(currency, appLocale)} (${currency})`,
                  }))}
                />
              </SelectTrigger>
              <SelectContent className="w-full">
                {CURRENCIES.map((currency) => (
                  <SelectItem key={currency} value={currency}>
                    {currencyName(currency, appLocale)} ({currency})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField
            label={t("settings.profile.localeLabel")}
            error={form.errors.locale}
          >
            <Select
              value={form.values.locale}
              onValueChange={(val) => {
                if (val !== null) form.handleValueChange("locale")(val);
              }}
            >
              <SelectTrigger
                className="h-11 w-full"
                aria-label={t("settings.profile.localeLabel")}
              >
                <SelectValue
                  placeholder="es"
                  options={LOCALES.map((locale) => ({
                    value: locale,
                    label: languageName(locale, appLocale),
                  }))}
                />
              </SelectTrigger>
              <SelectContent className="w-full">
                {LOCALES.map((locale) => (
                  <SelectItem key={locale} value={locale}>
                    {languageName(locale, appLocale)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </div>

        <div className="rounded-xl border border-border/50 bg-muted/20 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Icon icon={Languages} className="size-4" />
                {t("settings.profile.showLanguageSelectorLabel")}
              </div>
              <p className="text-sm text-muted-foreground">
                {t("settings.profile.showLanguageSelectorHint")}
              </p>
            </div>
            <Switch
              checked={form.values.showLanguageSelector}
              onCheckedChange={(checked) => {
                form.handleValueChange("showLanguageSelector")(checked);
              }}
              aria-label={t("settings.profile.showLanguageSelectorLabel")}
            />
          </div>
        </div>
      </div>

      {form.error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {form.error}
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            form.reset();
            onCancel?.();
          }}
          disabled={form.busy}
        >
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={form.busy}>
          {form.busy
            ? t("settings.profile.saving")
            : t("settings.profile.save")}
        </Button>
      </div>
    </form>
  );
}
