"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
import { Switch } from "@components/ui/switch";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { ConfirmDialog, Icon } from "@/components/shared";
import {
  CurrencySelect,
  LanguageSelect,
} from "@/components/shared/preference-selects";
import { Button } from "@/components/ui/button";
import { useLocaleContext } from "@/context/LocaleContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { usePreferences } from "@/hooks/usePreferences";
import { useProfile } from "@/hooks/useProfile";
import {
  Coins,
  Languages,
  Palette,
  PanelLeftClose,
  RotateCcw,
  Settings2,
} from "@/lib/icons";
import { PreferenceRow } from "./preference-row";
import { ThemeCustomizationSheet } from "./theme-customization-modal";

type SavingField = "preference" | "currency" | "locale" | null;

/**
 * App-wide preferences (theme, language, currency) behind the `#preferences`
 * anchor used by the profile menus. Kept as standalone rows so each setting
 * applies immediately without entering the profile edit form.
 */
export function PreferencesSection() {
  const { t } = useTranslation();
  const { locale, setLocale } = useLocaleContext();
  const { profile, update } = useProfile();
  const {
    preferences,
    updatePreferences,
    saving: prefSaving,
  } = usePreferences();
  const { resetOnboarding } = useOnboarding();
  const router = useRouter();
  const [replayOpen, setReplayOpen] = useState(false);
  const [saving, setSaving] = useState<SavingField>(null);

  const withSaving = useCallback(
    async (field: SavingField, fn: () => Promise<void>) => {
      setSaving(field);
      try {
        await fn();
      } finally {
        setSaving(null);
      }
    },
    [],
  );

  const isSaving = saving !== null || prefSaving;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="flex size-6 shrink-0 items-center justify-center text-muted-foreground">
            <Icon icon={Settings2} className="size-4" />
          </span>
          <div className="min-w-0">
            <CardTitle>{t("settings.preferences.title")}</CardTitle>
            <CardDescription>
              {t("settings.preferences.description")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5">
        <PreferenceRow
          icon={Palette}
          title={t("settings.preferences.themeLabel")}
          hint={t("settings.preferences.themeHint")}
          control={<ThemeCustomizationSheet label />}
        />

        <PreferenceRow
          icon={RotateCcw}
          title={t("settings.preferences.replayOnboarding")}
          hint={t("settings.preferences.replayOnboardingHint")}
          control={
            <Button
              variant="ghost"
              className="gap-1.5"
              title={t("settings.preferences.replayOnboarding")}
              onClick={() => setReplayOpen(true)}
            >
              <RotateCcw className="size-4" />
              <span className="hidden sm:inline">
                {t("settings.preferences.replayOnboarding")}
              </span>
            </Button>
          }
        />

        <PreferenceRow
          icon={Languages}
          title={t("settings.preferences.showLanguageSelectorLabel")}
          hint={t("settings.preferences.showLanguageSelectorHint")}
          saving={saving === "preference" && prefSaving}
          control={
            <Switch
              checked={preferences.showLanguageSelector}
              disabled={isSaving}
              onCheckedChange={(checked) => {
                void withSaving("preference", () =>
                  updatePreferences({ showLanguageSelector: checked }),
                );
              }}
              aria-label={t("settings.preferences.showLanguageSelectorLabel")}
            />
          }
        />

        <PreferenceRow
          icon={PanelLeftClose}
          title={t("settings.preferences.sidebarHoverExpandLabel")}
          hint={t("settings.preferences.sidebarHoverExpandHint")}
          saving={saving === "preference" && prefSaving}
          control={
            <Switch
              checked={preferences.sidebarHoverExpand}
              disabled={isSaving}
              onCheckedChange={(checked) => {
                void withSaving("preference", () =>
                  updatePreferences({ sidebarHoverExpand: checked }),
                );
              }}
              aria-label={t("settings.preferences.sidebarHoverExpandLabel")}
            />
          }
        />

        <PreferenceRow
          icon={Languages}
          title={t("settings.preferences.localeLabel")}
          hint={t("settings.preferences.localeHint")}
          saving={saving === "locale"}
          control={
            <LanguageSelect
              withIcon={false}
              className="h-9 w-28"
              value={locale}
              ariaLabel={t("settings.preferences.localeLabel")}
              onValueChange={(value) => {
                void withSaving("locale", async () => {
                  await setLocale(value);
                  router.refresh();
                });
              }}
            />
          }
        />

        <PreferenceRow
          icon={Coins}
          title={t("settings.preferences.currencyLabel")}
          hint={t("settings.preferences.currencyHint")}
          saving={saving === "currency"}
          control={
            <CurrencySelect
              compact
              withIcon={false}
              value={profile?.currency || "USD"}
              displayLocale={locale}
              ariaLabel={t("settings.preferences.currencyLabel")}
              onValueChange={(value) => {
                void withSaving("currency", () => update({ currency: value }));
              }}
            />
          }
        />
      </CardContent>

      <ConfirmDialog
        open={replayOpen}
        onOpenChange={setReplayOpen}
        title={t("settings.preferences.replayOnboarding")}
        description={t("settings.preferences.replayOnboardingConfirm")}
        confirmLabel={t("settings.preferences.replayOnboarding")}
        variant="primary"
        icon={<Icon icon={RotateCcw} className="size-5" />}
        onConfirm={() => {
          void resetOnboarding();
        }}
      />
    </Card>
  );
}
