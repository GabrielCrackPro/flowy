"use client";

import { Button } from "@components/ui/button";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Droplet, Home, Settings, Wallet } from "@/lib/icons";
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
 * Translates all copy, honors prefers-reduced-motion, and links to the
 * main finance destinations.
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

      {/* Large 404 text */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none text-[min(40vw,24rem)] font-bold leading-none tracking-tighter text-border/10"
      >
        4
        <motion.span
          animate={prefersReducedMotion ? undefined : { rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="relative mx-[-0.05em] inline-flex h-[0.85em] w-[0.85em] items-center justify-center rounded-full border-[0.08em] border-primary/20 bg-linear-to-br from-primary/20 to-primary/10 align-middle text-[0.5em] text-primary shadow-lg shadow-primary/20"
        >
          <Icon icon={Droplet} className="h-[0.55em] w-[0.55em]" />
        </motion.span>
        4
      </motion.div>

      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative flex flex-col items-center text-center"
      >
        {/* Brand badge */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex items-center gap-2 rounded-full border border-border/30 bg-linear-to-r from-card/80 to-card/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm shadow-md"
        >
          <motion.div
            animate={prefersReducedMotion ? undefined : { rotate: [0, 360] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="flex size-6 items-center justify-center rounded-full bg-linear-to-br from-primary to-primary/80 text-primary-foreground shadow-md"
          >
            <Icon icon={Droplet} className="size-3.5" />
          </motion.div>
          Flowy
          <span className="text-muted-foreground/30">·</span>
          <span className="font-semibold text-primary">404</span>
        </motion.div>

        {/* Main heading */}
        <motion.h1
          initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl"
        >
          {t("notFound.title")}
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground/80"
        >
          {t("notFound.description")}
        </motion.p>

        {/* Action buttons */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-3"
        >
          <Button
            asChild
            className="group h-11 rounded-full px-6 shadow-lg shadow-primary/20"
          >
            <Link href="/dashboard">
              <motion.div
                className="ml-2"
                whileHover={prefersReducedMotion ? undefined : { x: 3 }}
                transition={{ duration: 0.2 }}
              >
                <Icon icon={Home} className="size-4" />
              </motion.div>
              {t("notFound.goHome")}
            </Link>
          </Button>

          <Button
            variant="outline"
            onClick={() => history.back()}
            className="group h-11 rounded-full border-border/30 px-6 hover:border-border/50"
          >
            <motion.div
              className="mr-2"
              whileHover={prefersReducedMotion ? undefined : { x: -3 }}
              transition={{ duration: 0.2 }}
            >
              <Icon icon={ArrowLeft} className="size-4" />
            </motion.div>
            {t("notFound.goBack")}
          </Button>
        </motion.div>

        {/* Quick links */}
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-16 flex items-center gap-6 text-xs text-muted-foreground/60"
        >
          <motion.div
            whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
          >
            <Link
              href="/dashboard/transactions"
              className="flex items-center gap-1.5 rounded-lg px-2 py-1 transition-colors hover:bg-muted/30 hover:text-foreground"
            >
              <Icon icon={Wallet} className="size-3" />
              {t("nav.transactions")}
            </Link>
          </motion.div>
          <span className="size-1 rounded-full bg-border/50" />
          <motion.div
            whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
          >
            <Link
              href="/dashboard/budgets"
              className="flex items-center gap-1.5 rounded-lg px-2 py-1 transition-colors hover:bg-muted/30 hover:text-foreground"
            >
              <Icon icon={Wallet} className="size-3" />
              {t("nav.budgets")}
            </Link>
          </motion.div>
          <span className="size-1 rounded-full bg-border/50" />
          <motion.div
            whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.95 }}
          >
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-1.5 rounded-lg px-2 py-1 transition-colors hover:bg-muted/30 hover:text-foreground"
            >
              <Icon icon={Settings} className="size-3" />
              {t("nav.settings")}
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
