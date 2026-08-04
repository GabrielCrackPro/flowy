"use client";

import { Icon, GradientButton } from "@/components/shared";
import { AlertTriangle, RefreshCw, Droplet, Home } from "@/lib/icons";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <div className="relative flex min-h-[calc(100vh-8rem)] items-center justify-center overflow-hidden px-4 py-16">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 via-transparent to-destructive/5" />

      {/* Dot pattern */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, hsl(var(--border)/0.3) 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative flex w-full max-w-lg flex-col items-center gap-8 text-center"
      >
        {/* Error icon with pulsing effect */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative"
        >
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-full bg-destructive/20 blur-xl"
          />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-destructive/30 bg-gradient-to-br from-destructive/10 to-destructive/5 text-destructive shadow-lg shadow-destructive/20">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <Icon icon={AlertTriangle} className="h-10 w-10" />
            </motion.div>
          </div>
        </motion.div>

        {/* Brand badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex items-center gap-2 rounded-full border border-border/30 bg-gradient-to-r from-card/80 to-card/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm shadow-md"
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-destructive to-destructive/80 text-destructive-foreground shadow-md"
          >
            <Icon icon={Droplet} className="h-3.5 w-3.5" />
          </motion.div>
          Flowy
          <span className="text-muted-foreground/30">·</span>
          <span className="text-destructive font-semibold">Error</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="space-y-3"
        >
          <h2 className="text-2xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {t("errors.title") || "Algo salió mal"}
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground/80">
            {t("errors.description") ||
              "Ocurrió un error inesperado. Intenta de nuevo."}
          </p>
          {process.env.NODE_ENV === "development" && (
            <motion.details
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-6 text-left"
            >
              <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                <Icon icon={AlertTriangle} className="h-4 w-4" />
                Detalles técnicos
              </summary>
              <pre className="mt-3 max-h-48 overflow-auto rounded-lg border border-border/30 bg-gradient-to-br from-muted/50 to-muted/30 p-4 text-xs text-muted-foreground shadow-sm">
                {error.message}
                {error.digest && (
                  <>
                    {"\n"}
                    Digest: {error.digest}
                  </>
                )}
              </pre>
            </motion.details>
          )}
        </motion.div>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="flex flex-col gap-3 sm:flex-row sm:gap-4 w-full sm:w-auto"
        >
          <GradientButton
            onClick={reset}
            icon={<Icon icon={RefreshCw} />}
            fullWidth={false}
          >
            {t("errors.retry") || "Reintentar"}
          </GradientButton>
          <motion.button
            onClick={() => router.push("/dashboard")}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/50 bg-gradient-to-r from-muted/50 to-muted/30 px-5 py-2.5 text-sm font-medium text-foreground shadow-md transition-all hover:from-muted/60 hover:to-muted/40 hover:shadow-lg h-12 w-full sm:w-auto"
          >
            <Icon icon={Home} className="size-4" />
            {t("errors.goHome") || "Ir al inicio"}
          </motion.button>
        </motion.div>

        {/* Additional help text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-xs text-muted-foreground/60"
        >
          {t("errors.help") || "Si el problema persiste, contacta al soporte."}
        </motion.p>
      </motion.div>
    </div>
  );
}
