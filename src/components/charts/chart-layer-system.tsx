"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, GripVertical, Eye, EyeOff } from "@/lib/icons";

export interface ChartLayer {
  id: string;
  name: string;
  type: "area" | "bar" | "line" | "reference" | "custom" | "pie";
  visible: boolean;
  color: string;
  dataKey?: string;
  zIndex?: number;
  disabled?: boolean;
}

export interface ChartLayerSystemProps {
  layers: ChartLayer[];
  onLayerVisibilityChange: (layerId: string, visible: boolean) => void;
  onLayerReorder: (layers: ChartLayer[]) => void;
  onLayerFocus?: (layerId: string | null) => void;
  focusedLayer?: string | null;
  className?: string;
}

export function ChartLayerSystem({
  layers,
  onLayerVisibilityChange,
  onLayerReorder,
  onLayerFocus,
  focusedLayer,
  className,
}: ChartLayerSystemProps) {
  const { t } = useTranslation();
  const [draggedLayer, setDraggedLayer] = React.useState<string | null>(null);
  const [expanded, setExpanded] = React.useState(true);

  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    layerId: string,
  ) => {
    setDraggedLayer(layerId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetLayerId: string) => {
    e.preventDefault();
    if (!draggedLayer || draggedLayer === targetLayerId) return;

    const newLayers = [...layers];
    const draggedIndex = newLayers.findIndex((l) => l.id === draggedLayer);
    const targetIndex = newLayers.findIndex((l) => l.id === targetLayerId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const [removed] = newLayers.splice(draggedIndex, 1);
    newLayers.splice(targetIndex, 0, removed);

    onLayerReorder(newLayers);
    setDraggedLayer(null);
  };

  const handleLayerFocus = (layerId: string) => {
    onLayerFocus?.(layerId === focusedLayer ? null : layerId);
  };

  return (
    <div className={cn("w-full", className)}>
      <motion.button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm font-medium transition-colors hover:bg-muted/70"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <span>{t("charts.layers")}</span>
        {expanded ? (
          <ChevronUp className="size-4" />
        ) : (
          <ChevronDown className="size-4" />
        )}
      </motion.button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-2 space-y-1"
          >
            {layers.map((layer, index) => (
              <motion.div
                key={layer.id}
                draggable={!layer.disabled}
                onDragStart={(e) =>
                  handleDragStart(
                    e as unknown as React.DragEvent<HTMLDivElement>,
                    layer.id,
                  )
                }
                onDragOver={handleDragOver}
                onDrop={(e) =>
                  handleDrop(
                    e as unknown as React.DragEvent<HTMLDivElement>,
                    layer.id,
                  )
                }
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "group flex items-center gap-2 rounded-md border border-transparent px-3 py-2 text-sm transition-all",
                  layer.disabled
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-grab active:cursor-grabbing hover:bg-muted/50",
                  focusedLayer === layer.id
                    ? "border-primary/50 bg-primary/5"
                    : "",
                  draggedLayer === layer.id ? "opacity-50" : "",
                )}
                onClick={() => !layer.disabled && handleLayerFocus(layer.id)}
              >
                {!layer.disabled && (
                  <GripVertical className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
                )}

                <motion.button
                  type="button"
                  onClick={() =>
                    !layer.disabled &&
                    onLayerVisibilityChange(layer.id, !layer.visible)
                  }
                  disabled={layer.disabled}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className={cn(
                    "shrink-0 transition-colors",
                    layer.disabled ? "cursor-not-allowed opacity-50" : "",
                  )}
                >
                  {layer.visible ? (
                    <Eye className="size-4 text-foreground" />
                  ) : (
                    <EyeOff className="size-4 text-muted-foreground" />
                  )}
                </motion.button>

                <div
                  className="size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: layer.color }}
                />

                <span className="flex-1 truncate">{layer.name}</span>

                <AnimatePresence mode="wait">
                  {focusedLayer === layer.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="size-1.5 rounded-full bg-primary"
                    />
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
