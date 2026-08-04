"use client";

import { Button, Switch } from "@components/ui";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/shared";
import { SheetLayout } from "@/components/ui/sheet-layout";
import { useDashboardCards } from "@/hooks/useDashboardCards";
import {
  DASHBOARD_CARD_GROUPS,
  type DashboardCardId,
} from "@/lib/dashboard-cards";
import { LayoutGrid, RotateCcw } from "@/lib/icons";
import { cn } from "@/lib/utils";

const CARD_LABEL_KEYS: Record<DashboardCardId, string> = {
  stats: "dashboard.cards.stats",
  cashFlow: "dashboard.cards.cashFlow",
  expenseDistribution: "dashboard.cards.expenseDistribution",
  distribution: "dashboard.cards.distribution",
  recentTransactions: "dashboard.cards.recentTransactions",
  budgetProgress: "dashboard.cards.budgetProgress",
  goalProgress: "dashboard.cards.goalProgress",
  subscriptions: "dashboard.cards.subscriptions",
  activity: "dashboard.cards.activity",
};

interface DashboardCustomizeProps {
  compact?: boolean;
}

export function DashboardCustomize({
  compact = false,
}: DashboardCustomizeProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { isCardEnabled, setCardEnabled, resetCards } = useDashboardCards();

  const handleToggle = async (id: DashboardCardId, visible: boolean) => {
    setBusy(true);
    try {
      await setCardEnabled(id, visible);
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    setBusy(true);
    try {
      await resetCards();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {compact ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setOpen(true)}
          aria-label={t("dashboard.customize")}
          className="rounded-full border border-border/30 bg-card/70 text-muted-foreground backdrop-blur-sm hover:bg-primary/10 hover:text-primary"
        >
          <Icon icon={LayoutGrid} className="size-3.5" />
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen(true)}
          aria-label={t("dashboard.customize")}
        >
          <Icon icon={LayoutGrid} className="size-3.5" />
          <span className="hidden sm:inline">{t("dashboard.customize")}</span>
        </Button>
      )}

      <SheetLayout
        open={open}
        onOpenChange={setOpen}
        title={t("dashboard.customizeTitle")}
        description={t("dashboard.customizeDescription")}
        icon={LayoutGrid}
        footerLeft={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={busy}
            className="text-muted-foreground"
          >
            <Icon icon={RotateCcw} className="size-3.5" />
            {t("dashboard.customizeReset")}
          </Button>
        }
        footerRight={
          <Button type="button" onClick={() => setOpen(false)}>
            {t("common.close")}
          </Button>
        }
      >
        <div className="flex flex-col gap-5">
          {DASHBOARD_CARD_GROUPS.map((group) => (
            <div key={group.id} className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t(group.labelKey)}
              </h3>
              {group.cards.map((id) => {
                const visible = isCardEnabled(id);
                return (
                  <div
                    key={id}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-muted/20 p-3 transition-opacity",
                      !visible && "opacity-60",
                    )}
                  >
                    <span
                      className={cn(
                        "min-w-0 text-sm font-medium",
                        !visible && "text-muted-foreground",
                      )}
                    >
                      {t(CARD_LABEL_KEYS[id])}
                    </span>
                    <Switch
                      checked={visible}
                      onCheckedChange={(checked) => handleToggle(id, checked)}
                      disabled={busy}
                      aria-label={t(CARD_LABEL_KEYS[id])}
                    />
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </SheetLayout>
    </>
  );
}
