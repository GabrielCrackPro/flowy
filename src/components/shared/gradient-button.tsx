"use client";

import { Button } from "@components/ui";
import { motion } from "framer-motion";
import { Plus } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Icon } from "./icon";

interface GradientButtonProps {
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
  size?: "sm" | "default";
  hideIcon?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const SIZE_STYLES = {
  sm: "h-9 rounded-lg px-3 shadow-md",
  default: "h-12 rounded-xl shadow-lg",
};

export function GradientButton({
  onClick,
  children,
  className,
  size = "default",
  hideIcon = false,
  icon,
  fullWidth = true,
}: GradientButtonProps) {
  const sizeStyle = SIZE_STYLES[size];
  const isSmall = size === "sm";

  return (
    <Button
      onClick={onClick}
      className={cn(
        "gap-2 transition duration-300",
        sizeStyle,
        fullWidth && "w-full",
        "bg-gradient-to-r from-primary to-primary/90",
        "hover:from-primary/95 hover:to-primary/90",
        "shadow-primary/20 hover:shadow-xl hover:shadow-primary/30",
        className,
      )}
    >
      {!hideIcon && (
        <motion.span
          whileHover={{ rotate: 360, scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
          className={cn(
            "flex items-center justify-center rounded-lg bg-gradient-to-br from-primary-foreground/20 to-primary-foreground/10 transition duration-300 shadow-sm",
            isSmall ? "size-5" : "size-6",
          )}
        >
          {icon || (
            <Icon icon={Plus} className={cn(isSmall ? "size-3" : "size-3.5")} />
          )}
        </motion.span>
      )}
      {children && (
        <span
          className={cn(
            "font-semibold tracking-tight",
            isSmall ? "text-sm" : "text-[0.9rem]",
          )}
        >
          {children}
        </span>
      )}
    </Button>
  );
}
