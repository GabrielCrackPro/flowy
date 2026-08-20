"use client";

import { Crown as CrownData } from "lucide";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LoadingIcon } from "@/components/shared";
import { toast } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { authenticatedRequest } from "@/lib/api/client";
import { Crown, KeyRound } from "@/lib/icons";

interface BootstrapStatus {
  enabled: boolean;
  hasAdmin: boolean;
}

/**
 * First-admin bootstrap: lets the owner claim the admin role in-app while no
 * admin exists, using ADMIN_BOOTSTRAP_SECRET (server-side). Shown only to
 * signed-in users when the server reports no admin exists yet. Once an admin
 * is claimed, this card never appears again — later promotions go through
 * the admin panel's PromoteAdminCard.
 */
export function ClaimAdminAccessCard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [status, setStatus] = useState<BootstrapStatus | null>(null);
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const body = await authenticatedRequest<BootstrapStatus>(
        "/api/admin/bootstrap",
      );
      setStatus(body);
    } catch {
      // Endpoint requires auth — treat as not enabled for guests.
      setStatus({ enabled: false, hasAdmin: true });
    }
  }, []);

  useEffect(() => {
    if (user) void load();
  }, [user, load]);

  const claim = async () => {
    if (!secret.trim() || busy) return;
    setBusy(true);
    try {
      const { message } = await authenticatedRequest<{ message: string }>(
        "/api/admin/bootstrap",
        { method: "POST", body: JSON.stringify({ secret: secret.trim() }) },
      );
      toast.success(message ?? t("status.admin.claimed"));
      setSecret("");
      setStatus({ enabled: false, hasAdmin: true });
      // A refresh picks up the admin panel on the status page.
      window.location.reload();
    } catch (error) {
      if (error instanceof Error) {
        if (/invalid secret/i.test(error.message)) {
          toast.error(t("status.admin.invalidSecret"));
        } else if (/administrator already exists/i.test(error.message)) {
          toast.error(t("status.admin.alreadyExists"));
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error(t("status.admin.claimError"));
      }
    } finally {
      setBusy(false);
    }
  };

  if (!user || !status?.enabled) return null;

  return (
    <div className="mt-8 rounded-xl border border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card p-4">
      <div className="mb-3 flex items-start gap-2.5">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Crown className="size-3.5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold tracking-tight">
            {t("status.admin.claimTitle")}
          </h3>
          <p className="text-[11px] text-muted-foreground">
            {t("status.admin.claimDescription")}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <KeyRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="password"
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void claim();
              }
            }}
            placeholder={t("status.admin.secretPlaceholder")}
            aria-label={t("status.admin.secretLabel")}
            className="h-9 rounded-lg border-border/70 bg-background/80 pl-9 text-sm shadow-sm"
          />
        </div>
        <Button
          size="sm"
          onClick={() => void claim()}
          disabled={busy || !secret.trim()}
          className="h-9 shrink-0 gap-1.5 px-3"
        >
          <LoadingIcon icon={CrownData} loading={busy} size={14} />
          {busy ? t("status.admin.claiming") : t("status.admin.claim")}
        </Button>
      </div>
    </div>
  );
}
