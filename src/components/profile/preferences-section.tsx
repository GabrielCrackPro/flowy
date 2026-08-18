"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Icon, type IconProps } from "@/components/shared";
import {
  CurrencySelect,
  LanguageSelect,
} from "@/components/shared/preference-selects";
import { useLocaleContext } from "@/context/LocaleContext";
import { useProfile } from "@/hooks/useProfile";
import { Coins, Languages, Palette, Settings2 } from "@/lib/icons";
import { ThemeCustomizationSheet } from "./theme-customization-modal";

function PreferenceRow({
  icon,
  title,
  hint,
  control,
}: {
  icon: IconProps["icon"];
  title: string;
  hint: string;
  control: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border/40 bg-muted/20 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon icon={icon} className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

/**
 * App-wide preferences (theme, language, currency) behind the `#preferences`
 * anchor used by the profile menus. Kept as standalone rows so each setting
 * applies immediately without entering the profile edit form.
 */
export function PreferencesSection() {
  const { t } = useTranslation();
  const { locale, setLocale } = useLocaleContext();
  const { profile, update } = useProfile();
  const router = useRouter();

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
          icon={Languages}
          title={t("settings.preferences.localeLabel")}
          hint={t("settings.preferences.localeHint")}
          control={
            <LanguageSelect
              withIcon={false}
              className="h-9 w-28"
              value={locale}
              ariaLabel={t("settings.preferences.localeLabel")}
              onValueChange={(value) => {
                void (async () => {
                  await setLocale(value);
                  router.refresh();
                })();
              }}
            />
          }
        />

        <PreferenceRow
          icon={Coins}
          title={t("settings.preferences.currencyLabel")}
          hint={t("settings.preferences.currencyHint")}
          control={
            <CurrencySelect
              compact
              withIcon={false}
              value={profile?.currency || "USD"}
              displayLocale={locale}
              ariaLabel={t("settings.preferences.currencyLabel")}
              onValueChange={(value) => {
                void update({ currency: value });
              }}
            />
          }
        />
      </CardContent>
    </Card>
  );
}
