"use client";

import { Button } from "@components/ui";
import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect } from "react";
import { Icon } from "@/components/shared";
import { ArrowLeft, Droplet, Home, Settings, Wallet } from "@/lib/icons";

export default function DashboardNotFound() {
  useEffect(() => {
    document.title = "Página no encontrada | Flowy";
  }, []);

  return (
    <div className="relative flex min-h-[calc(100vh-8rem)] items-center justify-center overflow-hidden px-4 py-16">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-primary/5" />

      {/* Dot pattern */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, hsl(var(--border)/0.3) 1px, transparent 0)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Large 404 text */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none text-[min(40vw,24rem)] font-bold leading-none tracking-tighter text-border/10"
      >
        4
        <motion.span
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="relative mx-[-0.05em] inline-flex h-[0.85em] w-[0.85em] items-center justify-center align-middle rounded-full border-[0.08em] border-primary/20 bg-linear-to-br from-primary/20 to-primary/10 text-[0.5em] text-primary shadow-lg shadow-primary/20"
        >
          <Icon icon={Droplet} className="h-[0.55em] w-[0.55em]" />
        </motion.span>
        4
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative flex flex-col items-center text-center"
      >
        {/* Brand badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex items-center gap-2 rounded-full border border-border/30 bg-linear-to-r from-card/80 to-card/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm shadow-md"
        >
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="flex size-6 items-center justify-center rounded-full bg-linear-to-br from-primary to-primary/80 text-primary-foreground shadow-md"
          >
            <Icon icon={Droplet} className="size-3.5" />
          </motion.div>
          Flowy
          <span className="text-muted-foreground/30">·</span>
          <span className="text-primary font-semibold">404</span>
        </motion.div>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 text-3xl font-bold tracking-tight sm:text-4xl bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-transparent"
        >
          Esta página no existe
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground/80"
        >
          La página que buscas ya no está aquí. El enlace podría estar roto, la
          página pudo haberse movido o la URL no es correcta.
        </motion.p>

        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
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
                whileHover={{ x: 3 }}
                transition={{ duration: 0.2 }}
              >
                <Icon icon={Home} className="size-4" />
              </motion.div>
              Ir al resumen
            </Link>
          </Button>

          <Button
            variant="outline"
            onClick={() => history.back()}
            className="group h-11 rounded-full px-6 border-border/30 hover:border-border/50"
          >
            <motion.div
              className="mr-2"
              whileHover={{ x: -3 }}
              transition={{ duration: 0.2 }}
            >
              <Icon icon={ArrowLeft} className="size-4" />
            </motion.div>
            Retroceder
          </Button>
        </motion.div>

        {/* Quick links */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-16 flex items-center gap-6 text-xs text-muted-foreground/60"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/dashboard/transactions"
              className="flex items-center gap-1.5 transition-colors hover:text-foreground hover:bg-muted/30 rounded-lg px-2 py-1"
            >
              <Icon icon={Wallet} className="size-3" />
              Transacciones
            </Link>
          </motion.div>
          <span className="size-1 rounded-full bg-border/50" />
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/dashboard/budgets"
              className="flex items-center gap-1.5 transition-colors hover:text-foreground hover:bg-muted/30 rounded-lg px-2 py-1"
            >
              <Icon icon={Wallet} className="size-3" />
              Presupuestos
            </Link>
          </motion.div>
          <span className="size-1 rounded-full bg-border/50" />
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-1.5 transition-colors hover:text-foreground hover:bg-muted/30 rounded-lg px-2 py-1"
            >
              <Icon icon={Settings} className="size-3" />
              Ajustes
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
