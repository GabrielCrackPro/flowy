import {
  Activity,
  BellRing,
  Database,
  HardDrive,
  ShieldCheck,
} from "@/lib/icons";
import type { ComponentId, ComponentStatus } from "@/lib/services/status";

export const COMPONENT_META: Record<
  ComponentId,
  { icon: typeof Activity; order: number }
> = {
  api: { icon: Activity, order: 0 },
  database: { icon: Database, order: 1 },
  auth: { icon: ShieldCheck, order: 2 },
  push: { icon: BellRing, order: 3 },
  storage: { icon: HardDrive, order: 4 },
};

export function statusKey(status: ComponentStatus): string {
  switch (status) {
    case "ok":
      return "status.statusOk";
    case "degraded":
      return "status.statusDegraded";
    case "down":
      return "status.statusDown";
  }
}

export const STATUS_PILL: Record<ComponentStatus, string> = {
  ok: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400",
  degraded:
    "bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-400",
  down: "bg-red-500/10 text-red-600 ring-red-500/20 dark:text-red-400",
};

export const STATUS_DOT: Record<ComponentStatus, string> = {
  ok: "bg-emerald-500",
  degraded: "bg-amber-500",
  down: "bg-red-500",
};
