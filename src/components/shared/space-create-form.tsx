"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/shared/icon";
import { Button, Input, Switch } from "@/components/ui";
import { useSpaces } from "@/hooks/useSpaces";
import { Loader2, Plus, X } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface SpaceCreateFormProps {
  /** Card = profile page block; inline = compact row for sheets/popovers. */
  variant?: "card" | "inline";
  className?: string;
  onCreated?: () => void;
  /** Inline only: shows a close button so the expanded form can collapse. */
  onCancel?: () => void;
}

/**
 * Self-contained "create space" form: name + personal toggle + submit. Used
 * both on the profile page (card variant) and inside the space switcher sheet
 * (inline variant) so the create flow never duplicates.
 */
export function SpaceCreateForm({
  variant = "card",
  className,
  onCreated,
  onCancel,
}: SpaceCreateFormProps) {
  const { t } = useTranslation();
  const { create } = useSpaces();
  const [name, setName] = useState("");
  const [isPersonal, setIsPersonal] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const value = name.trim();
    if (!value || create.isPending) return;
    create.mutate(
      { name: value, isPersonal },
      {
        onSuccess: () => {
          setName("");
          setIsPersonal(false);
          onCreated?.();
        },
      },
    );
  };

  if (variant === "inline") {
    return (
      <form onSubmit={handleSubmit} className={cn("space-y-2.5", className)}>
        {onCancel ? (
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Icon icon={Plus} className="size-4 text-primary" />
              {t("profile.spaces.create")}
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
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t("profile.spaces.createPlaceholder")}
          maxLength={60}
          className="h-11"
        />
        <div className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-3 py-2.5">
          <span className="min-w-0">
            <span className="block text-xs font-medium text-foreground">
              {t("profile.spaces.createPersonal")}
            </span>
            <span className="block text-[11px] text-muted-foreground">
              {t("profile.spaces.createPersonalHint")}
            </span>
          </span>
          <Switch
            checked={isPersonal}
            onCheckedChange={setIsPersonal}
            disabled={create.isPending}
            aria-label={t("profile.spaces.createPersonal")}
            size="sm"
            className="shrink-0"
          />
        </div>
        <Button
          type="submit"
          disabled={!name.trim() || create.isPending}
          className="h-10 w-full gap-1.5"
        >
          {create.isPending ? (
            <Icon icon={Loader2} className="size-4 animate-spin" />
          ) : (
            <Icon icon={Plus} className="size-4" />
          )}
          {t("profile.spaces.create")}
        </Button>
      </form>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "relative overflow-hidden rounded-2xl bg-muted/25 p-4 transition-colors focus-within:bg-muted/35 sm:p-5",
        className,
      )}
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-primary/20 to-primary/10 text-primary">
          <Icon icon={Plus} className="size-4" />
        </span>
        <div>
          <p className="text-sm font-semibold">{t("profile.spaces.create")}</p>
          <p className="text-xs text-muted-foreground">
            {t("profile.spaces.createHint")}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={t("profile.spaces.createPlaceholder")}
          maxLength={60}
          className="h-11"
        />
        <Button
          type="submit"
          disabled={!name.trim() || create.isPending}
          className="h-11 shrink-0 gap-1.5"
        >
          {create.isPending ? (
            <Icon icon={Loader2} className="size-4 animate-spin" />
          ) : (
            <Icon icon={Plus} className="size-4" />
          )}
          {t("profile.spaces.create")}
        </Button>
      </div>

      <div className="mt-3 flex items-center gap-3 rounded-xl bg-muted/30 px-3 py-2.5">
        <Switch
          checked={isPersonal}
          onCheckedChange={setIsPersonal}
          disabled={create.isPending}
          size="sm"
        />
        <div className="flex flex-col">
          <span className="text-xs font-medium text-foreground">
            {t("profile.spaces.createPersonal")}
          </span>
          <p className="text-[11px] text-muted-foreground">
            {t("profile.spaces.createPersonalHint")}
          </p>
        </div>
      </div>
    </form>
  );
}
