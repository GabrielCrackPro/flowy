"use client";

import { Button, Switch } from "@components/ui";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon, type IconProps } from "@/components/shared";
import { toast } from "@/components/shared/toast";
import { SheetLayout } from "@/components/ui/sheet-layout";
import { useProfile } from "@/hooks/useProfile";
import {
  ALL_DASHBOARD_CARDS,
  DASHBOARD_CARD_GROUPS,
  type DashboardCardId,
} from "@/lib/dashboard-cards";
import {
  BarChart3,
  Bell,
  ChartArea,
  ChartLine,
  ChartPie,
  Info,
  LayoutGrid,
  Loader2,
  Receipt,
  Repeat2,
  RotateCcw,
  Target,
  Wallet,
} from "@/lib/icons";
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

const CARD_ICONS: Record<DashboardCardId, IconProps["icon"]> = {
  stats: BarChart3,
  cashFlow: ChartLine,
  expenseDistribution: ChartPie,
  distribution: ChartArea,
  recentTransactions: Receipt,
  budgetProgress: Wallet,
  goalProgress: Target,
  subscriptions: Repeat2,
  activity: Bell,
};

function defaultVisibility(
  enabled: readonly DashboardCardId[] | null | undefined,
): Record<DashboardCardId, boolean> {
  const map = {} as Record<DashboardCardId, boolean>;
  for (const id of ALL_DASHBOARD_CARDS) {
    map[id] = enabled == null || enabled.includes(id);
  }
  return map;
}

interface DashboardCustomizeProps {
  compact?: boolean;
}

export function DashboardCustomize({
  compact = false,
}: DashboardCustomizeProps) {
  const { t } = useTranslation();
  const { profile, update } = useProfile();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Record<DashboardCardId, boolean> | null>(
    null,
  );
  const [pending, setPending] = useState<Set<DashboardCardId>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const baseVisibility = useMemo(
    () =>
      defaultVisibility(
        profile?.dashboardCards as DashboardCardId[] | null | undefined,
      ),
    [profile?.dashboardCards],
  );
  const visibility = draft ?? baseVisibility;

  const total = ALL_DASHBOARD_CARDS.length;
  const visibleCount = ALL_DASHBOARD_CARDS.filter(
    (id) => visibility[id],
  ).length;
  const busy = bulkBusy || pending.size > 0;

  const persist = async (
    next: Record<DashboardCardId, boolean>,
    rollback: Record<DashboardCardId, boolean>,
  ) => {
    setDraft(next);
    try {
      await update({
        dashboardCards: ALL_DASHBOARD_CARDS.filter((id) => next[id]),
      });
      return true;
    } catch {
      setDraft(rollback);
      toast.error(t("dashboard.customizeError"));
      return false;
    }
  };

  const handleToggle = async (id: DashboardCardId, checked: boolean) => {
    setPending((prev) => new Set(prev).add(id));
    await persist({ ...visibility, [id]: checked }, visibility);
    setPending((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleBulk = async (visible: boolean) => {
    if (bulkBusy) return;
    setBulkBusy(true);
    await persist(
      defaultVisibility(visible ? ALL_DASHBOARD_CARDS : []),
      visibility,
    );
    setBulkBusy(false);
  };

  const handleReset = async () => {
    if (bulkBusy) return;
    setBulkBusy(true);
    const defaults = defaultVisibility(null);
    setDraft(defaults);
    try {
      await update({ dashboardCards: null });
      toast.success(t("dashboard.customizeResetSuccess"));
    } catch {
      setDraft(visibility);
      toast.error(t("dashboard.customizeResetError"));
    }
    setBulkBusy(false);
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
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setDraft(null);
        }}
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
            className="text-muted-foreground hover:text-destructive"
          >
            <Icon
              icon={bulkBusy ? Loader2 : RotateCcw}
              className={cn("size-3.5", bulkBusy && "animate-spin")}
            />
            {t("dashboard.customizeReset")}
          </Button>
        }
        footerRight={
          <Button type="button" onClick={() => setOpen(false)}>
            {t("common.close")}
          </Button>
        }
      >
        <div className="flex flex-col gap-6">
          {/* Visibility summary */}
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">
              {t("dashboard.customizeVisible", {
                count: visibleCount,
                total,
              })}
            </p>
            <div className="flex items-center gap-2.5">
              <span className="text-xs text-muted-foreground">
                {visibleCount === total
                  ? t("dashboard.customizeHideAll")
                  : t("dashboard.customizeShowAll")}
              </span>
              <Switch
                checked={visibleCount === total}
                onCheckedChange={handleBulk}
                disabled={busy}
                size="sm"
                aria-label={t("dashboard.customizeShowAll")}
              />
            </div>
          </div>

          {/* All-hidden warning */}
          {visibleCount === 0 ? (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/[0.08] dark:text-amber-400">
              <Icon icon={Info} className="mt-px size-4 shrink-0" />
              {t("dashboard.customizeAllHidden")}
            </div>
          ) : null}

          {/* Card groups */}
          {DASHBOARD_CARD_GROUPS.map((group) => {
            const groupVisible = group.cards.filter(
              (id) => visibility[id],
            ).length;
            return (
              <div key={group.id} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-border/50" />
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    {t(group.labelKey)}
                  </h3>
                  <span className="rounded-md bg-muted/70 px-1.5 py-0.5 text-[0.65rem] font-medium tabular-nums text-muted-foreground">
                    {groupVisible}/{group.cards.length}
                  </span>
                  <div className="h-px flex-1 bg-border/50" />
                </div>

                <div className="flex flex-col gap-1.5">
                  {group.cards.map((id) => {
                    const checked = visibility[id];
                    const isPending = pending.has(id);
                    return (
                      <div
                        key={id}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border border-border/40 bg-card/50 p-2.5 pl-3 transition-all duration-200",
                          "hover:border-border/70 hover:bg-card hover:shadow-sm",
                          !checked && "opacity-70",
                        )}
                      >
                        <div
                          className={cn(
                            "flex size-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                            checked
                              ? "bg-primary/10 text-primary"
                              : "bg-muted/60 text-muted-foreground",
                          )}
                        >
                          <Icon icon={CARD_ICONS[id]} className="size-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "truncate text-sm font-medium",
                              !checked && "text-muted-foreground",
                            )}
                          >
                            {t(CARD_LABEL_KEYS[id])}
                          </p>
                        </div>

                        {isPending ? (
                          <Icon
                            icon={Loader2}
                            className="size-4 shrink-0 animate-spin text-muted-foreground"
                            aria-hidden
                          />
                        ) : null}

                        <Switch
                          checked={checked}
                          onCheckedChange={(value) => handleToggle(id, value)}
                          disabled={busy}
                          size="sm"
                          aria-label={t(CARD_LABEL_KEYS[id])}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </SheetLayout>
    </>
  );
}
