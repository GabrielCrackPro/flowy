"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/shared";
import { BottomSheet } from "@/components/shared/bottom-sheet";
import { toast } from "@/components/shared/toast";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form/FormField";
import { Input } from "@/components/ui/input";
import { useReactForm } from "@/hooks/useReactForm";
import { changePassword } from "@/lib/api/account";
import { Eye, EyeOff, KeyRound, Loader2, Lock, X } from "@/lib/icons";
import { createChangePasswordSchema } from "@/lib/schemas/auth";
import supabase from "@/lib/supabase/client";

const WRONG_CURRENT_PASSWORD = "La contraseña actual es incorrecta";

interface ChangePasswordSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordSheet({
  open,
  onOpenChange,
}: ChangePasswordSheetProps) {
  const { t } = useTranslation();
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const form = useReactForm({
    initialValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    schema: createChangePasswordSchema(t),
    onSubmit: async (values) => {
      try {
        await changePassword(values.currentPassword, values.newPassword);
        await supabase.auth.refreshSession();
        toast.success(t("settings.security.changePasswordSuccess"));
        onOpenChange(false);
        form.reset();
      } catch (error) {
        // The password route answers with hardcoded Spanish strings; map the
        // known one to a localized message, fall back to a generic error.
        form.setError(
          error instanceof Error && error.message === WRONG_CURRENT_PASSWORD
            ? t("settings.security.wrongCurrentPassword")
            : t("settings.security.changePasswordError"),
        );
      }
    },
  });

  const handleClose = () => {
    onOpenChange(false);
    form.reset();
  };

  const visibilityToggle = (show: boolean, setShow: (v: boolean) => void) => (
    <button
      type="button"
      aria-label={show ? t("common.hidePassword") : t("common.showPassword")}
      aria-pressed={show}
      onClick={() => setShow(!show)}
      className="flex items-center text-muted-foreground transition-colors hover:text-foreground"
    >
      <Icon icon={show ? EyeOff : Eye} className="size-4" />
    </button>
  );

  return (
    <BottomSheet
      open={open}
      onOpenChange={(open) => {
        if (!open) form.reset();
        onOpenChange(open);
      }}
      title={t("settings.security.changePassword")}
      description={t("settings.security.changePasswordHint")}
      icon={<Icon icon={KeyRound} className="size-5" />}
      iconGradient="from-indigo-500/20 to-indigo-500/10"
      iconColor="text-indigo-600 dark:text-indigo-400"
      className="sm:max-w-[500px]"
      contentClassName="px-4 py-5 sm:px-6 sm:py-6"
      footerSecondary={
        <Button
          type="button"
          variant="outline"
          onClick={handleClose}
          disabled={form.busy}
          className="h-11 w-full sm:h-10 sm:w-auto sm:px-4"
        >
          <X className="size-4" />
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
              {t("settings.security.changePassword")}
              <KeyRound className="size-4" />
            </>
          )}
        </Button>
      }
    >
      <form onSubmit={(e) => form.handleSubmit(e)} className="space-y-6">
        <div className="space-y-4 rounded-2xl bg-muted/25 p-4">
          <FormField
            label={t("settings.security.currentPasswordLabel")}
            error={form.errors.currentPassword}
          >
            <Input
              id="currentPassword"
              type={showCurrent ? "text" : "password"}
              autoComplete={showCurrent ? "off" : "current-password"}
              value={form.values.currentPassword}
              onChange={form.handleChange("currentPassword")}
              disabled={form.busy}
              startIcon={<Icon icon={Lock} className="size-4" />}
              endIcon={visibilityToggle(showCurrent, setShowCurrent)}
              className="h-11 rounded-xl border-border/70 bg-background/80 shadow-sm"
            />
          </FormField>

          <FormField
            label={t("settings.security.newPasswordLabel")}
            error={form.errors.newPassword}
          >
            <Input
              id="newPassword"
              type={showNew ? "text" : "password"}
              autoComplete={showNew ? "off" : "new-password"}
              value={form.values.newPassword}
              onChange={form.handleChange("newPassword")}
              disabled={form.busy}
              startIcon={<Icon icon={Lock} className="size-4" />}
              endIcon={visibilityToggle(showNew, setShowNew)}
              className="h-11 rounded-xl border-border/70 bg-background/80 shadow-sm"
            />
          </FormField>

          <FormField
            label={t("settings.security.confirmPasswordLabel")}
            error={form.errors.confirmPassword}
          >
            <Input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              autoComplete={showConfirm ? "off" : "new-password"}
              value={form.values.confirmPassword}
              onChange={form.handleChange("confirmPassword")}
              disabled={form.busy}
              startIcon={<Icon icon={Lock} className="size-4" />}
              endIcon={visibilityToggle(showConfirm, setShowConfirm)}
              className="h-11 rounded-xl border-border/70 bg-background/80 shadow-sm"
            />
          </FormField>
        </div>

        {form.error ? (
          <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
            {form.error}
          </div>
        ) : null}
      </form>
    </BottomSheet>
  );
}
