"use client";

import { cn } from "@lib/utils";
import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { SearchInput } from "./search-input";
import { Skeleton } from "./skeleton";
import { type Column, DataTable } from "./table/data-table";
import { type ViewMode, ViewToggle } from "./view-toggle";

interface EntityListViewProps<T> {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  searchPlaceholder: string;
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
  loading: boolean;
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  emptyState: ReactNode;
  renderCard: (item: T, index: number) => ReactNode;
  gridClassName?: string;
  skeletonVariant?: "card" | "detail";
  skeletonCount?: number;
  /** Custom grid skeleton card that mirrors this entity's real card shape. */
  renderSkeletonCard?: (index: number) => ReactNode;
}

const SKELETON_KEYS = Array.from(
  { length: 12 },
  (_, index) => `skeleton-${index}`,
);

const skeletonContainerVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
};

const skeletonItemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

function CardSkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="space-y-2 flex-1">
        <div className="h-4 w-2/5">
          <Skeleton />
        </div>
        <div className="h-3 w-3/5">
          <Skeleton />
        </div>
      </div>
      <div className="mt-3 h-5 w-14">
        <Skeleton variant="circular" />
      </div>
    </div>
  );
}

function DetailSkeletonCard() {
  return (
    <div className="rounded-2xl border border-border/40 bg-card p-5">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="size-9">
            <Skeleton variant="rounded" />
          </div>
          <div className="space-y-1">
            <div className="h-4 w-24">
              <Skeleton />
            </div>
            <div className="h-3 w-16">
              <Skeleton />
            </div>
          </div>
        </div>
      </div>
      <div className="mb-4 space-y-2">
        <div className="h-2.5 w-full">
          <Skeleton className="rounded-full" />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <div className="h-3 w-16">
              <Skeleton />
            </div>
            <div className="h-3 w-12">
              <Skeleton />
            </div>
          </div>
          <div className="flex justify-between">
            <div className="h-3 w-16">
              <Skeleton />
            </div>
            <div className="h-3 w-12">
              <Skeleton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Standard search + view toggle + list rendering block shared by entity list
 * pages (categories, budgets, subscriptions). Handles loading skeletons,
 * empty state and the grid/table switch for both loading and loaded states.
 */
export function EntityListView<T>({
  searchQuery,
  onSearchQueryChange,
  searchPlaceholder,
  view,
  onViewChange,
  loading,
  columns,
  data,
  keyExtractor,
  emptyState,
  renderCard,
  gridClassName = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
  skeletonVariant = "card",
  skeletonCount = 6,
  renderSkeletonCard,
}: EntityListViewProps<T>) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
        className="flex items-center gap-3 max-[420px]:flex-col max-[420px]:items-stretch"
      >
        <SearchInput
          value={searchQuery}
          onChange={onSearchQueryChange}
          placeholder={searchPlaceholder}
          className="min-w-0 flex-1"
        />
        <ViewToggle
          value={view}
          onChange={onViewChange}
          className="shrink-0 max-[420px]:self-end"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
      >
        {loading ? (
          view === "grid" ? (
            <motion.div
              variants={skeletonContainerVariants}
              initial="hidden"
              animate="show"
              className={cn(
                "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
                gridClassName,
              )}
            >
              {SKELETON_KEYS.slice(0, skeletonCount).map((key, index) => (
                <motion.div key={key} variants={skeletonItemVariants}>
                  {renderSkeletonCard ? (
                    renderSkeletonCard(index)
                  ) : skeletonVariant === "detail" ? (
                    <DetailSkeletonCard />
                  ) : (
                    <CardSkeletonCard />
                  )}
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <DataTable
              columns={columns}
              data={[]}
              keyExtractor={keyExtractor}
              loading
            />
          )
        ) : data.length === 0 ? (
          emptyState
        ) : view === "grid" ? (
          <div
            className={cn(
              "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
              gridClassName,
            )}
          >
            {data.map((item, index) => renderCard(item, index))}
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={data}
            keyExtractor={keyExtractor}
            loading={false}
            emptyState={emptyState}
          />
        )}
      </motion.div>
    </>
  );
}
