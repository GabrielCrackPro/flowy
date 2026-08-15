import { Button } from "@components/ui";
import type { ReactNode } from "react";
import { RefreshCw } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Icon } from "./icon";
import { ListCreateButton } from "./list-create-button";

export interface ActionBarProps {
  ariaLabel: string;
  /** Use plain when the toolbar is already inside a card or table surface. */
  surface?: "card" | "plain";
  search?: ReactNode;
  filterAction?: ReactNode;
  exportAction?: ReactNode;
  refreshAction?: ReactNode;
  onRefresh?: () => unknown;
  refreshing?: boolean;
  refreshLabel?: string;
  createAction?: ReactNode;
  children?: ReactNode;
  className?: string;
  actionsClassName?: string;
}

export type FinanceListActionBar = Pick<
  ActionBarProps,
  | "filterAction"
  | "exportAction"
  | "refreshAction"
  | "onRefresh"
  | "refreshing"
  | "refreshLabel"
  | "createAction"
>;

export interface FinanceListActionBarOptions {
  filterAction?: ReactNode;
  exportAction?: ReactNode;
  create?: {
    label: string;
    onClick: () => void;
  };
  refresh?: {
    onRefresh: () => unknown;
    refreshing?: boolean;
    label?: string;
  };
}

/**
 * Builds the standard controls consumed by finance entity list pages.
 * Entity-specific filters and exports remain slots, while create and refresh
 * controls keep one shared implementation and responsive behavior.
 */
export function buildFinanceListActionBar({
  filterAction,
  exportAction,
  create,
  refresh,
}: FinanceListActionBarOptions): FinanceListActionBar {
  return {
    filterAction,
    exportAction,
    createAction: create ? (
      <ListCreateButton label={create.label} onClick={create.onClick} />
    ) : undefined,
    onRefresh: refresh?.onRefresh,
    refreshing: refresh?.refreshing,
    refreshLabel: refresh?.label,
  };
}

/**
 * Responsive finance-page toolbar. Search gets the flexible space on desktop;
 * controls wrap naturally on small screens while preserving a stable order.
 */
export function ActionBar({
  ariaLabel,
  surface = "card",
  search,
  filterAction,
  exportAction,
  refreshAction,
  onRefresh,
  refreshing = false,
  refreshLabel,
  createAction,
  children,
  className,
  actionsClassName,
}: ActionBarProps) {
  return (
    <div
      role="toolbar"
      aria-label={ariaLabel}
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-center",
        surface === "card" &&
          "rounded-2xl border border-border/60 bg-card/70 p-2 shadow-[var(--shadow-card)] backdrop-blur-sm",
        surface === "plain" && "p-0",
        className,
      )}
    >
      {search && <div className="min-w-0 flex-1">{search}</div>}

      <div
        className={cn(
          "flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end",
          actionsClassName,
        )}
      >
        {filterAction}
        {children}
        {exportAction}
        {refreshAction ??
          (onRefresh && (
            <Button
              variant="outline"
              size="icon-sm"
              type="button"
              onClick={() => void onRefresh()}
              disabled={refreshing}
              aria-busy={refreshing}
              aria-label={refreshLabel}
              title={refreshLabel}
              className="size-10 touch-manipulation rounded-xl text-muted-foreground hover:text-foreground sm:size-9"
            >
              <Icon
                icon={RefreshCw}
                className={cn("size-3.5", refreshing && "animate-spin")}
              />
            </Button>
          ))}
        {createAction && (
          <div className="shrink-0 sm:w-auto max-sm:[&_button]:size-10 max-sm:[&_button]:rounded-xl max-sm:[&_button]:px-0">
            {createAction}
          </div>
        )}
      </div>
    </div>
  );
}
