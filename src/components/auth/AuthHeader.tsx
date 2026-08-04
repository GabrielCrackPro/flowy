"use client";

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { OAuthButtons } from "./OAuthButtons";

const AUTH_CONTENT = {
  login: {
    titleKey: "formTitle",
    subtitleKey: "formDescription",
  },
  register: {
    titleKey: "formTitle",
    subtitleKey: "formDescription",
  },
} as const;

interface AuthHeaderProps {
  type: keyof typeof AUTH_CONTENT;
}

export function AuthHeader({ type }: AuthHeaderProps) {
  const { t } = useTranslation("auth");
  const config = AUTH_CONTENT[type];
  const title = t(`${type}.${config.titleKey}`);
  const subtitle = t(`${type}.${config.subtitleKey}`);

  return (
    <header className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-3"
      >
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          {title}
        </h1>

        <p className="text-base leading-6 text-muted-foreground">{subtitle}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <OAuthButtons />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="relative"
      >
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/60" />
        </div>

        <div className="relative flex justify-center">
          <span className="bg-background px-4 text-sm text-muted-foreground">
            {t("common.orContinue")}
          </span>
        </div>
      </motion.div>
    </header>
  );
}
