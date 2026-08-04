import { es } from "date-fns/locale/es";
import { useMemo } from "react";

export function useDateLocale(locale: string) {
  return useMemo(
    () => (locale.toLowerCase().startsWith("es") ? es : undefined),
    [locale],
  );
}
