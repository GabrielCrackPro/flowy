"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/shared/icon";
import type { ComponentCheck } from "@/lib/services/status";
import { cn } from "@/lib/utils";
import {
  COMPONENT_META,
  STATUS_DOT,
  STATUS_PILL,
  statusKey,
} from "./status-meta";

/**
 * Compact list of the five Flowy services and their current status — the
 * lightweight "services statuses" view shown inside the mobile status sheet
 * (the full page with charts/admin lives at /status).
 */
export function ServicesStatusList() {
  const { t } = useTranslation();
  const [components, setComponents] = useState<ComponentCheck[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/status", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("status failed");
        return response.json();
      })
      .then((body: { components: ComponentCheck[] }) => {
        if (!cancelled) setComponents(body.components);
      })
      .catch(() => {
        if (!cancelled) setComponents([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!components) {
    return (
      <div aria-busy="true" className="space-y-2">
        {[0, 1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-14 animate-pulse rounded-xl bg-muted/30"
          />
        ))}
      </div>
    );
  }

  const ordered = [...components].sort(
    (a, b) => COMPONENT_META[a.id].order - COMPONENT_META[b.id].order,
  );

  return (
    <div className="space-y-2">
      {ordered.map((component) => {
        const meta = COMPONENT_META[component.id];
        const name = t(
          `status.component${component.id[0].toUpperCase()}${component.id.slice(1)}`,
        );

        return (
          <div
            key={component.id}
            className="flex items-center gap-3 rounded-xl border border-border/40 bg-muted/20 px-3 py-2.5"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted/70 text-muted-foreground">
              <Icon icon={meta.icon} className="size-4" />
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
              {name}
            </span>
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1",
                STATUS_PILL[component.status],
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  STATUS_DOT[component.status],
                )}
              />
              {t(statusKey(component.status))}
            </span>
          </div>
        );
      })}
    </div>
  );
}
