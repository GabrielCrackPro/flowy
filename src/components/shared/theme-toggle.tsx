"use client";

import { Button } from "@components/ui";
import { useTheme } from "@hooks/useTheme";
import { cn } from "@lib/utils";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Moon, Sun } from "@/lib/icons";
import { Icon } from "./icon";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();
  const { t } = useTranslation();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const label = mounted
    ? isDark
      ? t("common.lightMode")
      : t("common.darkMode")
    : t("common.toggleTheme");

  return (
    <Button
      size="icon"
      variant="ghost"
      aria-label={label}
      title={label}
      className={cn(
        className,
        "transition-transform duration-500 active:rotate-180",
      )}
      onClick={(e) =>
        toggleTheme({
          x: e.clientX,
          y: e.clientY,
        })
      }
    >
      {!mounted ? (
        <span className="size-4" />
      ) : isDark ? (
        <Icon icon={Sun} className="size-4" />
      ) : (
        <Icon icon={Moon} className="size-4" />
      )}
    </Button>
  );
}
