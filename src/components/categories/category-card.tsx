"use client";

import { Badge, Button, Card } from "@components/ui";
import { cn } from "@lib/utils";
import { useTranslation } from "react-i18next";
import { Icon, Skeleton } from "@/components/shared";
import { EntityAudit } from "@/components/shared/entity-audit";
import { Pencil, Receipt, Trash2 } from "@/lib/icons";
import type { Category } from "@/types/Category";
import { CategoryIconBadge } from "./category-icon";

interface CategoryCardProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  transactionCount?: number;
}

export function CategoryCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <Card className="relative overflow-hidden p-4">
      <div className="flex items-center gap-3">
        <Skeleton variant="rounded" className="size-10 rounded-xl" />

        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton
            className={cn("h-3.5", index % 2 === 0 ? "w-2/3" : "w-1/2")}
          />
          <div className="flex items-center gap-2">
            <Skeleton variant="rounded" className="h-5 w-16" />
            <Skeleton className="h-3 w-6" />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <Skeleton variant="rounded" className="size-7" />
          <Skeleton variant="rounded" className="size-7" />
        </div>
      </div>

      <div className="mt-3 border-t border-border/40 pt-2.5">
        <Skeleton className="h-3 w-1/2" />
      </div>
    </Card>
  );
}

export function CategoryCard({
  category,
  onEdit,
  onDelete,
  transactionCount = 0,
}: CategoryCardProps) {
  const { t } = useTranslation();

  const isIncome = category.type === "INCOME";

  return (
    <Card
      className={cn(
        "group relative overflow-hidden p-4 transition duration-200",
        "hover:-translate-y-0.5 hover:border-border/60 hover:shadow-md hover:shadow-primary/5",
      )}
    >
      <div className="flex items-center gap-3">
        <CategoryIconBadge icon={category.icon} color={category.color} />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {category.name}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <Badge
              variant={isIncome ? "default" : "outline"}
              className={cn(
                isIncome &&
                  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
              )}
            >
              {t(isIncome ? "transactions.income" : "transactions.expenses")}
            </Badge>
            {transactionCount > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Icon icon={Receipt} className="size-3" />
                <span>{transactionCount}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity focus-within:opacity-100 md:opacity-0 md:group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("categories.edit")}
            onClick={() => onEdit(category)}
          >
            <Icon icon={Pencil} className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("categories.delete")}
            className="text-destructive/70 hover:text-destructive"
            onClick={() => onDelete(category)}
          >
            <Icon icon={Trash2} className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="mt-3 border-t border-border/40 pt-2.5">
        <EntityAudit
          createdAt={category.createdAt}
          createdBy={category.user}
          updatedAt={category.updatedAt}
          updatedBy={category.updatedByProfile}
        />
      </div>
    </Card>
  );
}
