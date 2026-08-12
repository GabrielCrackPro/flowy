"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Activity, TriangleAlert, X } from "@/lib/icons";
import type {
  IncidentRecord,
  IncidentStatus,
  OverallStatus,
} from "@/lib/services/status";
import { cn } from "@/lib/utils";

interface SummaryResponse {
  overall: OverallStatus;
  hasIncidents: boolean;
  incidents: IncidentRecord[];
}

const POLL_INTERVAL_MS = 60_000;

function getDismissed(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem("flowy-incident-dismissed");
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function saveDismissed(ids: Set<string>) {
  try {
    localStorage.setItem("flowy-incident-dismissed", JSON.stringify([...ids]));
  } catch {
    // Ignore storage failures (private mode etc.)
  }
}

const BANNER_STYLES: Record<
  IncidentStatus,
  { bar: string; icon: string; text: string; sub: string }
> = {
  investigating: {
    bar: "border-amber-500/25 bg-amber-500/10",
    icon: "text-amber-600 dark:text-amber-400",
    text: "text-amber-900 dark:text-amber-100",
    sub: "text-amber-800/80 dark:text-amber-200/70",
  },
  monitoring: {
    bar: "border-blue-500/25 bg-blue-500/10",
    icon: "text-blue-600 dark:text-blue-400",
    text: "text-blue-900 dark:text-blue-100",
    sub: "text-blue-800/80 dark:text-blue-200/70",
  },
  resolved: {
    bar: "border-emerald-500/25 bg-emerald-500/10",
    icon: "text-emerald-600 dark:text-emerald-400",
    text: "text-emerald-900 dark:text-emerald-100",
    sub: "text-emerald-800/80 dark:text-emerald-200/70",
  },
};

function relativeTime(iso: string): string {
  const elapsed = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 1) return "1m";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

/**
 * Status strip under the header shown while incidents are active. Polls the
 * lightweight summary endpoint (no probes); dismissible per incident, so a
 * new incident reappears even if an older one was closed. Colors follow the
 * worst active incident (investigating/monitoring).
 */
export function IncidentBanner() {
  const { t } = useTranslation();
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(getDismissed);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const response = await fetch("/api/status/summary", {
          cache: "no-store",
        });
        if (!response.ok) return;
        const body = (await response.json()) as SummaryResponse;
        if (!cancelled) setIncidents(body.incidents ?? []);
      } catch {
        // Keep the last known state.
      }
    };

    void poll();
    const interval = window.setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const visible = incidents.filter((incident) => !dismissed.has(incident.id));
  const latest = visible[0];
  const count = visible.length;

  const dismiss = (id: string) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveDismissed(next);
      return next;
    });
  };

  const styles = BANNER_STYLES[latest?.status ?? "investigating"];
  const statusKey = latest
    ? `status.incidentStatus.${latest.status}`
    : "status.incidentStatus.investigating";

  return (
    <AnimatePresence initial={false}>
      {latest && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className={cn("border-b px-4 py-2", styles.bar)}>
            <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-x-2.5 gap-y-1">
              <span className="relative flex size-4 shrink-0 items-center justify-center">
                <span
                  className={cn(
                    "absolute inline-flex size-full animate-ping rounded-full opacity-40",
                    latest.status === "monitoring"
                      ? "bg-blue-400"
                      : "bg-amber-400",
                  )}
                />
                <TriangleAlert
                  aria-hidden
                  className={cn("relative size-4 shrink-0", styles.icon)}
                />
              </span>

              <div className="min-w-0 flex-1 basis-40">
                <p
                  className={cn("truncate text-sm font-semibold", styles.text)}
                >
                  {count > 1
                    ? t("status.incidentBanner.titleCount", { count })
                    : t("status.incidentBanner.title")}
                </p>
                <p className={cn("truncate text-xs", styles.sub)}>
                  {latest.title}
                  <span className="mx-1 opacity-60">·</span>
                  {t(statusKey)}
                  <span className="mx-1 opacity-60">·</span>
                  {relativeTime(latest.createdAt)}
                </p>
              </div>

              <ButtonLink href="/status" status={latest.status}>
                {t("status.incidentBanner.action")}
              </ButtonLink>
              <button
                type="button"
                onClick={() => dismiss(latest.id)}
                aria-label={t("common.close")}
                className={cn(
                  "shrink-0 rounded-md p-1 opacity-60 transition hover:bg-foreground/5 hover:opacity-100",
                  styles.icon,
                )}
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ButtonLink({
  href,
  children,
  status,
}: {
  href: string;
  children: React.ReactNode;
  status: IncidentStatus;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-white shadow-sm transition",
        status === "monitoring"
          ? "bg-blue-600 hover:bg-blue-700"
          : "bg-amber-600 hover:bg-amber-700",
      )}
    >
      <Activity className="size-3.5" />
      {children}
    </Link>
  );
}
