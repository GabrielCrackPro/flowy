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
import { Input } from "@/components/ui/input";
import { SheetLayout } from "@/components/ui/sheet-layout";
import { useReactForm } from "@/hooks/useReactForm";
import { changePassword, deleteAccount } from "@/lib/api/account";
import { KeyRound, Loader2, Lock, ShieldAlert, Trash2 } from "@/lib/icons";
import { signOut } from "@/lib/supabase";

export function AccountSecurityActions() {
  const { t } = useTranslation();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const form = useReactForm({
    initialValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    onSubmit: async (values) => {
      if (values.newPassword.length < 8) {
        form.setError(t("settings.security.passwordMinLength"));
        return;
      }

      if (values.newPassword !== values.confirmPassword) {
        form.setError(t("settings.security.passwordsMismatch"));
        return;
      }

      try {
        await changePassword(values.currentPassword, values.newPassword);
        toast.success(t("settings.security.changePasswordSuccess"));
        setPasswordOpen(false);
        form.reset();
      } catch (error) {
        form.setError(
          error instanceof Error
            ? error.message
            : t("settings.security.changePasswordError"),
        );
      }
    },
  });

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
          <CardTitle>{t("settings.security.title")}</CardTitle>
          <CardDescription>
            {t("settings.security.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {t("settings.security.changePassword")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("settings.security.changePasswordHint")}
              </p>
            </div>
            <Button variant="outline" onClick={() => setPasswordOpen(true)}>
              <Icon icon={Lock} className="mr-2 size-4" />
              {t("settings.security.changePassword")}
            </Button>
          </div>

          <div className="flex flex-col gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-destructive">
                {t("settings.security.deleteAccount")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("settings.security.deleteAccountHint")}
              </p>
            </div>
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Icon icon={Trash2} className="mr-2 size-4" />
              {t("settings.security.deleteAccount")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <SheetLayout
        open={passwordOpen}
        onOpenChange={(open) => {
          setPasswordOpen(open);
          if (!open) {
            form.reset();
          }
        }}
        title={t("settings.security.changePassword")}
        description={t("settings.security.changePasswordHint")}
        icon={KeyRound}
        iconGradient="from-indigo-500/20 to-indigo-500/10"
        iconColor="text-indigo-600 dark:text-indigo-400"
        maxWidth="sm:max-w-[500px]"
        footerRight={
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setPasswordOpen(false);
                form.reset();
              }}
              disabled={form.busy}
              className="h-10"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              onClick={() => form.handleSubmit()}
              disabled={form.busy}
              className="h-10 gap-1.5 shadow-sm"
            >
              {form.busy ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t("common.saving")}
                </>
              ) : (
                <>
                  {t("settings.security.changePassword")}
                  <KeyRound className="size-4" />
                </>
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <form onSubmit={(e) => form.handleSubmit(e)} className="space-y-4">
            <div className="space-y-4 rounded-2xl border border-border/60 bg-gradient-to-br from-background to-muted/20 p-4 shadow-sm">
              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-foreground"
                  htmlFor="currentPassword"
                >
                  {t("settings.security.currentPasswordLabel")}
                </label>
                <Input
                  id="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  value={form.values.currentPassword}
                  onChange={form.handleChange("currentPassword")}
                  disabled={form.busy}
                  className="h-11 rounded-xl border-border/70 bg-background/80 px-3 shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-foreground"
                  htmlFor="newPassword"
                >
                  {t("settings.security.newPasswordLabel")}
                </label>
                <Input
                  id="newPassword"
                  type="password"
                  autoComplete="new-password"
                  value={form.values.newPassword}
                  onChange={form.handleChange("newPassword")}
                  disabled={form.busy}
                  className="h-11 rounded-xl border-border/70 bg-background/80 px-3 shadow-sm"
                />
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-foreground"
                  htmlFor="confirmPassword"
                >
                  {t("settings.security.confirmPasswordLabel")}
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={form.values.confirmPassword}
                  onChange={form.handleChange("confirmPassword")}
                  disabled={form.busy}
                  className="h-11 rounded-xl border-border/70 bg-background/80 px-3 shadow-sm"
                />
              </div>
            </div>

            {form.error ? (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                {form.error}
              </div>
            ) : null}
          </form>
        </div>
      </SheetLayout>

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
