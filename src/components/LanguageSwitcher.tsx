"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { LanguageSelect } from "@/components/shared/preference-selects";
import { useLocaleContext } from "@/context/LocaleContext";
import { usePreferences } from "@/hooks/usePreferences";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocaleContext();
  const { get } = usePreferences();
  const { t } = useTranslation();
  const router = useRouter();

  if (get("showLanguageSelector") === false) {
    return null;
  }

  return (
    <LanguageSelect
      ghost
      value={locale}
      ariaLabel={t("common.language")}
      onValueChange={(value) => {
        void (async () => {
          await setLocale(value as "es" | "en");
          router.refresh();
        })();
      }}
    />
  );
}
