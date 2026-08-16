"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Icon, ThemeToggle } from "@/components/shared";
import { ChangelogContent } from "@/components/shared/changelog-sheet";
import { Droplet } from "@/lib/icons";

export default function ChangelogPage() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto min-h-screen w-full max-w-3xl px-4 py-8 sm:py-12">
      <header className="mb-8 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-foreground transition-opacity hover:opacity-80"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md shadow-primary/20">
            <Icon icon={Droplet} className="size-5" />
          </span>
          <span className="text-lg font-bold tracking-tight">Flowy</span>
          <span className="mt-0.5 hidden rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-muted-foreground sm:inline">
            {t("changelog.title")}
          </span>
        </Link>
        <ThemeToggle />
      </header>

      <ChangelogContent open />

      <footer className="mt-10 flex items-center justify-center border-t border-border/30 pt-6 text-center">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-xs font-medium text-primary/70 transition hover:text-primary hover:underline underline-offset-2"
        >
          <Icon icon={Droplet} className="size-3.5" />
          {t("changelog.backToApp")}
        </Link>
      </footer>
    </div>
  );
}
