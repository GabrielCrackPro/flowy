"use client";

import { Button } from "@components/ui";
import { useTheme } from "@hooks/useTheme";
import { cn } from "@lib/utils";
import { useEffect, useState } from "react";
import { Moon, Sun } from "@/lib/icons";
import { Icon } from "./icon";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Button
      size="icon"
      variant="ghost"
      aria-label={
        mounted ? (isDark ? "Modo claro" : "Modo oscuro") : "Cambiar tema"
      }
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
        <span className="h-4 w-4" />
      ) : isDark ? (
        <Icon icon={Sun} className="h-4 w-4" />
      ) : (
        <Icon icon={Moon} className="h-4 w-4" />
      )}
    </Button>
  );
}
