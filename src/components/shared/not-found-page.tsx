"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Droplet, Home, Search, Wallet } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { DecorativeBackdrop } from "./decorative-backdrop";
import { Icon } from "./icon";

interface NotFoundPageProps {
  /** Override the container min-height (e.g. outside the dashboard layout). */
  className?: string;
  /** Show the decorative background (gradient + dot pattern). */
  decorative?: boolean;
}

/**
 * Branded 404 state shared by the root and dashboard not-found boundaries.
 * Visual style matches FullPageError for consistency.
 */
export function NotFoundPage({
  className,
  decorative = true,
}: NotFoundPageProps) {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    document.title = `${t("notFound.title")} | Flowy`;
  }, [t]);

  return (
    <div
      className={cn(
        "relative flex min-h-[calc(100vh-8rem)] items-center justify-center overflow-hidden px-4 py-16",
        className,
      )}
    >
      {decorative ? <DecorativeBackdrop tint="primary" /> : null}

      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative flex w-full max-w-lg flex-col items-center gap-8 text-center"
      >
        {/* Icon tile with glow — matches FullPageError */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative"
        >
          <motion.div
            animate={
              prefersReducedMotion
                ? undefined
                : { scale: [1, 1.05, 1], opacity: [0.5, 0.8, 0.5] }
            }
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full bg-primary/20 blur-xl"
          />
          <div className="relative flex size-20 items-center justify-center rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 text-primary shadow-lg shadow-primary/20">
            <motion.div
              animate={
                prefersReducedMotion ? undefined : { rotate: [0, 5, -5, 0] }
              }
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Icon icon={Search} className="size-10" />
            </motion.div>
          </div>
        </motion.div>

        {/* Brand badge — matches FullPageError */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center gap-2 rounded-full border border-border/30 bg-gradient-to-r from-card/80 to-card/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm shadow-md"
        >
          <motion.div
            animate={prefersReducedMotion ? undefined : { rotate: [0, 360] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md"
          >
            <Icon icon={Droplet} className="size-3.5" />
          </motion.div>
          Flowy
          <span className="text-muted-foreground/30">·</span>
          <span className="font-semibold text-primary">404</span>
        </motion.div>

        {/* Heading + description */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-y-3"
        >
          <h1 className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl">
            {t("notFound.title")}
          </h1>
          <p className="max-w-sm text-base leading-relaxed text-muted-foreground/80">
            {t("notFound.description")}
          </p>
        </motion.div>

        {/* Action buttons — same gradient style as FullPageError */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4"
        >
          <Link
            href="/dashboard"
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary/90 px-5 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition hover:from-primary/90 hover:to-primary/80 hover:shadow-lg sm:w-auto"
          >
            <Icon icon={Home} className="size-4" />
            {t("notFound.goHome")}
          </Link>

          <button
            type="button"
            onClick={() => history.back()}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border/50 bg-gradient-to-r from-muted/50 to-muted/30 px-5 text-sm font-medium text-foreground shadow-md transition hover:from-muted/60 hover:to-muted/40 hover:shadow-lg sm:w-auto"
          >
            <Icon icon={ArrowLeft} className="size-4" />
            {t("notFound.goBack")}
          </button>
        </motion.div>

        {/* Quick links */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex items-center gap-6 text-xs text-muted-foreground/60"
        >
          <Link
            href="/dashboard/transactions"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 transition-colors hover:bg-muted/30 hover:text-foreground"
          >
            <Icon icon={Wallet} className="size-3" />
            {t("nav.transactions")}
          </Link>
          <span className="size-1 rounded-full bg-border/50" />
          <Link
            href="/dashboard/budgets"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 transition-colors hover:bg-muted/30 hover:text-foreground"
          >
            <Icon icon={Wallet} className="size-3" />
            {t("nav.budgets")}
          </Link>
          <span className="size-1 rounded-full bg-border/50" />
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 transition-colors hover:bg-muted/30 hover:text-foreground"
          >
            <Icon icon={Wallet} className="size-3" />
            {t("nav.settings")}
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
