"use client";

import type { ChartConfig } from "@components/ui";
import { ChartContainer } from "@components/ui";
import { AnimatePresence, motion } from "framer-motion";
import type * as React from "react";
import { cn } from "@/lib/utils";
import type { ChartLayer } from "./chart-layer-system";
import { ChartLayerSystem } from "./chart-layer-system";

export interface LayeredChartContainerProps
  extends React.ComponentProps<"div"> {
  config: ChartConfig;
  layers: ChartLayer[];
  onLayerVisibilityChange: (layerId: string, visible: boolean) => void;
  onLayerReorder: (layers: ChartLayer[]) => void;
  onLayerFocus?: (layerId: string | null) => void;
  focusedLayer?: string | null;
  children: React.ReactNode;
  showLayerSystem?: boolean;
  layerSystemPosition?: "top" | "bottom" | "left" | "right";
}

export function LayeredChartContainer({
  config,
  layers,
  onLayerVisibilityChange,
  onLayerReorder,
  onLayerFocus,
  focusedLayer,
  children,
  showLayerSystem = false,
  layerSystemPosition = "right",
  className,
  ...props
}: LayeredChartContainerProps) {
  // When layer system is hidden, just render the chart container normally
  if (!showLayerSystem) {
    return (
      <ChartContainer config={config} className={className} {...props}>
        <AnimatePresence mode="wait">
          <motion.div
            key={layers.map((l) => `${l.id}-${l.visible}`).join("|")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </ChartContainer>
    );
  }

  const getLayoutClasses = () => {
    switch (layerSystemPosition) {
      case "top":
        return "flex-col";
      case "bottom":
        return "flex-col-reverse";
      case "left":
        return "flex-row";
      case "right":
        return "flex-row-reverse";
      default:
        return "flex-col";
    }
  };

  const getLayerSystemSize = () => {
    switch (layerSystemPosition) {
      case "left":
      case "right":
        return "w-48 shrink-0";
      default:
        return "w-full";
    }
  };

  const getChartSize = () => {
    switch (layerSystemPosition) {
      case "left":
      case "right":
        return "flex-1";
      default:
        return "w-full";
    }
  };

  return (
    <div className={cn("flex gap-4", getLayoutClasses())} {...props}>
      <div className={cn(getLayerSystemSize())}>
        <ChartLayerSystem
          layers={layers}
          onLayerVisibilityChange={onLayerVisibilityChange}
          onLayerReorder={onLayerReorder}
          onLayerFocus={onLayerFocus}
          focusedLayer={focusedLayer}
        />
      </div>

      <div className={cn(getChartSize(), className)}>
        <ChartContainer config={config}>
          <AnimatePresence mode="wait">
            <motion.div
              key={layers.map((l) => `${l.id}-${l.visible}`).join("|")}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </ChartContainer>
      </div>
    </div>
  );
}
