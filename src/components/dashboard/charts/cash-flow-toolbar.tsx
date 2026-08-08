"use client";

import type { ChartLayer } from "@components/charts";
import { ChartToggle } from "@components/charts";
import { Icon, type IconProps } from "@components/shared";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  Calendar,
  ChartArea,
  ChartColumn,
  ChartLine,
  ChevronRight,
  Clock,
  Layers,
  TrendingUp,
} from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { ChartType, TimePeriod } from "./cash-flow-constants";

interface CashFlowToolbarProps {
  chartType: ChartType;
  onChartTypeChange: (type: ChartType) => void;
  timePeriod: TimePeriod;
  onTimePeriodChange: (period: TimePeriod) => void;
  layers: ChartLayer[];
  onLayerVisibilityChange: (id: string, visible: boolean) => void;
  collapsedGroups: Set<string>;
  onToggleGroup: (group: string) => void;
  showOverlays: boolean;
  onToggleOverlays: () => void;
}

export function CashFlowToolbar({
  chartType,
  onChartTypeChange,
  timePeriod,
  onTimePeriodChange,
  layers,
  onLayerVisibilityChange,
  collapsedGroups,
  onToggleGroup,
  showOverlays,
  onToggleOverlays,
}: CashFlowToolbarProps) {
  const { t } = useTranslation();

  const chartTypeTabs: {
    value: ChartType;
    label: string;
    icon: IconProps["icon"];
  }[] = [
    { value: "area", label: t("charts.area"), icon: ChartArea },
    { value: "bar", label: t("charts.bar"), icon: ChartColumn },
    { value: "line", label: t("charts.line"), icon: ChartLine },
  ];

  const timePeriodTabs: {
    value: TimePeriod;
    label: string;
    icon: IconProps["icon"];
  }[] = [
    { value: "week", label: t("charts.week"), icon: Clock },
    { value: "month", label: t("charts.month"), icon: Calendar },
  ];

  const layersCollapsed = collapsedGroups.has("layers");

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <ChartToggle<TimePeriod>
        value={timePeriod}
        onChange={(period) => onTimePeriodChange(period)}
        options={timePeriodTabs}
        groupIcon={Clock}
        collapsible
        collapsed={collapsedGroups.has("timePeriod")}
        onCollapseToggle={() => onToggleGroup("timePeriod")}
        labelHiddenUntil="md"
      />
      <ChartToggle<ChartType>
        value={chartType}
        onChange={(type) => onChartTypeChange(type)}
        options={chartTypeTabs}
        groupIcon={ChartArea}
        collapsible
        collapsed={collapsedGroups.has("chartType")}
        onCollapseToggle={() => onToggleGroup("chartType")}
      />

      {/* Inline layers multi-toggle — matches ChartToggle style */}
      <div className="inline-flex items-center gap-1 rounded-xl border border-border/30 bg-card p-1 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <motion.button
          type="button"
          onClick={() => onToggleGroup("layers")}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          aria-expanded={!layersCollapsed}
          className="flex items-center gap-1.5 rounded-lg py-1.5 pr-1.5 pl-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
        >
          <Icon icon={Layers} className="size-3.5" />
          <motion.span
            animate={{ rotate: layersCollapsed ? 0 : 90 }}
            transition={{ duration: 0.2 }}
            className="flex"
          >
            <Icon icon={ChevronRight} className="size-3" />
          </motion.span>
        </motion.button>

        <AnimatePresence initial={false}>
          {!layersCollapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-0.5 overflow-hidden"
            >
              {layers.map((layer) => {
                const active = layer.visible;
                return (
                  <button
                    key={layer.id}
                    type="button"
                    onClick={() => onLayerVisibilityChange(layer.id, !active)}
                    aria-pressed={active}
                    title={layer.name}
                    className={cn(
                      "relative flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium outline-none transition-colors duration-200 focus-visible:ring-3 focus-visible:ring-ring/40 hover:bg-muted/60",
                      active ? "text-foreground" : "text-muted-foreground/60",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="layer-active-pill"
                        transition={{
                          type: "spring",
                          stiffness: 420,
                          damping: 32,
                        }}
                        className="absolute inset-0 rounded-lg bg-primary/10 ring-1 ring-inset ring-primary/20"
                      />
                    )}
                    <span
                      className="relative z-10 size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: layer.color }}
                    />
                    <span className="relative z-10 hidden sm:inline">
                      {layer.name}
                    </span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.button
        type="button"
        onClick={onToggleOverlays}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        aria-pressed={showOverlays}
        className={cn(
          "flex h-8 items-center gap-1.5 rounded-xl border px-3 text-xs font-medium transition-colors duration-200",
          showOverlays
            ? "border-primary/40 bg-primary/10 text-primary"
            : "border-border/30 bg-card text-muted-foreground shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-primary/30 hover:text-foreground",
        )}
      >
        <AnimatePresence>
          {showOverlays ? (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="size-1.5 rounded-full bg-primary"
            />
          ) : null}
        </AnimatePresence>
        <Icon icon={TrendingUp} className="size-3.5" />
        <span className="hidden sm:inline">{t("charts.overlays")}</span>
      </motion.button>
    </div>
  );
}
