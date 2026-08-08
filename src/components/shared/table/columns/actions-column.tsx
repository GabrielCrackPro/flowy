import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@components/ui";
import type { ReactNode } from "react";
import { MoreHorizontal } from "@/lib/icons";
import { Icon } from "../../icon";
import { Skeleton } from "../../skeleton";
import type { Column } from "../data-table";

interface ActionItem {
  label?: ReactNode;
  icon?: ReactNode;
  variant?: "default" | "destructive";
  separator?: boolean;
  onClick?: () => void;
}

interface ActionsColumnOptions<T> {
  className?: string;
  actions: (row: T) => ActionItem[];
}

export function ActionsColumn<T>({
  actions,
  className = "w-12",
}: ActionsColumnOptions<T>): Column<T> {
  return {
    header: null,
    className,

    skeleton: (
      <div className="flex justify-end">
        <Skeleton variant="rounded" className="size-7" />
      </div>
    ),
    cell: (row) => {
      const items = actions(row);

      return (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground/40 hover:bg-muted/70 hover:text-foreground"
                onClick={(e) => e.stopPropagation()}
              >
                <Icon icon={MoreHorizontal} className="size-4" />
              </Button>
            }
          />

          <DropdownMenuContent align="end" sideOffset={4} className="min-w-36">
            {items.map((item, index) =>
              item.separator ? (
                <DropdownMenuSeparator key={index} />
              ) : (
                <DropdownMenuItem
                  key={index}
                  variant={item.variant}
                  onClick={(e) => {
                    e.stopPropagation();
                    item.onClick?.();
                  }}
                >
                  {item.icon}
                  {item.label}
                </DropdownMenuItem>
              ),
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  };
}
