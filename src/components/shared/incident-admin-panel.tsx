"use client";

import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { BottomSheet } from "@/components/shared/bottom-sheet";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DatePicker } from "@/components/shared/date-picker";
import { Icon } from "@/components/shared/icon";
import { toast } from "@/components/shared/toast";
import { PromoteAdminCard } from "@/components/status/promote-admin-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form/FormField";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useDateLocale } from "@/hooks/useDateLocale";
import { useReactForm } from "@/hooks/useReactForm";
import { authenticatedRequest } from "@/lib/api/client";
import {
  Activity,
  BellRing,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Clock,
  Database,
  HardDrive,
  Loader2,
  MessageSquare,
  Monitor,
  Plus,
  Send,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  Wrench,
} from "@/lib/icons";
import type {
  ComponentId,
  IncidentRecord,
  IncidentSeverity,
  IncidentStatus,
} from "@/lib/services/status";
import { cn } from "@/lib/utils";

interface IncidentsResponse {
  incidents: IncidentRecord[];
}

const COMPONENT_IDS: ComponentId[] = [
  "api",
  "database",
  "auth",
  "push",
  "storage",
];

const COMPONENT_META: Record<
  ComponentId,
  { icon: typeof Activity; chip: string }
> = {
  api: {
    icon: Activity,
    chip: "hover:border-primary/40 hover:text-primary",
  },
  database: {
    icon: Database,
    chip: "hover:border-primary/40 hover:text-primary",
  },
  auth: {
    icon: ShieldCheck,
    chip: "hover:border-primary/40 hover:text-primary",
  },
  push: {
    icon: BellRing,
    chip: "hover:border-primary/40 hover:text-primary",
  },
  storage: {
    icon: HardDrive,
    chip: "hover:border-primary/40 hover:text-primary",
  },
};

const STATUS_OPTIONS: Array<{
  value: IncidentStatus;
  icon: typeof TriangleAlert;
  active: string;
  idle: string;
}> = [
  {
    value: "investigating",
    icon: TriangleAlert,
    active:
      "border-amber-500/50 bg-amber-500/15 text-amber-700 shadow-sm shadow-amber-500/10 dark:text-amber-300",
    idle: "text-muted-foreground hover:border-amber-500/30 hover:text-amber-600",
  },
  {
    value: "monitoring",
    icon: Monitor,
    active:
      "border-blue-500/50 bg-blue-500/15 text-blue-700 shadow-sm shadow-blue-500/10 dark:text-blue-300",
    idle: "text-muted-foreground hover:border-blue-500/30 hover:text-blue-600",
  },
];

const STATUS_STYLES: Record<IncidentStatus, string> = {
  investigating:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  monitoring:
    "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  resolved:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
};

const SEVERITY_OPTIONS: Array<{
  value: IncidentSeverity;
  active: string;
  idle: string;
}> = [
  {
    value: "minor",
    active:
      "border-emerald-500/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    idle: "text-muted-foreground hover:border-emerald-500/30 hover:text-emerald-600",
  },
  {
    value: "major",
    active:
      "border-amber-500/50 bg-amber-500/15 text-amber-700 dark:text-amber-300",
    idle: "text-muted-foreground hover:border-amber-500/30 hover:text-amber-600",
  },
  {
    value: "critical",
    active: "border-red-500/50 bg-red-500/15 text-red-700 dark:text-red-300",
    idle: "text-muted-foreground hover:border-red-500/30 hover:text-red-600",
  },
];

const SEVERITY_BADGE: Record<IncidentSeverity, string> = {
  minor:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  major:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  critical: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
};

