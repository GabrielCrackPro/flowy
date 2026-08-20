"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@components/ui";
import { cn } from "@lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown as ChevronDownData,
  ChevronUp as ChevronUpData,
} from "lucide";
import { MorphIcon } from "morphicons/react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "@/lib/icons";
import { Icon } from "../icon";
import { Skeleton } from "../skeleton";

export interface Column<T> {
  header: ReactNode;
  /** Accessible label for sortable columns whose visual header is intentionally hidden. */
  sortLabel?: string;
  cell: (item: T) => ReactNode;
  className?: string;
  sortable?: boolean;
  sortValue?: (item: T) => string | number;
  /** Placeholder rendered for this column while the table is loading. Falls back to a generic text bar. */
  skeleton?: ReactNode;
}

interface ColumnMeta<T> {
  key: string;
  column: Column<T>;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  loading: boolean;
  emptyState?: ReactNode;
  pageSize?: number;
  pageSizes?: number[];
  onRowClick?: (item: T) => void;
  stickyHeader?: boolean;
  /** Removes outer border/shadow wrapper — use when DataTable is inside a Card */
  bare?: boolean;
}

function createColumnKeys<T>(columns: Column<T>[]): ColumnMeta<T>[] {
  const counts = new Map<string, number>();

  return columns.map((column) => {
    const headerText =
      typeof column.header === "string" ? column.header : "column";
    const baseKey = `${headerText}-${column.className ?? "default"}-${
      column.sortable ? "sortable" : "static"
    }`;
    const nextCount = (counts.get(baseKey) ?? 0) + 1;
    counts.set(baseKey, nextCount);

    return {
      key: `${baseKey}-${nextCount}`,
      column,
    };
  });
}

