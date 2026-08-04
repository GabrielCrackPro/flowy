"use client";

import { Icon } from "@/components/shared";
import { useLocaleContext } from "@/context/LocaleContext";
import { useProfile } from "@/hooks/useProfile";
import { Languages } from "@/lib/icons";
import { Select, SelectContent, SelectItem, SelectTrigger } from "./ui";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocaleContext();
  const { profile } = useProfile();

  if (profile?.showLanguageSelector === false) {
    return null;
  }

  return (
    <Select
      value={locale}
      onValueChange={(value) => setLocale(value as "es" | "en")}
    >
      <SelectTrigger className="h-8 w-auto gap-1.5 rounded-lg border-0 bg-none px-2 shadow-none hover:bg-accent focus:ring-0">
        <Icon icon={Languages} className="size-4" />
        <span className="hidden text-xs font-semibold uppercase tracking-wider sm:inline">
          {locale.toUpperCase()}
        </span>
      </SelectTrigger>

      <SelectContent align="end">
        <SelectItem value="es">ES</SelectItem>
        <SelectItem value="en">EN</SelectItem>
      </SelectContent>
    </Select>
  );
}
