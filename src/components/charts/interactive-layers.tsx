"use client";

import { motion } from "framer-motion";
import type * as React from "react";
import type { ChartLayer } from "./chart-layer-system";

export interface InteractiveLayerProps {
  layer: ChartLayer;
  isFocused?: boolean;
  children: React.ReactNode;
}

export function InteractiveLayer({
  layer,
  isFocused = false,
  children,
}: InteractiveLayerProps) {
  if (!layer.visible) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{
        opacity: isFocused ? 1 : 0.7,
        scale: isFocused ? 1.02 : 1,
      }}
      transition={{ duration: 0.2 }}
      style={{ zIndex: layer.zIndex }}
    >
      {children}
    </motion.div>
  );
}