function RowSkeleton<T>({
  columns,
  index,
}: {
  columns: ColumnMeta<T>[];
  index: number;
}) {
  return (
    <>
      {columns.map(({ key, column: col }) => (
        <TableCell key={key} className={cn(col.className, "px-4 py-4")}>
          {col.skeleton ?? (
            <Skeleton
              className={cn("h-4", index % 2 === 0 ? "w-4/5" : "w-3/5")}
            />
          )}
        </TableCell>
      ))}
    </>
  );
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading,
  emptyState,
  pageSize: initialPageSize = 20,
  pageSizes = [10, 20, 50],
  onRowClick,
  stickyHeader = true,
  bare = false,
}: DataTableProps<T>) {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  // Only treat loading as a "refresh" once the table has rendered data, so a
  // table that mounts mid-fetch (e.g. transactions page) doesn't flash dimmed.
  const hasLoadedOnce = useRef(false);
  const columnMeta = useMemo(() => createColumnKeys(columns), [columns]);
  const skeletonRows = useMemo(
    () =>
      Array.from({ length: Math.min(pageSize, 10) }, (_, value) => value + 1),
    [pageSize],
  );

  const handleSort = useCallback(
    (colIndex: number) => {
      if (sortColumn === colIndex) {
        setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortColumn(colIndex);
        setSortDirection("asc");
      }
      setPage(1);
    },
    [sortColumn],
  );

  const sorted = useMemo(() => {
    if (sortColumn === null) return data;
    const col = columnMeta[sortColumn]?.column;
    if (!col) return data;
    if (!col.sortable) return data;
    const getValue =
      col.sortValue ?? ((item: T) => String(col.cell(item) ?? ""));
    return [...data].sort((a, b) => {
      const va = getValue(a);
      const vb = getValue(b);
      let cmp = 0;
      if (typeof va === "number" && typeof vb === "number") {
        cmp = va - vb;
      } else {
        cmp = String(va).localeCompare(String(vb));
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
  }, [columnMeta, data, sortColumn, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginatedData = useMemo(
    () => sorted.slice((page - 1) * pageSize, page * pageSize),
    [sorted, page, pageSize],
  );

  useEffect(() => {
    setPage(1);
  }, []);

  useEffect(() => {
    if (!loading && data.length > 0) {
      hasLoadedOnce.current = true;
    }
  }, [loading, data]);

  const renderHeader = (className?: string) => (
    <TableHeader
      className={cn(
        stickyHeader && "sticky top-0 z-10",
        "bg-background/95 backdrop-blur-sm",
        className,
      )}
    >
      <TableRow className="border-b border-border/30 bg-muted/10 md:bg-gradient-to-r md:from-muted/10 md:to-muted/5">
        {columnMeta.map(({ key, column: col }, index) => (
          <TableHead
            key={key}
            aria-sort={
              col.sortable && sortColumn === index
                ? sortDirection === "asc"
                  ? "ascending"
                  : "descending"
                : "none"
            }
            className={cn(
              "h-10 px-2.5 py-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/70 md:h-14 md:px-4 md:py-0 md:text-[11px] md:tracking-widest",
              col.className,
            )}
          >
            {col.sortable ? (
              <button
                type="button"
                onClick={() => handleSort(index)}
                aria-label={
                  typeof col.header === "string" ? col.header : col.sortLabel
                }
                className="inline-flex min-h-8 items-center gap-1 rounded-md text-left transition-colors hover:text-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 md:min-h-10 md:gap-1.5"
              >
                {col.header}
                <span className="hidden flex-col -space-y-1 md:flex">
                  <motion.span
                    animate={{
                      opacity:
                        sortColumn === index && sortDirection === "asc"
                          ? 1
                          : 0.3,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <Icon
                      icon={ChevronUp}
                      className={cn(
                        "size-3",
                        sortColumn === index && sortDirection === "asc"
                          ? "text-primary"
                          : "text-muted-foreground/30",
                      )}
                    />
                  </motion.span>
                  <motion.span
                    animate={{
                      opacity:
                        sortColumn === index && sortDirection === "desc"
                          ? 1
                          : 0.3,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <Icon
                      icon={ChevronDown}
                      className={cn(
                        "size-3",
                        sortColumn === index && sortDirection === "desc"
                          ? "text-primary"
                          : "text-muted-foreground/30",
                      )}
                    />
                  </motion.span>
                </span>
                <Icon
                  icon={
                    sortColumn === index && sortDirection === "desc"
                      ? ChevronDown
                      : ChevronUp
                  }
                  className={cn(
                    "size-3 md:hidden",
                    sortColumn === index
                      ? "text-primary"
                      : "text-muted-foreground/30",
                  )}
                />
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                {col.header}
              </span>
            )}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );

  if (loading && data.length === 0) {
    return (
      <div
        className={cn(
          "overflow-hidden",
          bare ? "" : "rounded-xl border border-border/30 shadow-sm",
        )}
      >
        <Table>
          {renderHeader(bare ? "border-t-0" : undefined)}
          <TableBody>
            {skeletonRows.map((row, index) => (
              <motion.tr
                key={row}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: 0.25,
                  delay: index * 0.04,
                  ease: "easeOut",
                }}
                className="border-b border-border/20 last:border-b-0"
              >
                <RowSkeleton columns={columnMeta} index={index} />
              </motion.tr>
            ))}
          </TableBody>
        </Table>

        {/* Pagination footer skeleton — keeps layout stable when the table loads */}
        <div className="flex items-center justify-between border-t border-border/30 bg-gradient-to-r from-muted/10 to-muted/5 px-4 py-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-3 w-28" />
            <Skeleton variant="rounded" className="h-8 w-14" />
          </div>
          <div className="flex items-center gap-1.5">
            <Skeleton variant="rounded" className="size-8" />
            <Skeleton className="h-3 w-6" />
            <Skeleton variant="rounded" className="size-8" />
          </div>
        </div>
      </div>
    );
  }

  const isRefreshing = loading && data.length > 0 && hasLoadedOnce.current;

  return (
    <div className={cn(!bare && "space-y-4")}>
      <div
        className={cn(
          "overflow-hidden bg-gradient-to-br from-card to-card/50",
          bare ? "" : "rounded-xl border border-border/30 shadow-sm",
        )}
      >
        <div className="relative" aria-busy={isRefreshing || undefined}>
          <Table
            className={cn(
              "transition-opacity duration-300",
              isRefreshing && "opacity-60",
            )}
          >
            {renderHeader(bare ? "border-t-0" : undefined)}
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="p-0">
                    {emptyState}
                  </TableCell>
                </TableRow>
              ) : (
                <AnimatePresence mode="popLayout">
                  {paginatedData.map((item, index) => (
                    <motion.tr
                      key={keyExtractor(item)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2, delay: index * 0.02 }}
                      tabIndex={onRowClick ? 0 : undefined}
                      aria-label={
                        onRowClick ? t("common.openDetails") : undefined
                      }
                      className={cn(
                        "group border-b border-border/20 transition duration-200 last:border-b-0",
                        onRowClick &&
                          "cursor-pointer hover:bg-primary/5 focus-visible:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40",
                      )}
                      onClick={onRowClick ? () => onRowClick(item) : undefined}
                      onKeyDown={
                        onRowClick
                          ? (event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                onRowClick(item);
                              }
                            }
                          : undefined
                      }
                    >
                      {columnMeta.map(({ key, column: col }) => (
                        <TableCell
                          key={key}
                          className={cn(
                            col.className,
                            "px-2.5 py-3 group-hover:bg-primary/[0.02] transition-colors md:px-4 md:py-4",
                          )}
                        >
                          {col.cell(item)}
                        </TableCell>
                      ))}
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </TableBody>
          </Table>

          {/* Refresh shimmer — subtle feedback while existing data is refetching */}
          {isRefreshing && (
            <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-0.5 overflow-hidden bg-border/40">
              <motion.div
                className="h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-primary/60 to-transparent"
                animate={{ x: ["-100%", "400%"] }}
                transition={{
                  repeat: Infinity,
                  duration: 1.2,
                  ease: "easeInOut",
                }}
              />
            </div>
          )}
        </div>
      </div>

      {data.length > 0 && (
        <div
          className={cn(
            "flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border/30 bg-gradient-to-r from-muted/10 to-muted/5 px-3 py-3 sm:px-4",
            bare ? "" : "rounded-b-xl",
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            <p className="min-w-0 truncate text-xs text-muted-foreground/70">
              {(page - 1) * pageSize + 1}–
              {Math.min(page * pageSize, sorted.length)} {t("pagination.of")}{" "}
              {sorted.length}
            </p>
            <div className="relative">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setPageSizeOpen(!pageSizeOpen)}
                aria-label={t("pagination.pageSize")}
                className="flex h-8 items-center gap-1.5 rounded-lg border border-border/30 bg-card pl-2.5 pr-2 text-xs font-medium text-muted-foreground/80 transition duration-200 hover:border-border/50 hover:bg-muted/30 hover:text-foreground focus:border-ring focus:ring-2 focus:ring-primary/20 shadow-sm"
              >
                {pageSize}
                <MorphIcon
                  icon={pageSizeOpen ? ChevronUpData : ChevronDownData}
                  size={14}
                  reducedMotion="user"
                />
              </motion.button>
              <AnimatePresence>
                {pageSizeOpen && (
                  <>
                    <motion.button
                      type="button"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      aria-label={t("pagination.closePageSizeMenu")}
                      className="fixed inset-0 z-40"
                      onClick={() => setPageSizeOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute bottom-full left-0 z-50 mb-1 min-w-20 overflow-hidden rounded-lg border border-border/30 bg-popover py-1 shadow-lg"
                    >
                      {pageSizes.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            setPageSize(s);
                            setPageSizeOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center px-3 py-1.5 text-xs transition",
                            s === pageSize
                              ? "bg-gradient-to-r from-primary/20 to-primary/10 font-semibold text-primary"
                              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <motion.button
              type="button"
              disabled={page <= 1}
              whileHover={{ scale: page > 1 ? 1.05 : 1 }}
              whileTap={{ scale: page > 1 ? 0.95 : 1 }}
              onClick={() => setPage((p) => p - 1)}
              aria-label={t("pagination.previousPage")}
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground/50 transition duration-200 hover:bg-muted/30 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none disabled:hover:bg-transparent"
            >
              <Icon icon={ChevronLeft} className="size-4" />
            </motion.button>
            <span className="min-w-8 text-center text-xs font-semibold tabular-nums text-foreground/90">
              {page}/{totalPages}
            </span>
            <motion.button
              type="button"
              disabled={page >= totalPages}
              whileHover={{ scale: page < totalPages ? 1.05 : 1 }}
              whileTap={{ scale: page < totalPages ? 0.95 : 1 }}
              onClick={() => setPage((p) => p + 1)}
              aria-label={t("pagination.nextPage")}
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground/50 transition duration-200 hover:bg-muted/30 hover:text-foreground disabled:opacity-30 disabled:pointer-events-none disabled:hover:bg-transparent"
            >
              <Icon icon={ChevronRight} className="size-4" />
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}
