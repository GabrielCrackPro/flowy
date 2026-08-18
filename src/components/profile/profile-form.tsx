"use client";

import { useTranslation } from "react-i18next";
import { Icon } from "@/components/shared";
import {
  CurrencySelect,
  LanguageSelect,
} from "@/components/shared/preference-selects";
import { toast } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useLocaleContext } from "@/context/LocaleContext";
import { useProfile } from "@/hooks/useProfile";
import { useReactForm } from "@/hooks/useReactForm";
import { AtSign, Check, Languages, Loader2, UserRound, X } from "@/lib/icons";
import { updateProfileSchema } from "@/lib/schemas/profile";
import type { Profile } from "@/types/Profile";
import { AvatarUploader } from "./avatar-uploader";

interface ProfileFormProps {
  profile: Profile;
  onCancel?: () => void;
  onSuccess?: () => void;
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
            <CurrencySelect
              value={form.values.currency}
              displayLocale={appLocale}
              ariaLabel={t("settings.profile.currencyLabel")}
              onValueChange={(val) => {
                form.handleValueChange("currency")(val);
              }}
            />
          </FormField>

          <FormField
            label={t("settings.profile.localeLabel")}
            error={form.errors.locale}
          >
            <LanguageSelect
              value={form.values.locale}
              className="w-full"
              ariaLabel={t("settings.profile.localeLabel")}
              onValueChange={(val) => {
                form.handleValueChange("locale")(val);
              }}
            />
          </FormField>
        </div>

        <div className="rounded-xl bg-muted/25 p-4">
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

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
        <Button
          type="button"
          variant="ghost"
          className="w-full sm:w-auto"
          onClick={() => {
            form.reset();
            onCancel?.();
          }}
          disabled={form.busy}
        >
          <Icon icon={X} className="size-4" />
          {t("common.cancel")}
        </Button>
        <Button
          type="submit"
          disabled={form.busy}
          className="w-full gap-1.5 sm:w-auto"
        >
          {form.busy ? (
            <>
              <Icon icon={Loader2} className="size-4 animate-spin" />
              {t("settings.profile.saving")}
            </>
          ) : (
            <>
              <Icon icon={Check} className="size-4" />
              {t("settings.profile.save")}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
