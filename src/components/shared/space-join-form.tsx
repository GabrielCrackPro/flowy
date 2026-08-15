"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/shared/icon";
import {
  JOIN_CODE_LENGTH,
  SegmentedCodeInput,
} from "@/components/shared/segmented-code-input";
import { Button } from "@/components/ui";
import { useSpaces } from "@/hooks/useSpaces";
import { KeyRound, Loader2, X } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface SpaceJoinFormProps {
  /** Card = profile page block; inline = compact row for sheets/popovers. */
  variant?: "card" | "inline";
  className?: string;
  onJoined?: () => void;
  /** Inline only: shows a close button so the expanded form can collapse. */
  onCancel?: () => void;
}

/**
 * Self-contained "join space with code" form. Used both on the profile page
 * (card variant) and inside the space switcher sheet (inline variant) so the
 * join flow never duplicates. The code itself is entered in a segmented
 * (OTP-style) input — one box per character, alphanumeric, uppercase.
 */
export function SpaceJoinForm({
  variant = "card",
  className,
  onJoined,
  onCancel,
}: SpaceJoinFormProps) {
  const { t } = useTranslation();
  const { join } = useSpaces();
  const [joinCode, setJoinCode] = useState("");

  const submit = (code: string) => {
    const value = code.trim();
    if (!value || join.isPending) return;
    join.mutate(value, {
      onSuccess: () => {
        setJoinCode("");
        onJoined?.();
      },
    });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    submit(joinCode);
  };

  const input = (
    <SegmentedCodeInput
      value={joinCode}
      onChange={setJoinCode}
      onComplete={submit}
      alphanumeric
      length={JOIN_CODE_LENGTH}
      label={t("profile.spaces.inviteCode")}
      invalid={join.isError}
      errorMessage={join.isError ? t("profile.spaces.joinError") : null}
      className="w-full"
    />
  );

  const submitButton = (
    <Button
      type="submit"
      variant="outline"
      disabled={!joinCode.trim() || join.isPending}
      className="h-11 w-full gap-1.5"
    >
      {join.isPending ? (
        <Icon icon={Loader2} className="size-4 animate-spin" />
      ) : (
        <Icon icon={KeyRound} className="size-4" />
      )}
      {t("profile.spaces.join")}
    </Button>
  );

  if (variant === "inline") {
    return (
      <form onSubmit={handleSubmit} className={cn("space-y-2.5", className)}>
        {onCancel ? (
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Icon
                icon={KeyRound}
                className="size-4 text-indigo-600 dark:text-indigo-400"
              />
              {t("profile.spaces.join")}
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
        {input}
        {submitButton}
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
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
          <Icon icon={KeyRound} className="size-4" />
        </span>
        <div>
          <p className="text-sm font-semibold">{t("profile.spaces.join")}</p>
          <p className="text-xs text-muted-foreground">
            {t("profile.spaces.joinHint")}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {input}
        {submitButton}
      </div>
    </form>
  );
}
