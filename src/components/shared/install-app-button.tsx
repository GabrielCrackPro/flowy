"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { usePwa } from "@/hooks/usePwa";
import { Download, Smartphone } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Icon } from "./icon";

export function InstallAppButton({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { canInstall, isIos, isStandalone, install } = usePwa();

  if (isStandalone) {
    return null;
  }

  const buttonClass = cn("rounded-xl hover:bg-muted/40", className);

  // Chrome/Edge/Android: capture beforeinstallprompt and trigger it directly.
  if (canInstall) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("pwa.install")}
        title={t("pwa.install")}
        className={buttonClass}
        onClick={() => void install()}
      >
        <Icon icon={Download} className="size-4" />
      </Button>
    );
  }

  // iOS Safari has no install prompt: explain Add to Home Screen instead.
  if (isIos) {
    return (
      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label={t("pwa.install")}
              className={buttonClass}
            />
          }
        >
          <Icon icon={Smartphone} className="size-4" />
        </PopoverTrigger>
        <PopoverContent align="end" side="bottom" sideOffset={8}>
          <PopoverHeader>
            <PopoverTitle>{t("pwa.installIosTitle")}</PopoverTitle>
            <PopoverDescription>{t("pwa.installIosHint")}</PopoverDescription>
          </PopoverHeader>
        </PopoverContent>
      </Popover>
    );
  }

  return null;
}
