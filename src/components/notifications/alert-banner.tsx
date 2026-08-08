"use client";

import { cn } from "@lib/utils";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  type InboxAlert,
  type InboxAlertSeverity,
  notificationsApi,
} from "@/lib/api/notifications";
import { ArrowRight, CheckCircle2, Info, TriangleAlert, X } from "@/lib/icons";
import { getAlertAction } from "@/utils/alerts";

const variants: Record<
  InboxAlertSeverity,
  {
    container: string;
    accent: string;
    icon: string;
    iconComponent: typeof Info;
    button: string;
  }
> = {
  danger: {
    container:
      "border-danger/25 bg-gradient-to-br from-danger/10 via-card to-card",
    accent: "from-danger/60 via-danger/30 to-transparent",
    icon: "bg-gradient-to-br from-danger/25 to-danger/10 text-danger",
    iconComponent: TriangleAlert,
    button: "bg-danger/10 text-danger hover:bg-danger/15 ring-danger/15",
  },
  warning: {
    container:
      "border-warning/25 bg-gradient-to-br from-warning/10 via-card to-card",
    accent: "from-warning/60 via-warning/30 to-transparent",
    icon: "bg-gradient-to-br from-warning/25 to-warning/10 text-warning",
    iconComponent: TriangleAlert,
    button: "bg-warning/10 text-warning hover:bg-warning/15 ring-warning/15",
  },
  success: {
    container:
      "border-success/25 bg-gradient-to-br from-success/10 via-card to-card",
    accent: "from-success/60 via-success/30 to-transparent",
    icon: "bg-gradient-to-br from-success/25 to-success/10 text-success",
    iconComponent: CheckCircle2,
    button: "bg-success/10 text-success hover:bg-success/15 ring-success/15",
  },
  info: {
    container:
      "border-primary/20 bg-gradient-to-br from-primary/8 via-card to-card",
    accent: "from-primary/60 via-primary/30 to-transparent",
    icon: "bg-gradient-to-br from-primary/20 to-primary/5 text-primary",
    iconComponent: Info,
    button: "bg-primary/10 text-primary hover:bg-primary/15 ring-primary/15",
  },
};

interface AlertBannerProps {
  alert: InboxAlert;
  onDismiss: () => void;
}

export function AlertBanner({ alert, onDismiss }: AlertBannerProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const style = variants[alert.severity];
  const action = getAlertAction(alert.type);

  function handleOpen() {
    toast.dismiss(alert.id);
    if (action) router.push(action.url);
  }

  function handleAction() {
    toast.dismiss(alert.id);
    void notificationsApi.markRead({ ids: [alert.id] }).catch(() => {});
    if (action) router.push(action.url);
  }

  return (
    <div
      className={cn(
        "pointer-events-auto relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border p-3.5 shadow-[0_6px_20px_rgba(0,0,0,0.08)]",
        style.container,
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r",
          style.accent,
        )}
      />

      <Button
        variant="ghost"
        onClick={handleOpen}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left",
          "cursor-pointer hover:opacity-90",
        )}
      >
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-foreground/5",
            style.icon,
          )}
        >
          <style.iconComponent className="size-4" />
        </span>

        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold tracking-tight text-foreground">
            {alert.title}
          </span>
          {alert.description && (
            <span className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-muted-foreground">
              {alert.description}
            </span>
          )}
        </span>
      </Button>

      {action && (
        <Button
          size="sm"
          onClick={handleAction}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ring-1 ring-inset",
            "bg-none hover:bg-none",
            style.button,
          )}
        >
          {t(action.labelKey)}
          <ArrowRight className="size-3.5" />
        </Button>
      )}

      <Button
        variant="ghost"
        size="icon"
        aria-label={t("alerts.dismiss")}
        onClick={onDismiss}
        className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-none hover:bg-muted/60 hover:text-foreground"
      >
        <X className="size-3.5" />
      </Button>
    </div>
  );
}
