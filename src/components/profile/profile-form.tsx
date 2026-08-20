"use client";

import { Check as CheckData } from "lucide";
import { useTranslation } from "react-i18next";
import { Icon, LoadingIcon } from "@/components/shared";
import {
  CurrencySelect,
  LanguageSelect,
} from "@/components/shared/preference-selects";
import { toast } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useLocaleContext } from "@/context/LocaleContext";
import { useProfile } from "@/hooks/useProfile";
import { useReactForm } from "@/hooks/useReactForm";
import { AtSign, UserRound, X } from "@/lib/icons";
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
    },
    schema: updateProfileSchema,
    onSubmit: async (values) => {
      await update({
        name: values.name || null,
        avatarUrl: values.avatarUrl || null,
        currency: values.currency,
        locale: values.locale,
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
          <span className="inline-flex items-center gap-1.5">
            <LoadingIcon icon={CheckData} loading={form.busy} size={16} />
            {form.busy
              ? t("settings.profile.saving")
              : t("settings.profile.save")}
          </span>
        </Button>
      </div>
    </form>
  );
}
