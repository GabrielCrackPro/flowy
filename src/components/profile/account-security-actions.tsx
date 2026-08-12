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
import { deleteAccount } from "@/lib/api/account";
import { Lock, Shield, ShieldAlert, Trash2 } from "@/lib/icons";
import { signOut } from "@/lib/supabase";
import { ChangePasswordSheet } from "./change-password-sheet";

export function AccountSecurityActions() {
  const { t } = useTranslation();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();

      try {
        await signOut();
      } catch {
        // La sesión puede no existir ya tras eliminar la cuenta en el servidor.
      }

      localStorage.clear();
      sessionStorage.clear();

      window.location.assign("/auth/login");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("settings.security.deleteAccountError"),
      );
    }
  };

  return (
    <>
      <Card className="border-border/60">
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
          <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
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
            <Button variant="outline" onClick={() => setPasswordOpen(true)}>
              <Icon icon={Lock} className="mr-2 size-4" />
              {t("settings.security.changePassword")}
            </Button>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
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
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Icon icon={Trash2} className="mr-2 size-4" />
              {t("settings.security.deleteAccount")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <ChangePasswordSheet open={passwordOpen} onOpenChange={setPasswordOpen} />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("settings.security.deleteAccountConfirmTitle")}
        description={t("settings.security.deleteAccountConfirmDescription")}
        confirmLabel={t("settings.security.deleteAccount")}
        cancelLabel={t("common.cancel")}
        onConfirm={handleDeleteAccount}
        icon={<Icon icon={ShieldAlert} className="size-6 text-destructive" />}
        variant="destructive"
      />
    </>
  );
}
