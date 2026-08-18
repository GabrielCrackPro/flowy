"use client";

import type { ChartLayer } from "@components/charts";
import { Button, Switch } from "@components/ui";
import { useTranslation } from "react-i18next";
import { Icon, type IconProps } from "@/components/shared";
import { BottomSheet } from "@/components/shared/bottom-sheet";
import { Calendar, Clock, RotateCcw, Settings2 } from "@/lib/icons";
import { cn } from "@/lib/utils";
import type { TimePeriod } from "./cash-flow-constants";

interface CashFlowSettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timePeriod: TimePeriod;
  onTimePeriodChange: (period: TimePeriod) => void;
  layers: ChartLayer[];
  onLayerVisibilityChange: (id: string, visible: boolean) => void;
  showOverlays: boolean;
  onOverlaysChange: (checked: boolean) => void;
  onReset: () => void;
}

const TIME_PERIOD_OPTIONS: {
  value: TimePeriod;
  icon: IconProps["icon"];
}[] = [
  { value: "week", icon: Clock },
  { value: "month", icon: Calendar },
];

export function CashFlowSettingsSheet({
  open,
  onOpenChange,
  timePeriod,
  onTimePeriodChange,
  layers,
  onLayerVisibilityChange,
  showOverlays,
  onOverlaysChange,
  onReset,
}: CashFlowSettingsSheetProps) {
  const { t } = useTranslation();

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("charts.settings")}
      description={t("charts.settingsDesc")}
      icon={<Icon icon={Settings2} className="size-5" />}
      className="sm:max-w-md"
      contentClassName="px-4 py-5 sm:px-6 sm:py-6"
      footerTertiary={
        <Button
          type="button"
          variant="destructive"
          onClick={onReset}
          className="h-11 w-full sm:h-10 sm:w-auto sm:px-3"
        >
          <Icon icon={RotateCcw} className="size-4" />
          {t("charts.reset")}
        </Button>
      }
    >
      <div className="flex flex-col gap-6">
        {/* Time period */}
        <div className="flex flex-col gap-2.5">
          <h3 className="text-sm font-semibold">{t("charts.timePeriod")}</h3>
          <div className="grid grid-cols-2 gap-1 rounded-xl border border-border/60 bg-card p-1 shadow-[var(--shadow-card)]">
            {TIME_PERIOD_OPTIONS.map((option) => {
              const active = timePeriod === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onTimePeriodChange(option.value)}
                  aria-pressed={active}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors duration-200",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <Icon icon={option.icon} className="size-4 shrink-0" />
                  {t(`charts.${option.value}`)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Layers */}
        <div className="flex flex-col gap-2.5">
          <h3 className="text-sm font-semibold">{t("charts.layers")}</h3>
          <div className="flex flex-col gap-1.5">
            {layers.map((layer) => (
              <div
                key={layer.id}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-card/50 px-3 py-2.5 transition duration-200",
                  "hover:border-border/70 hover:bg-card",
                  !layer.visible && "opacity-70",
                )}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: layer.color }}
                  />
                  <span className="truncate text-sm font-medium">
                    {layer.name}
                  </span>
                </span>
                <Switch
                  checked={layer.visible}
                  onCheckedChange={(checked) =>
                    onLayerVisibilityChange(layer.id, checked)
                  }
                  size="sm"
                  aria-label={layer.name}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Overlays */}
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-card/50 px-3 py-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm font-medium">{t("charts.overlays")}</span>
            <span className="text-xs text-muted-foreground">
              {t("charts.overlaysDesc")}
            </span>
          </div>
          <Switch
            checked={showOverlays}
            onCheckedChange={onOverlaysChange}
            size="sm"
            aria-label={t("charts.overlays")}
          />
        </div>
      </div>
    </BottomSheet>
  );
}
