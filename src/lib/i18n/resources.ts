import en from "./locales/en";
import es from "./locales/es";

export const resources = {
  es: { auth: es.auth, app: es.app },
  en: { auth: en.auth, app: en.app },
} as const;