const createIncidentSchema = z
  .object({
    title: z.string().min(1, "status.incidents.titleRequired"),
    message: z.string().optional(),
    component: z.string().optional(),
    status: z.enum(["investigating", "monitoring"]).default("investigating"),
    severity: z.enum(["minor", "major", "critical"]).default("major"),
    type: z.enum(["incident", "maintenance"]).default("incident"),
    scheduledStart: z.string().optional(),
    scheduledEnd: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "maintenance") {
      if (!data.scheduledStart || !data.scheduledEnd) {
        ctx.addIssue({
          code: "custom",
          path: ["scheduledStart"],
          message: "status.incidents.scheduleRequired",
        });
      } else if (
        new Date(data.scheduledEnd).getTime() <=
        new Date(data.scheduledStart).getTime()
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["scheduledEnd"],
          message: "status.incidents.scheduleOrder",
        });
      }
    }
  });

const updateIncidentSchema = z.object({
  status: z.enum(["investigating", "monitoring", "resolved"]),
  message: z.string().optional(),
});

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Formats a Date into the local "YYYY-MM-DDTHH:mm" the form submits with. */
function toLocalInput(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

/**
 * Scrollable time picker popover — the time counterpart of the shared
 * Calendar. Two labelled columns (hours, minutes) with an animated selected
 * pill, auto-scroll on open, and a live preview + "Now" quick action footer.
 */
function TimePicker({
  date,
  onChange,
  disabled,
  label,
}: {
  date: Date | undefined;
  onChange: (date: Date) => void;
  disabled?: boolean;
  label: string;
}) {
  const { t } = useTranslation();
  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);

  const hour = date?.getHours() ?? 12;
  const minute = date ? Math.round(date.getMinutes() / 5) * 5 : 0;

  // Scroll the selected values into view when the popover opens.
  useEffect(() => {
    const scrollToSelected = (ref: React.RefObject<HTMLDivElement | null>) => {
      const selected = ref.current?.querySelector('[data-selected="true"]');
      selected?.scrollIntoView({ block: "center" });
    };
    scrollToSelected(hourRef);
    scrollToSelected(minuteRef);
  }, []);

  const pick = (hours: number, minutes: number) => {
    const base = date ?? new Date();
    const next = new Date(base);
    next.setHours(hours, minutes, 0, 0);
    onChange(next);
  };

  const pickNow = () => {
    const now = new Date();
    pick(now.getHours(), Math.round(now.getMinutes() / 5) * 5);
  };

  const isHourColumn = (values: number[]) => values.length === 24;

  const column = (
    values: number[],
    selected: number,
    onPick: (value: number) => void,
  ) => {
    const isHours = isHourColumn(values);
    return (
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          {isHours
            ? t("status.incidents.pickHour")
            : t("status.incidents.pickMinute")}
        </span>
        <div
          ref={isHours ? hourRef : minuteRef}
          role="listbox"
          aria-label={
            isHours
              ? t("status.incidents.pickHour")
              : t("status.incidents.pickMinute")
          }
          className="max-h-44 overflow-y-auto overscroll-contain [scrollbar-width:thin]"
        >
          {values.map((value) => {
            const isSelected = value === selected;
            return (
              <div key={value} className="relative px-1">
                {isSelected && (
                  <motion.span
                    layoutId={isHours ? "time-hour-pill" : "time-minute-pill"}
                    className="absolute inset-x-1 inset-y-0.5 rounded-md bg-gradient-to-br from-primary to-primary/90 shadow-sm"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  data-selected={isSelected}
                  onClick={() => onPick(value)}
                  disabled={disabled}
                  className={cn(
                    "relative flex h-9 w-full items-center justify-center rounded-md text-sm tabular-nums transition-colors duration-150",
                    isSelected
                      ? "font-semibold text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  {pad(value)}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Popover>
      <PopoverTrigger
        disabled={disabled}
        aria-label={label}
        className={cn(
          "flex h-11 w-32 shrink-0 items-center justify-between gap-2 rounded-xl border border-border/70 bg-background/80 px-3 text-sm shadow-sm transition outline-none",
          "hover:border-border hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-primary/30",
          !date && "text-muted-foreground",
        )}
      >
        {date ? `${pad(date.getHours())}:${pad(date.getMinutes())}` : "--:--"}
        <Clock className="size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto border-border/30 p-2.5">
        <div className="flex gap-1">
          {column(HOURS, hour, (h) => pick(h, minute))}
          <div className="mx-1 w-px shrink-0 bg-border/50" />
          {column(MINUTES, minute, (m) => pick(hour, m))}
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 border-t border-border/40 pt-2">
          <span className="text-xs font-medium tabular-nums text-foreground">
            {date
              ? `${pad(date.getHours())}:${pad(date.getMinutes())}`
              : "--:--"}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={pickNow}
            disabled={disabled}
            className="h-7 gap-1 text-xs"
          >
            <Clock className="size-3.5" />
            {t("status.incidents.pickNow")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Date + time field for the maintenance schedule window. Uses the same
 * Popover + Calendar picker as the rest of the app for the date, plus a
 * matching custom time picker — no plain datetime-local text field.
 */
function ScheduleDateTimeField({
  label,
  value,
  onChange,
  error,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const dateLocale = useDateLocale(i18n.language);
  const parsed = value ? new Date(value) : undefined;
  const date = parsed && !Number.isNaN(parsed.getTime()) ? parsed : undefined;

  const handleDateSelect = (selected?: Date) => {
    if (!selected) return;
    const base = date ?? new Date();
    const next = new Date(selected);
    next.setHours(base.getHours(), base.getMinutes(), 0, 0);
    onChange(toLocalInput(next));
  };

  return (
    <FormField label={label} error={error}>
      <div className="flex items-center gap-2">
        <DatePicker
          date={date}
          onSelect={handleDateSelect}
          placeholder={t("status.incidents.pickDate")}
          locale={dateLocale}
          disabled={disabled}
          size="default"
          align="start"
          className="min-w-0 flex-1"
        />
        <TimePicker
          date={date}
          onChange={(next) => onChange(toLocalInput(next))}
          disabled={disabled}
          label={label}
        />
      </div>
    </FormField>
  );
}

/**
 * Incident management panel on the public status page. Only rendered for
 * admins (profile.role === "admin"); the routes it calls are admin-guarded
 * server-side too. Living on /status — not inside the app — means incidents
 * can be reported even when the app itself is down.
 */
export function IncidentAdminPanel() {
  const { t } = useTranslation();
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IncidentRecord | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [updateTarget, setUpdateTarget] = useState<IncidentRecord | null>(null);
  const [previewTarget, setPreviewTarget] = useState<IncidentRecord | null>(
    null,
  );
  const [publishingId, setPublishingId] = useState<string | null>(null);
  // All incidents start expanded; clicking the header toggles them.
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  const load = useCallback(async () => {
    try {
      const { incidents } = await authenticatedRequest<IncidentsResponse>(
        "/api/status/incidents",
      );
      setIncidents(incidents);
    } catch (error) {
      console.error("Failed to load incidents:", error);
      toast.error(t("status.incidents.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const form = useReactForm({
    initialValues: {
      title: "",
      message: "",
      component: "",
      status: "investigating" as IncidentStatus,
      severity: "major" as IncidentSeverity,
      type: "incident" as "incident" | "maintenance",
      scheduledStart: "",
      scheduledEnd: "",
    },
    schema: createIncidentSchema,
    onSubmit: async (values) => {
      try {
        await authenticatedRequest("/api/status/incidents", {
          method: "POST",
          body: JSON.stringify({
            title: values.title.trim(),
            message: values.message.trim() || null,
            component: values.component || null,
            status: values.status,
            severity: values.severity,
            type: values.type,
            scheduledStart: values.scheduledStart
              ? new Date(values.scheduledStart).toISOString()
              : null,
            scheduledEnd: values.scheduledEnd
              ? new Date(values.scheduledEnd).toISOString()
              : null,
          }),
        });
        toast.success(t("status.incidents.created"));
        setCreateOpen(false);
        form.reset();
        await load();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : t("status.incidents.createError"),
        );
      }
    },
  });

  const publishDraft = async (incident: IncidentRecord) => {
    setPublishingId(incident.id);
    try {
      await authenticatedRequest(`/api/status/incidents/${incident.id}`, {
        method: "POST",
      });
      toast.success(t("status.incidents.published"));
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("status.incidents.publishError"),
      );
    } finally {
      setPublishingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await authenticatedRequest(`/api/status/incidents/${deleteTarget.id}`, {
        method: "DELETE",
      });
      toast.success(t("status.incidents.deleted"));
      setDeleteTarget(null);
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("status.incidents.deleteError"),
      );
    } finally {
      setDeleting(false);
    }
  };

  const advanceStatus = async (incident: IncidentRecord) => {
    const next: IncidentStatus =
      incident.status === "investigating"
        ? "monitoring"
        : incident.status === "monitoring"
          ? "resolved"
          : "monitoring";
    setUpdatingId(incident.id);
    try {
      await authenticatedRequest(`/api/status/incidents/${incident.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      toast.success(
        next === "resolved"
          ? t("status.incidents.resolved")
          : t("status.incidents.statusUpdated"),
      );
      await load();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("status.incidents.updateError"),
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const updateForm = useReactForm({
    initialValues: {
      status: "investigating" as IncidentStatus,
      message: "",
    },
    schema: updateIncidentSchema,
    onSubmit: async (values) => {
      if (!updateTarget) return;
      setUpdatingId(updateTarget.id);
      try {
        await authenticatedRequest(`/api/status/incidents/${updateTarget.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            status: values.status,
            message: values.message.trim() || null,
          }),
        });
        toast.success(t("status.incidents.statusUpdated"));
        setUpdateTarget(null);
        updateForm.reset();
        await load();
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : t("status.incidents.updateError"),
        );
      } finally {
        setUpdatingId(null);
      }
    },
  });

  const toggleExpanded = (id: string) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <section
      aria-label={t("status.incidents.title")}
      className="mt-8 border-t border-border/30 pt-5"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon icon={Activity} className="size-3.5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold tracking-tight">
              {t("status.incidents.title")}
            </h2>
            <p className="truncate text-[11px] text-muted-foreground">
              {t("status.incidents.description")}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          className="h-8 shrink-0 gap-1.5 px-2.5"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="size-3.5" />
          {t("status.incidents.create")}
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          {t("common.loading")}
        </div>
      ) : incidents.length === 0 ? (
        <div className="flex items-center gap-2 rounded-lg bg-muted/25 px-3 py-2.5 text-xs text-muted-foreground">
          <CheckCircle2 className="size-3.5 shrink-0 text-emerald-500" />
          <span>
            {t("status.incidents.none")} — {t("status.incidents.noneHint")}
          </span>
        </div>
      ) : (
        <div className="space-y-2.5">
          {incidents.map((incident) => {
            const expanded = !expandedIds.has(incident.id);
            return (
              <div
                key={incident.id}
                className="rounded-xl border border-border/50 bg-background/60 p-4"
              >
                {/* Clickable header — toggles the timeline */}
                <button
                  type="button"
                  onClick={() => toggleExpanded(incident.id)}
                  className="flex w-full flex-wrap items-center gap-2 text-left"
                >
                  {incident.draft && (
                    <Badge className="shrink-0 border-0 bg-gradient-to-r from-slate-500 to-slate-600 text-white">
                      {t("status.incidents.draftBadge")}
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className={cn(
                      "shrink-0 border",
                      incident.type === "maintenance"
                        ? "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400"
                        : STATUS_STYLES[incident.status],
                    )}
                  >
                    {incident.type === "maintenance"
                      ? t("status.incidents.type.maintenance")
                      : t(`status.incidents.status.${incident.status}`)}
                  </Badge>
                  {incident.type === "incident" && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0 border",
                        SEVERITY_BADGE[incident.severity],
                      )}
                    >
                      {t(`status.incidents.severity.${incident.severity}`)}
                    </Badge>
                  )}
                  {incident.component && (
                    <Badge variant="outline" className="shrink-0">
                      {t(
                        `status.component${incident.component[0].toUpperCase()}${incident.component.slice(1)}`,
                      )}
                    </Badge>
                  )}
                  <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground/60">
                    {incident.scheduledStart && incident.type === "maintenance"
                      ? `${new Date(incident.scheduledStart).toLocaleString()} → ${new Date(incident.scheduledEnd ?? incident.scheduledStart).toLocaleString()}`
                      : new Date(incident.createdAt).toLocaleDateString()}
                    <ChevronDown
                      className={cn(
                        "size-3.5 transition-transform",
                        expanded && "rotate-180",
                      )}
                    />
                  </span>
                </button>
                <p className="mt-2 font-medium text-foreground">
                  {incident.title}
                </p>
                {incident.message && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {incident.message}
                  </p>
                )}
                {incident.scheduledEnd && incident.type === "maintenance" && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-blue-600/80 dark:text-blue-400/80">
                    <CalendarClock className="size-3.5" />
                    {t("status.incidents.scheduleWindow", {
                      start: new Date(
                        incident.scheduledStart ?? "",
                      ).toLocaleString(),
                      end: new Date(incident.scheduledEnd).toLocaleString(),
                    })}
                  </p>
                )}

                {/* Timeline */}
                {expanded && incident.updates.length > 1 && (
                  <ol className="mt-4 space-y-3 border-l border-border/50 pl-4">
                    {incident.updates.map((update) => (
                      <li key={update.id} className="relative">
                        <span
                          className={cn(
                            "absolute -left-[21px] top-1 size-2 rounded-full border border-border bg-background",
                            update.status === "resolved"
                              ? "bg-emerald-500"
                              : update.status === "monitoring"
                                ? "bg-blue-500"
                                : "bg-amber-500",
                          )}
                        />
                        <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground/60">
                          <span className="font-medium text-foreground/80">
                            {t(`status.incidents.status.${update.status}`)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="size-3" />
                            {new Date(update.createdAt).toLocaleString()}
                          </span>
                        </p>
                        {update.message && (
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {update.message}
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                )}

                <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/40 pt-3">
                  <span className="text-[11px] text-muted-foreground/60">
                    {incident.updates.length}{" "}
                    {incident.updates.length === 1
                      ? t("status.incidents.updateSingular")
                      : t("status.incidents.updatePlural")}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {incident.draft && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                        disabled={publishingId === incident.id}
                        onClick={() => setPreviewTarget(incident)}
                      >
                        {publishingId === incident.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Send className="size-3.5" />
                        )}
                        {t("status.incidents.publish")}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => {
                        setUpdateTarget(incident);
                        updateForm.setFieldValue(
                          "status",
                          incident.status === "resolved"
                            ? "investigating"
                            : incident.status,
                        );
                        updateForm.setFieldValue("message", "");
                      }}
                    >
                      <MessageSquare className="size-3.5" />
                      {t("status.incidents.addUpdate")}
                    </Button>
                    {incident.status !== "resolved" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        disabled={updatingId === incident.id}
                        onClick={() => advanceStatus(incident)}
                      >
                        {updatingId === incident.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Monitor className="size-3.5" />
                        )}
                        {incident.status === "investigating"
                          ? t("status.incidents.markMonitoring")
                          : t("status.incidents.markResolved")}
                      </Button>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="size-3.5" />
                        {t("status.incidents.status.resolved")}
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t("status.incidents.delete")}
                      title={t("status.incidents.delete")}
                      className="text-muted-foreground/60 hover:text-destructive"
                      onClick={() => setDeleteTarget(incident)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admin tooling — promote another account to admin. Only rendered for
          admins (this whole panel is admin-only) and the API it calls is
          requireAdmin() guarded. */}
      <PromoteAdminCard />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={t("status.incidents.deleteConfirmTitle")}
        description={
          deleteTarget
            ? t("status.incidents.deleteConfirmDesc", {
                title: deleteTarget.title,
              })
            : ""
        }
        confirmLabel={
          deleting
            ? t("status.incidents.deleting")
            : t("status.incidents.delete")
        }
        onConfirm={() => void confirmDelete()}
      />

      {/* Draft preview before publishing publicly */}
      <BottomSheet
        open={previewTarget !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewTarget(null);
        }}
        title={t("status.incidents.preview")}
        description={t("status.incidents.previewHint")}
        icon={<Icon icon={Send} className="size-5" />}
        iconGradient="from-primary/20 to-primary/10"
        iconColor="text-primary"
        className="sm:max-w-[500px] sm:mx-auto sm:rounded-3xl"
        contentClassName="px-4 py-5 sm:px-6 sm:py-6"
        footerSecondary={
          <Button
            type="button"
            variant="ghost"
            onClick={() => setPreviewTarget(null)}
            disabled={publishingId !== null}
            className="h-11 w-full sm:h-10 sm:w-auto sm:px-4"
          >
            {t("common.cancel")}
          </Button>
        }
        footerPrimary={
          <Button
            type="button"
            onClick={() => {
              if (!previewTarget) return;
              void publishDraft(previewTarget).then(() =>
                setPreviewTarget(null),
              );
            }}
            disabled={publishingId !== null}
            className="h-12 w-full gap-2 font-semibold shadow-md shadow-primary/20 sm:h-10 sm:w-auto sm:min-w-28"
          >
            {publishingId !== null ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            {t("status.incidents.publish")}
          </Button>
        }
      >
        {previewTarget && (
          <article className="space-y-3 rounded-xl border border-border/50 bg-background/60 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={cn("border", STATUS_STYLES[previewTarget.status])}
              >
                {t(`status.incidents.status.${previewTarget.status}`)}
              </Badge>
              <Badge
                variant="outline"
                className={cn("border", SEVERITY_BADGE[previewTarget.severity])}
              >
                {t(`status.incidents.severity.${previewTarget.severity}`)}
              </Badge>
              {previewTarget.component && (
                <Badge variant="outline">
                  {t(
                    `status.component${previewTarget.component[0].toUpperCase()}${previewTarget.component.slice(1)}`,
                  )}
                </Badge>
              )}
            </div>
            <h3 className="text-base font-semibold">{previewTarget.title}</h3>
            {previewTarget.message && (
              <p className="text-sm text-muted-foreground">
                {previewTarget.message}
              </p>
            )}
          </article>
        )}
      </BottomSheet>

      {/* Post an update to an existing incident */}
      <BottomSheet
        open={updateTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setUpdateTarget(null);
            updateForm.reset();
          }
        }}
        title={t("status.incidents.addUpdate")}
        description={
          updateTarget
            ? t("status.incidents.addUpdateHint", {
                title: updateTarget.title,
              })
            : ""
        }
        icon={<Icon icon={MessageSquare} className="size-5" />}
        iconGradient="from-primary/20 to-primary/10"
        iconColor="text-primary"
        className="sm:max-w-[500px] sm:mx-auto sm:rounded-3xl"
        contentClassName="px-4 py-5 sm:px-6 sm:py-6"
        footerSecondary={
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setUpdateTarget(null);
              updateForm.reset();
            }}
            disabled={updatingId !== null}
            className="h-11 w-full sm:h-10 sm:w-auto sm:px-4"
          >
            {t("common.cancel")}
          </Button>
        }
        footerPrimary={
          <Button
            type="submit"
            onClick={() => updateForm.handleSubmit()}
            disabled={updatingId !== null}
            className="h-12 w-full gap-2 font-semibold shadow-md shadow-primary/20 sm:h-10 sm:w-auto sm:min-w-28"
          >
            {updatingId !== null ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t("common.saving")}
              </>
            ) : (
              <>
                {t("status.incidents.postUpdate")}
                <MessageSquare className="size-4" />
              </>
            )}
          </Button>
        }
      >
        <form
          onSubmit={(e) => updateForm.handleSubmit(e)}
          className="space-y-6"
        >
          {/* Status picker — all three states */}
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {t("status.incidents.statusLabel")}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "investigating" as const, icon: TriangleAlert },
                { value: "monitoring" as const, icon: Monitor },
                { value: "resolved" as const, icon: CheckCircle2 },
              ].map((option) => {
                const selected = updateForm.values.status === option.value;
                return (
                  <motion.button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() =>
                      updateForm.setFieldValue("status", option.value)
                    }
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-center transition",
                      selected
                        ? STATUS_STYLES[option.value]
                        : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground",
                    )}
                  >
                    <Icon icon={option.icon} className="size-4" />
                    <span className="text-[11px] font-semibold leading-tight">
                      {t(`status.incidents.status.${option.value}`)}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Message */}
          <FormField
            label={t("status.incidents.messageLabel")}
            error={updateForm.errors.message}
          >
            <Textarea
              id="incidentUpdateMessage"
              placeholder={t("status.incidents.updatePlaceholder")}
              value={updateForm.values.message}
              onChange={updateForm.handleChange("message")}
              disabled={updatingId !== null}
              rows={4}
              className="rounded-xl border-border/70 bg-background/80 shadow-sm"
            />
          </FormField>

          {updateForm.error ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {updateForm.error}
            </div>
          ) : null}
        </form>
      </BottomSheet>

      <BottomSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        title={t("status.incidents.create")}
        description={t("status.incidents.createHint")}
        icon={<Icon icon={Activity} className="size-5" />}
        iconGradient="from-primary/20 to-primary/10"
        iconColor="text-primary"
        className="sm:max-w-[500px] sm:mx-auto sm:rounded-3xl"
        contentClassName="px-4 py-5 sm:px-6 sm:py-6"
        footerSecondary={
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setCreateOpen(false);
              form.reset();
            }}
            disabled={form.busy}
            className="h-11 w-full sm:h-10 sm:w-auto sm:px-4"
          >
            {t("common.cancel")}
          </Button>
        }
        footerPrimary={
          <Button
            type="submit"
            onClick={() => form.handleSubmit()}
            disabled={form.busy}
            className="h-12 w-full gap-2 font-semibold shadow-md shadow-primary/20 sm:h-10 sm:w-auto sm:min-w-28"
          >
            {form.busy ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t("common.saving")}
              </>
            ) : (
              <>
                {t("common.create")}
                <Plus className="size-4" />
              </>
            )}
          </Button>
        }
      >
        <form onSubmit={(e) => form.handleSubmit(e)} className="space-y-6">
          {/* Type picker — incident or maintenance */}
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {t("status.incidents.typeLabel")}
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                {
                  value: "incident" as const,
                  icon: TriangleAlert,
                  active:
                    "border-amber-500/50 bg-amber-500/15 text-amber-700 dark:text-amber-300",
                },
                {
                  value: "maintenance" as const,
                  icon: CalendarClock,
                  active:
                    "border-blue-500/50 bg-blue-500/15 text-blue-700 dark:text-blue-300",
                },
              ].map((option) => {
                const selected = form.values.type === option.value;
                return (
                  <motion.button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => form.setFieldValue("type", option.value)}
                    className={cn(
                      "flex flex-col items-start gap-2 rounded-xl border-2 p-3.5 text-left transition",
                      selected
                        ? option.active
                        : "border-border/60 text-muted-foreground hover:border-border hover:text-foreground",
                    )}
                  >
                    <Icon icon={option.icon} className="size-5" />
                    <span className="text-sm font-semibold">
                      {t(`status.incidents.type.${option.value}`)}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Maintenance schedule window */}
          {form.values.type === "maintenance" && (
            <div className="space-y-2 rounded-xl border border-blue-500/20 bg-blue-500/[0.04] p-3.5">
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                {t("status.incidents.scheduleLabel")}
              </p>
              <div className="grid grid-cols-1 gap-2.5">
                <ScheduleDateTimeField
                  label={t("status.incidents.scheduleStart")}
                  value={form.values.scheduledStart}
                  onChange={(value) =>
                    form.setFieldValue("scheduledStart", value)
                  }
                  error={form.errors.scheduledStart}
                  disabled={form.busy}
                />
                <ScheduleDateTimeField
                  label={t("status.incidents.scheduleEnd")}
                  value={form.values.scheduledEnd}
                  onChange={(value) =>
                    form.setFieldValue("scheduledEnd", value)
                  }
                  error={form.errors.scheduledEnd}
                  disabled={form.busy}
                />
              </div>
            </div>
          )}

          {/* Status picker — only for incidents */}
          {form.values.type === "incident" && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {t("status.incidents.statusLabel")}
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {STATUS_OPTIONS.map((option) => {
                  const selected = form.values.status === option.value;
                  return (
                    <motion.button
                      key={option.value}
                      type="button"
                      aria-pressed={selected}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => form.setFieldValue("status", option.value)}
                      className={cn(
                        "flex flex-col items-start gap-2 rounded-xl border-2 p-3.5 text-left transition",
                        selected ? option.active : option.idle,
                      )}
                    >
                      <Icon icon={option.icon} className="size-5" />
                      <span className="text-sm font-semibold">
                        {t(`status.incidents.status.${option.value}`)}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Severity picker — only for incidents */}
          {form.values.type === "incident" && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {t("status.incidents.severityLabel")}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {SEVERITY_OPTIONS.map((option) => {
                  const selected = form.values.severity === option.value;
                  return (
                    <motion.button
                      key={option.value}
                      type="button"
                      aria-pressed={selected}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() =>
                        form.setFieldValue("severity", option.value)
                      }
                      className={cn(
                        "flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-center transition",
                        selected ? option.active : option.idle,
                      )}
                    >
                      <span className="text-sm font-semibold">
                        {t(`status.incidents.severity.${option.value}`)}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Component picker — icon grid like the category picker */}
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {t("status.incidents.componentLabel")}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <motion.button
                type="button"
                aria-pressed={!form.values.component}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => form.setFieldValue("component", "")}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-center transition",
                  !form.values.component
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                <Icon icon={Wrench} className="size-4" />
                <span className="text-[11px] font-medium leading-tight">
                  {t("status.incidents.allComponents")}
                </span>
              </motion.button>
              {COMPONENT_IDS.map((id) => {
                const meta = COMPONENT_META[id];
                const selected = form.values.component === id;
                return (
                  <motion.button
                    key={id}
                    type="button"
                    aria-pressed={selected}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => form.setFieldValue("component", id)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-center transition",
                      selected
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : cn(
                            "border-border/60 text-muted-foreground",
                            meta.chip,
                          ),
                    )}
                  >
                    <Icon icon={meta.icon} className="size-4" />
                    <span className="text-[11px] font-medium leading-tight">
                      {t(
                        `status.component${id[0].toUpperCase()}${id.slice(1)}`,
                      )}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <FormField
            label={t("status.incidents.titleLabel")}
            error={form.errors.title}
          >
            <Input
              id="incidentTitle"
              placeholder={t("status.incidents.titlePlaceholder")}
              value={form.values.title}
              onChange={form.handleChange("title")}
              disabled={form.busy}
              className="h-11 rounded-xl border-border/70 bg-background/80 shadow-sm"
            />
          </FormField>

          {/* Message */}
          <FormField
            label={t("status.incidents.messageLabel")}
            error={form.errors.message}
          >
            <Textarea
              id="incidentMessage"
              placeholder={t("status.incidents.messagePlaceholder")}
              value={form.values.message}
              onChange={form.handleChange("message")}
              disabled={form.busy}
              rows={4}
              className="rounded-xl border-border/70 bg-background/80 shadow-sm"
            />
          </FormField>

          {form.error ? (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {form.error}
            </div>
          ) : null}
        </form>
      </BottomSheet>
    </section>
  );
}
