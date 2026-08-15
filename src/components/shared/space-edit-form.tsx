"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/shared/icon";
import { Button, Input, Switch } from "@/components/ui";
import { useSpaces } from "@/hooks/useSpaces";
import type { SpaceSummary } from "@/lib/api/space";
import { Check, Loader2, Pencil, X } from "@/lib/icons";
import { cn } from "@/lib/utils";
import { SpaceAvatarUploader } from "./space-avatar-uploader";

interface SpaceEditFormProps {
  space: SpaceSummary;
  /** sheet = profile edit sheet (fields only; the parent footer submits via `formId`); inline = switcher sheet (own header + submit). */
  variant: "sheet" | "inline";
  className?: string;
  /** sheet only: id of the rendered <form>, so the parent footer's submit button can target it. */
  formId?: string;
  /** Inline only: shows a close button so the expanded form can collapse. */
  onCancel?: () => void;
  /** Fired after a successful rename. */
  onSaved?: () => void;
  autoFocus?: boolean;
}

/**
 * Self-contained "rename space" form (name + avatar + personal toggle). Owns
 * its form state and the rename mutation, so the profile page (inside
 * `SpaceEditSheet`) and the space switcher sheet (inline variant) share one
 * edit flow.
 */
export function SpaceEditForm({
  space,
  variant,
  className,
  formId,
  onCancel,
  onSaved,
  autoFocus = false,
}: SpaceEditFormProps) {
  const { t } = useTranslation();
  const { rename } = useSpaces();
  const [editName, setEditName] = useState("");
  const [editIsPersonal, setEditIsPersonal] = useState(false);
  const [editAvatar, setEditAvatar] = useState<string | null>(null);

  // Seed the form whenever a different space opens.
  useEffect(() => {
    setEditName(space.name);
    setEditIsPersonal(space.isPersonal);
    setEditAvatar(space.avatarUrl ?? null);
  }, [space]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const value = editName.trim();
    if (!value || rename.isPending) return;
    rename.mutate(
      {
        id: space.id,
        name: value,
        isPersonal: editIsPersonal,
        avatarUrl: editAvatar,
      },
      { onSuccess: onSaved },
    );
  };

  const fields = (
    <>
      <SpaceAvatarUploader
        name={editName}
        value={editAvatar}
        onChange={setEditAvatar}
        disabled={rename.isPending}
      />

      <div className="space-y-2">
        <label
          className="text-sm font-medium text-foreground"
          htmlFor="editSpaceName"
        >
          {t("profile.spaces.createPlaceholder")}
        </label>
        <Input
          id="editSpaceName"
          value={editName}
          onChange={(event) => setEditName(event.target.value)}
          placeholder={t("profile.spaces.createPlaceholder")}
          maxLength={60}
          required
          autoFocus={autoFocus}
          className="h-11 rounded-xl border-border/70 bg-background/80 px-3 shadow-sm"
        />
      </div>

      {space.members.length <= 1 && (
        <div className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2">
          <Switch
            checked={editIsPersonal}
            onCheckedChange={setEditIsPersonal}
            disabled={rename.isPending}
            size="sm"
          />
          <div className="flex flex-col">
            <span className="text-xs font-medium text-foreground">
              {t("profile.spaces.renamePersonal")}
            </span>
            <p className="text-[10px] text-muted-foreground">
              {t("profile.spaces.renamePersonalHint")}
            </p>
          </div>
        </div>
      )}
    </>
  );

  if (variant === "inline") {
    return (
      <form onSubmit={handleSubmit} className={cn("space-y-2.5", className)}>
        {onCancel ? (
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Icon
                icon={Pencil}
                className="size-4 text-indigo-600 dark:text-indigo-400"
              />
              {t("profile.spaces.rename")}
            </span>
            <button
              type="button"
              onClick={onCancel}
              aria-label={t("common.close")}
              className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <Icon icon={X} className="size-4" />
            </button>
          </div>
        ) : null}
        {fields}
        <Button
          type="submit"
          disabled={!editName.trim() || rename.isPending}
          className="h-11 w-full gap-1.5"
        >
          {rename.isPending ? (
            <Icon icon={Loader2} className="size-4 animate-spin" />
          ) : (
            <Icon icon={Check} className="size-4" />
          )}
          {t("profile.spaces.save")}
        </Button>
      </form>
    );
  }

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      className={cn("space-y-6", className)}
    >
      {fields}
    </form>
  );
}
