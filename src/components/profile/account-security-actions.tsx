"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ConfirmDialog, Icon } from "@/components/shared";
import { toast } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { signOutAndClear } from "@/hooks/useSignOut";
import { deleteAccount } from "@/lib/api/account";
import {
  Clock,
  KeyRound,
  Lock,
  LogOut,
  Monitor,
  Shield,
  ShieldAlert,
  Trash2,
} from "@/lib/icons";
import { ChangePasswordSheet } from "./change-password-sheet";
import { MfaSettings } from "./mfa-settings";

export function AccountSecurityActions() {
  const { t, i18n } = useTranslation();
  const { session } = useAuth();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [signOutAllOpen, setSignOutAllOpen] = useState(false);
  const [signingOutAll, setSigningOutAll] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const formatDate = (value: string | null | undefined) => {
    if (!value) return t("settings.security.noDate");
    try {
      return new Intl.DateTimeFormat(i18n.language, {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(value));
    } catch {
      return t("settings.security.noDate");
    }
  };

  const handleSignOutAll = async () => {
    if (signingOutAll) return;
    setSigningOutAll(true);
    const error = await signOutAndClear("global");
    if (error) {
      // Even if the server cannot revoke every session, always terminate this
      // browser so the user is not left in an authenticated UI.
      await signOutAndClear("local");
      toast.error(t("settings.security.signOutAllError"));
    }
    window.location.replace("/auth/login");
  };

  const handleDeleteAccount = async () => {
    if (deletingAccount) return;
    setDeletingAccount(true);

    try {
      await deleteAccount();

      // The account was removed server-side. A local-scoped sign-out clears
      // this browser even when Supabase can no longer revoke the deleted user.
      await signOutAndClear("local");
      localStorage.clear();
      sessionStorage.clear();
      window.location.replace("/auth/login");
    } catch {
      setDeletingAccount(false);
      toast.error(t("settings.security.deleteAccountError"));
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-primary/20 to-primary/10 text-primary">
              <Icon icon={Shield} className="size-4" />
            </span>
            <div className="min-w-0">
              <CardTitle>{t("settings.security.title")}</CardTitle>
              <CardDescription>
                {t("settings.security.description")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl bg-muted/25 p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                  <Monitor className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {t("settings.security.currentSession")}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Clock className="size-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {t("settings.security.lastSignIn")}
                      </span>
                      <span className="font-medium text-foreground">
                        {formatDate(session?.user.last_sign_in_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <KeyRound className="size-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {t("settings.security.lastPasswordChange")}
                      </span>
                      <span className="font-medium text-foreground">
                        {formatDate(
                          session?.user.user_metadata?.password_changed_at ??
                            session?.user.updated_at,
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSignOutAllOpen(true)}
                className="w-full shrink-0 gap-1.5 sm:w-auto"
              >
                <LogOut className="size-3.5" />
                {t("settings.security.signOutAllDevices")}
              </Button>
            </div>
          </div>

          <MfaSettings />

          <div className="flex flex-col gap-3 rounded-xl bg-muted/25 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Icon icon={Lock} className="size-4" />
              </span>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  {t("settings.security.changePassword")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("settings.security.changePasswordHint")}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setPasswordOpen(true)}
              className="w-full sm:w-auto"
            >
              <Icon icon={Lock} className="mr-2 size-4" />
              {t("settings.security.changePassword")}
            </Button>
          </div>

          <div className="flex flex-col gap-3 rounded-xl bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                <Icon icon={ShieldAlert} className="size-4" />
              </span>
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">
                  {t("settings.security.deleteAccount")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("settings.security.deleteAccountHint")}
                </p>
              </div>
            </div>
            <Button
              variant="destructive"
              onClick={() => setDeleteOpen(true)}
              className="w-full sm:w-auto"
            >
              <Icon icon={Trash2} className="mr-2 size-4" />
              {t("settings.security.deleteAccount")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <ChangePasswordSheet open={passwordOpen} onOpenChange={setPasswordOpen} />

      <ConfirmDialog
        open={signOutAllOpen}
        onOpenChange={setSignOutAllOpen}
        title={t("settings.security.signOutAllConfirmTitle")}
        description={t("settings.security.signOutAllConfirmDescription")}
        confirmLabel={
          signingOutAll
            ? t("settings.security.signingOutAll")
            : t("settings.security.signOutAllDevices")
        }
        cancelLabel={t("common.cancel")}
        onConfirm={() => void handleSignOutAll()}
        icon={<LogOut className="size-6 text-destructive" />}
        variant="destructive"
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("settings.security.deleteAccountConfirmTitle")}
        description={t("settings.security.deleteAccountConfirmDescription")}
        confirmLabel={
          deletingAccount
            ? t("settings.security.deletingAccount")
            : t("settings.security.deleteAccount")
        }
        cancelLabel={t("common.cancel")}
        onConfirm={() => void handleDeleteAccount()}
        icon={<Icon icon={ShieldAlert} className="size-6 text-destructive" />}
        variant="destructive"
      />
    </>
  );
}
