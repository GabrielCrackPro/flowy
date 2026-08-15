"use client";

import { Button } from "@components/ui";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/shared/icon";
import { useIsMobile } from "@/hooks/useIsMobile";
import { ArrowLeft } from "@/lib/icons";

interface BackHeaderProps {
  title: string;
  /** Optional explicit destination. Falls back to router.back() when omitted. */
  href?: string;
  /** Optional actions rendered on the right side. */
  actions?: React.ReactNode;
}

export function BackHeader({ title, href, actions }: BackHeaderProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  if (isMobile) {
    return actions ? (
      <div className="flex justify-end gap-1">{actions}</div>
    ) : null;
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        <Button
          variant="ghost"
          size="icon-lg"
          aria-label={t("common.back")}
          className="shrink-0 rounded-full text-muted-foreground/60 transition-colors hover:text-foreground"
          onClick={() => (href ? router.push(href) : router.back())}
        >
          <Icon
            icon={ArrowLeft}
            className="size-5 transition-transform duration-200 group-hover/button:-translate-x-0.5"
          />
        </Button>

        <h1 className="truncate text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h1>
      </div>

      {actions ? (
        <div className="flex shrink-0 items-center gap-1">{actions}</div>
      ) : null}
    </div>
  );
}
