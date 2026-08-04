"use client";

import { motion } from "framer-motion";
import { Icon } from "@/components/shared";
import { Loader2, SearchIcon } from "@/lib/icons";

interface CommandPaletteEmptyProps {
  type: "hint" | "searching" | "noResults" | "filterEmpty";
  t: (key: string) => string;
}

export function CommandPaletteEmpty({ type, t }: CommandPaletteEmptyProps) {
  if (type === "hint") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-3 py-14 text-center"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5">
          <Icon icon={SearchIcon} className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground/70">
            {t("search.typeHint")}
          </p>
        </div>
      </motion.div>
    );
  }

  if (type === "searching") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-3 py-14 text-center"
      >
        <Icon icon={Loader2} className="h-5 w-5 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground/60">Buscando…</p>
      </motion.div>
    );
  }

  if (type === "noResults") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-3 py-14 text-center"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30">
          <Icon icon={SearchIcon} className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground/70">
            {t("search.noResults")}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground/40">
            Prueba con otros términos
          </p>
        </div>
      </motion.div>
    );
  }

  if (type === "filterEmpty") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-3 py-14 text-center"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30">
          <Icon icon={SearchIcon} className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground/70">
            No hay resultados en este filtro
          </p>
        </div>
      </motion.div>
    );
  }

  return null;
}
