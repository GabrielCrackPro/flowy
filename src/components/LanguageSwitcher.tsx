"use client";

import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { LanguageSelect } from "@/components/shared/preference-selects";
import { useLocaleContext } from "@/context/LocaleContext";
import { useProfile } from "@/hooks/useProfile";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocaleContext();
  const { profile } = useProfile();
  const { t } = useTranslation();
  const router = useRouter();

  if (profile?.showLanguageSelector === false) {
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
