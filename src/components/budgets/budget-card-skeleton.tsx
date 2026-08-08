"use client";

import { Skeleton } from "@/components/shared";
import { cn } from "@/lib/utils";

export function BudgetCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-card to-card/50 p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <Skeleton variant="rounded" className="size-9 rounded-xl" />
          <div className="min-w-0 space-y-1.5">
            <Skeleton
              className={cn("h-3.5", index % 2 === 0 ? "w-24" : "w-20")}
            />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Skeleton variant="rounded" className="size-7" />
          <Skeleton variant="rounded" className="size-7" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3.5 w-20" />
        </div>
        <div className="h-2 rounded-full">
          <Skeleton className="rounded-full" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3.5 w-24" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3.5 w-16" />
        </div>
      </div>
    </div>
  );
}
