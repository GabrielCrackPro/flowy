"use client";

import { Icon, RelativeTime } from "@components/shared";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@components/ui";
import { exportCSV, exportPDF } from "@lib/export-transactions";
import { Download, FileText, RefreshCw } from "@/lib/icons";
import type { Transaction } from "@/types/Transaction";

interface TransactionTableHeaderProps {
  transactions: Transaction[];
  loading: boolean;
  lastRefreshedAt: Date | null;
  locale: string;
  currency: string;
  t: (key: string, options?: Record<string, unknown>) => string;
  onRefresh: () => void;
}

export function TransactionTableHeader({
  transactions,
  loading,
  lastRefreshedAt,
  locale,
  currency,
  t,
  onRefresh,
}: TransactionTableHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/30 px-6 py-2.5">
      {/* Left: count with stat pill */}
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-lg bg-muted/40 px-2.5 py-1">
          <span className="text-xs font-medium text-foreground/80">
            {loading
              ? "—"
              : t("transactions.count", { count: transactions.length })}
          </span>
        </span>

        {lastRefreshedAt && (
          <RelativeTime
            date={lastRefreshedAt}
            locale={locale}
            prefix="·"
            className="text-[11px] text-muted-foreground/40"
          />
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1">
        {transactions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="size-7 rounded-lg text-muted-foreground/40 hover:bg-muted/60 hover:text-foreground"
                >
                  <Icon icon={Download} className="size-3.5" />
                </Button>
              }
            />
            <DropdownMenuContent
              align="end"
              sideOffset={4}
              className="min-w-40"
            >
              <DropdownMenuItem
                onClick={() => exportCSV(transactions, t, locale, currency)}
              >
                <Icon icon={Download} className="size-3.5" />
                {t("transactions.exportCSV")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => exportPDF(transactions, t, locale, currency)}
              >
                <Icon icon={FileText} className="size-3.5" />
                {t("transactions.exportPDF")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Button
          variant="ghost"
          size="icon-xs"
          onClick={onRefresh}
          disabled={loading}
          className="size-7 rounded-lg text-muted-foreground/40 hover:bg-muted/60 hover:text-foreground"
        >
          <Icon
            icon={RefreshCw}
            className={`size-3.5 ${loading ? "animate-spin" : ""}`}
          />
        </Button>
      </div>
    </div>
  );
}
