"use client";

import { Crown as CrownData } from "lucide";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ConfirmDialog, LoadingIcon } from "@/components/shared";
import { toast } from "@/components/shared/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { authenticatedRequest } from "@/lib/api/client";
import { Crown, ShieldCheck, UserMinus } from "@/lib/icons";

interface AdminRecord {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
}

interface AdminListResponse {
  admins: AdminRecord[];
}

/**
 * Admin-only card in the status page admin panel: promotes a user (by auth
 * email) to admin, lists the current admins, and demotes them (except the
 * last one — the API refuses). All calls are requireAdmin() guarded.
 */
export function PromoteAdminCard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [loadingAdmins, setLoadingAdmins] = useState(true);
  const [demoteTarget, setDemoteTarget] = useState<AdminRecord | null>(null);
  const [demoting, setDemoting] = useState(false);

  const loadAdmins = useCallback(async () => {
    try {
      const { admins } =
        await authenticatedRequest<AdminListResponse>("/api/admin/demote");
      setAdmins(admins);
    } catch {
      // Non-admin or error — the panel itself is already admin-gated.
      setAdmins([]);
    } finally {
      setLoadingAdmins(false);
    }
  }, []);

  useEffect(() => {
    void loadAdmins();
  }, [loadAdmins]);

  const submitPromote = async () => {
    const value = email.trim();
    if (!value || busy) return;

    setBusy(true);
    try {
      const { message } = await authenticatedRequest<{ message: string }>(
        "/api/admin/promote",
        { method: "POST", body: JSON.stringify({ email: value }) },
      );
      toast.success(message ?? t("status.admin.success"));
      setEmail("");
      await loadAdmins();
    } catch (error) {
      if (error instanceof Error) {
        if (/already an admin/i.test(error.message)) {
          toast.error(t("status.admin.alreadyAdmin"));
        } else if (/not found/i.test(error.message)) {
          toast.error(t("status.admin.notFound"));
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error(t("status.admin.error"));
      }
    } finally {
      setBusy(false);
    }
  };

  const confirmDemote = async () => {
    if (!demoteTarget || demoting) return;
    setDemoting(true);
    try {
      const { message } = await authenticatedRequest<{ message: string }>(
        "/api/admin/demote",
        {
          method: "POST",
          body: JSON.stringify({ email: demoteTarget.email }),
        },
      );
      toast.success(message ?? t("status.admin.demoted"));
      setDemoteTarget(null);
      await loadAdmins();
    } catch (error) {
      if (error instanceof Error) {
        if (/last admin/i.test(error.message)) {
          toast.error(t("status.admin.lastAdmin"));
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error(t("status.admin.demoteError"));
      }
    } finally {
      setDemoting(false);
    }
  };

  return (
    <div className="mt-5 rounded-xl border border-border/50 bg-background/60 p-4">
      <div className="mb-3 flex items-start gap-2.5">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ShieldCheck className="size-3.5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold tracking-tight">
            {t("status.admin.promoteTitle")}
          </h3>
          <p className="text-[11px] text-muted-foreground">
            {t("status.admin.promoteDescription")}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void submitPromote();
            }
          }}
          placeholder={t("status.admin.emailPlaceholder")}
          aria-label={t("status.admin.emailLabel")}
          className="h-9 rounded-lg border-border/70 bg-background/80 text-sm shadow-sm"
        />
        <Button
          size="sm"
          onClick={() => void submitPromote()}
          disabled={busy || !email.trim()}
          className="h-9 shrink-0 gap-1.5 px-3"
        >
          <LoadingIcon icon={CrownData} loading={busy} size={14} />
          {busy ? t("status.admin.promoting") : t("status.admin.promote")}
        </Button>
      </div>

      {/* Current admins */}
      <div className="mt-4 space-y-1.5">
        {loadingAdmins ? (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <LoadingIcon icon={CrownData} loading size={12} />
            {t("common.loading")}
          </p>
        ) : (
          admins.map((admin) => {
            const isSelf = admin.id === user?.id;
            return (
              <div
                key={admin.id}
                className="flex items-center gap-2.5 rounded-lg border border-border/40 bg-background/50 px-3 py-2"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Crown className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {admin.name ?? admin.email ?? admin.id}
                    {isSelf && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        ({t("status.admin.you")})
                      </span>
                    )}
                  </p>
                  {admin.email && (
                    <p className="truncate text-xs text-muted-foreground">
                      {admin.email}
                    </p>
                  )}
                </div>
                {isSelf ? (
                  <Badge variant="outline" className="shrink-0 text-xs">
                    {t("status.admin.adminRole")}
                  </Badge>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 shrink-0 gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => setDemoteTarget(admin)}
                  >
                    <UserMinus className="size-3.5" />
                    {t("status.admin.demote")}
                  </Button>
                )}
              </div>
            );
          })
        )}
      </div>

      <ConfirmDialog
        open={demoteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDemoteTarget(null);
        }}
        title={t("status.admin.demoteConfirmTitle")}
        description={
          demoteTarget
            ? t("status.admin.demoteConfirmDesc", {
                name: demoteTarget.name ?? demoteTarget.email ?? "",
              })
            : ""
        }
        confirmLabel={t("status.admin.demote")}
        onConfirm={() => void confirmDemote()}
        closeOnConfirm={false}
        loading={demoting}
        loadingLabel={t("status.admin.demoting")}
        variant="destructive"
      />
    </div>
  );
}
