"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/shared/icon";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Plus } from "@/lib/icons";
import { cn } from "@/lib/utils";

/**
 * Floating action button for quick transaction entry.
 *
 * Renders on mobile viewports (browser and installed PWA alike) on the
 * dashboard overview page — where it's most useful for capturing a quick
 * expense on the go. Hidden on desktop.
 */
export function PwaFab() {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const { t } = useTranslation();

  if (!isMobile) return null;
  if (pathname !== "/dashboard") return null;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 24,
        delay: 0.3,
      }}
      className={cn(
        "fixed right-4 z-50",
        "bottom-[calc(4rem+env(safe-area-inset-bottom,0px)+0.75rem)]",
      )}
    >
      <Link
        href="/dashboard/transactions/add"
        className={cn(
          "flex size-14 items-center justify-center rounded-2xl shadow-lg",
          "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground",
          "transition-shadow duration-200 hover:shadow-xl hover:shadow-primary/25",
          "active:scale-95",
        )}
        aria-label={t("nav.newTransaction")}
      >
        <motion.div
          whileHover={{ rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          <Icon icon={Plus} className="size-6" />
        </motion.div>
      </Link>
    </motion.div>
  );
}
