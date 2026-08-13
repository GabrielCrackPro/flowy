"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SectionCard, StatsCard } from "@/components/shared";
import { TransactionSummaryCards } from "@/components/transactions/transaction-summary-cards";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ArrowUpDown, Home, Settings, Wallet } from "@/lib/icons";
import { cn, formatCurrency } from "@/lib/utils";

interface ThemePreviewProps {
  className?: string;
  colors?: {
    primaryColor: string | null;
    secondaryColor: string | null;
    accentColor: string | null;
  };
}

type PreviewMode = "dashboard" | "transactions" | "settings";

type PreviewTranslator = (
  key: string,
  options?: Record<string, unknown>,
) => string;

function hexToHsl(hex: string | null): string {
  if (!hex) return "";

  const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
  const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
  const b = Number.parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;

  if (max === min) {
    return `0 0% ${Math.round(lightness * 100)}%`;
  }

  const difference = max - min;
  const saturation =
    lightness > 0.5 ? difference / (2 - max - min) : difference / (max + min);
  let hue = 0;

  switch (max) {
    case r:
      hue = (g - b) / difference + (g < b ? 6 : 0);
      break;
    case g:
      hue = (b - r) / difference + 2;
      break;
    default:
      hue = (r - g) / difference + 4;
  }

  return `${Math.round((hue / 6) * 360)} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%`;
}

function foregroundForHex(hex: string | null): string {
  if (!hex) return "";
  const value = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(value)) return "0 0% 100%";

  const channels = [0, 2, 4].map(
    (offset) => Number.parseInt(value.slice(offset, offset + 2), 16) / 255,
  );
  const luminance =
    0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
  return luminance > 0.55 ? "222.2 47.4% 11.2%" : "0 0% 100%";
}

export function ThemePreview({ className, colors }: ThemePreviewProps) {
  const { t } = useTranslation("app");
  const [mode, setMode] = useState<PreviewMode>("dashboard");
  const primary = hexToHsl(colors?.primaryColor ?? null);
  const secondary = hexToHsl(colors?.secondaryColor ?? null);
  const accent = hexToHsl(colors?.accentColor ?? null);
  const previewStyle = {
    "--preview-primary": primary || "var(--primary)",
    "--preview-secondary": secondary || "var(--secondary)",
    "--preview-accent": accent || "var(--accent)",
    ...(primary
      ? {
          "--primary": primary,
          "--primary-foreground": foregroundForHex(
            colors?.primaryColor ?? null,
          ),
          "--ring": primary,
        }
      : {}),
    ...(secondary
      ? {
          "--secondary": secondary,
          "--secondary-foreground": foregroundForHex(
            colors?.secondaryColor ?? null,
          ),
        }
      : {}),
    ...(accent
      ? {
          "--accent": accent,
          "--accent-foreground": foregroundForHex(colors?.accentColor ?? null),
        }
      : {}),
  } as CSSProperties;

  const previewModes: Array<{
    id: PreviewMode;
    icon: typeof Home;
    label: string;
  }> = [
    {
      id: "dashboard",
      icon: Home,
      label: t("settings.theme.preview.modeDashboard"),
    },
    {
      id: "transactions",
      icon: ArrowUpDown,
      label: t("settings.theme.preview.modeTransactions"),
    },
    {
      id: "settings",
      icon: Settings,
      label: t("settings.theme.preview.modeSettings"),
    },
  ];

  return (
    <div className={cn("space-y-3", className)} style={previewStyle}>
      <div
        className="grid grid-cols-3 gap-1 rounded-lg border border-border/40 bg-background/60 p-1"
        role="tablist"
        aria-label={t("settings.theme.livePreview")}
      >
        {previewModes.map((previewMode) => {
          const Icon = previewMode.icon;
          const selected = mode === previewMode.id;
          return (
            <button
              key={previewMode.id}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`theme-preview-${previewMode.id}`}
              onClick={() => setMode(previewMode.id)}
              className={cn(
                "flex min-w-0 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-background/60 hover:text-foreground",
              )}
            >
              <Icon className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{previewMode.label}</span>
            </button>
          );
        })}
      </div>

      <div id={`theme-preview-${mode}`} role="tabpanel">
        {mode === "dashboard" ? <DashboardPreview t={t} /> : null}
        {mode === "transactions" ? <TransactionsPreview t={t} /> : null}
        {mode === "settings" ? <SettingsPreview t={t} /> : null}
      </div>
    </div>
  );
}

function DashboardPreview({ t }: { t: PreviewTranslator }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <StatsCard
        title={t("settings.theme.preview.totalBalance")}
        value={12450}
        description={t("settings.theme.preview.fromLastMonth")}
        variant="currency"
        icon={Wallet}
        tone="positive"
        trend={{
          value: 12.5,
          label: t("settings.theme.preview.fromLastMonth"),
        }}
      />
      <StatsCard
        title={t("settings.theme.preview.goalsProgress")}
        value={60}
        description={t("settings.theme.preview.completed")}
        variant="percentage"
        icon={Home}
        tone="info"
      />
    </div>
  );
}

function TransactionsPreview({ t }: { t: PreviewTranslator }) {
  return (
    <div className="space-y-3">
      <TransactionSummaryCards
        expenses={812}
        income={2400}
        balance={1588}
        loadingDone
        locale="en-US"
        currency="USD"
        t={t}
        formatCurrency={formatCurrency}
      />
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/40 bg-background/60 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <ArrowUpDown className="size-3.5 shrink-0 text-primary" />
          <span className="truncate text-[11px] text-muted-foreground">
            {t("settings.theme.preview.transactionFilter")}
          </span>
        </div>
        <Badge variant="outline">
          {t("settings.theme.preview.transactionCategory")}
        </Badge>
      </div>
    </div>
  );
}

function SettingsPreview({ t }: { t: PreviewTranslator }) {
  return (
    <SectionCard
      title={t("settings.theme.preview.modeSettings")}
      description={t("settings.theme.preview.toggleDescription")}
      icon={<Settings className="size-4" />}
      className="shadow-none"
    >
      <div className="space-y-3 px-5 pb-5 sm:px-6">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-background/60 px-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium">
              {t("settings.theme.preview.settingOption")}
            </p>
            <p className="truncate text-[10px] text-muted-foreground">
              {t("settings.theme.preview.toggleDescription")}
            </p>
          </div>
          <Switch
            checked={false}
            aria-label={t("settings.theme.preview.settingOption")}
          />
        </div>
        <Input
          className="h-9 text-xs"
          placeholder={t("settings.theme.preview.emailPlaceholder")}
        />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" className="h-8">
            {t("settings.theme.preview.buttonLink")}
          </Button>
          <Button variant="outline" size="sm" className="h-8">
            {t("settings.theme.preview.buttonOutline")}
          </Button>
        </div>
      </div>
    </SectionCard>
  );
}
