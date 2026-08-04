"use client";

import { Skeleton, Icon } from "@components/shared";
import { motion } from "framer-motion";
import { Wallet } from "@/lib/icons";

export default function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4 dark:from-background dark:via-background dark:to-primary/10 md:p-7">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-6"
      >
        {/* Logo/Icon */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="relative"
        >
          <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary shadow-lg shadow-primary/20 dark:from-primary/30 dark:to-primary/20 dark:shadow-primary/30">
            <Icon icon={Wallet} className="size-8" />
          </div>
          <motion.div
            className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 blur-xl"
            animate={{
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>

        {/* Loading Text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="space-y-3 text-center"
        >
          <div className="space-y-2">
            <div className="h-5 w-32 mx-auto">
              <Skeleton />
            </div>
            <div className="h-4 w-24 mx-auto">
              <Skeleton />
            </div>
          </div>
        </motion.div>

        {/* Progress Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex items-center gap-2"
        >
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <div
            className="h-2 w-2 rounded-full bg-primary/40 animate-pulse"
            style={{ animationDelay: "75ms" }}
          />
          <div
            className="h-2 w-2 rounded-full bg-primary/20 animate-pulse"
            style={{ animationDelay: "150ms" }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
