"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Banner, type BannerSeverity } from "@/components/shared/banner";
import { Activity, TriangleAlert } from "@/lib/icons";
import type {
  IncidentRecord,
  IncidentStatus,
  OverallStatus,
} from "@/lib/services/status";

interface SummaryResponse {
  overall: OverallStatus;
  hasIncidents: boolean;
  incidents: IncidentRecord[];
}

const POLL_INTERVAL_MS = 60_000;

const SEVERITY_BY_STATUS: Record<IncidentStatus, BannerSeverity> = {
  investigating: "warning",
  monitoring: "info",
  resolved: "success",
};

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
  const router = useRouter();
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
          <Banner
            variant="strip"
            severity={SEVERITY_BY_STATUS[latest.status]}
            icon={TriangleAlert}
            pulse
            title={
              count > 1
                ? t("status.incidentBanner.titleCount", { count })
                : t("status.incidentBanner.title")
            }
            description={
              <>
                {latest.title}
                <span className="mx-1 opacity-60">·</span>
                {t(statusKey)}
                <span className="mx-1 opacity-60">·</span>
                {relativeTime(latest.createdAt)}
              </>
            }
            actionLabel={t("status.incidentBanner.action")}
            actionIcon={Activity}
            onAction={() => router.push("/status")}
            onDismiss={() => dismiss(latest.id)}
            dismissLabel={t("common.close")}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
