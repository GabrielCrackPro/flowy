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
import { Download, RefreshCw } from "@/lib/icons";
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
    <div className="flex items-center justify-between border-b border-border/50 px-6 py-2">
      <p className="text-xs font-medium text-muted-foreground/60">
        {loading
          ? "—"
          : t("transactions.count", { count: transactions.length })}
      </p>
      <div className="flex items-center gap-1">
        {lastRefreshedAt && (
          <RelativeTime
            date={lastRefreshedAt}
            locale={locale}
            prefix="·"
            className="text-[11px] text-muted-foreground/40"
          />
        )}
        {transactions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="size-6 text-muted-foreground/40 hover:bg-muted/60 hover:text-foreground"
                >
                  <Icon icon={Download} className="size-3" />
                </Button>
              }
            />
            <DropdownMenuContent
              align="end"
              sideOffset={4}
              className="min-w-36"
            >
              <DropdownMenuItem
                onClick={() => exportCSV(transactions, t, locale, currency)}
              >
                {t("transactions.exportCSV")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => exportPDF(transactions, t, locale, currency)}
              >
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
          className="size-6 text-muted-foreground/40 hover:bg-muted/60 hover:text-foreground"
        >
          <Icon
            icon={RefreshCw}
            className={`size-3 ${loading ? "animate-spin" : ""}`}
          />
        </Button>
      </div>
    </div>
  );
}
