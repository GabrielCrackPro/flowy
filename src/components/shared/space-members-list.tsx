"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon, UserAvatar } from "@/components/shared";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { toast } from "@/components/shared/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import type { SpaceSummary } from "@/lib/api/space";
import {
  CalendarDays,
  Copy,
  Crown,
  KeyRound,
  Loader2,
  UserMinus,
  Users,
  X,
} from "@/lib/icons";
import { cn } from "@/lib/utils";

interface SpaceMembersListProps {
  space: SpaceSummary;
  /** sheet = profile members sheet (bare content); inline = switcher sheet (own header + back). */
  variant: "sheet" | "inline";
  onRemoveMember: (memberUserId: string) => void;
  removePending?: boolean;
  /** Inline only: shows a close button so the expanded view can collapse. */
  onBack?: () => void;
  className?: string;
}

function formatDate(date: string | undefined, locale: string): string {
  if (!date) return "";
  try {
    return new Intl.DateTimeFormat(locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  } catch {
    return "";
  }
}

/**
 * Self-contained members list (owner + invite code + regular members) with the
 * removal confirm dialog. Used inside `SpaceMembersSheet` on the profile page
 * and inline in the space switcher sheet, so membership management never
 * duplicates.
 */
export function SpaceMembersList({
  space,
  variant,
  onRemoveMember,
  removePending = false,
  onBack,
  className,
}: SpaceMembersListProps) {
  const { profile } = useProfile();
  const { t, i18n } = useTranslation();
  const [removeTarget, setRemoveTarget] = useState<{
    userId: string;
    name: string;
  } | null>(null);

  const isOwner = space.ownerId === profile?.id;
  const members = space.members;
  const owner = members.find((m) => m.user.id === space.ownerId);
  const regularMembers = members.filter((m) => m.user.id !== space.ownerId);

  const handleCopyCode = () => {
    if (!space.joinCode) return;
    void navigator.clipboard.writeText(space.joinCode);
    toast.success(t("profile.spaces.codeCopied"));
  };

  const handleRemoveMember = () => {
    if (removeTarget) {
      onRemoveMember(removeTarget.userId);
      setRemoveTarget(null);
    }
  };

  return (
    <div className={cn(variant === "inline" && "space-y-2.5", className)}>
      {variant === "inline" && onBack ? (
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <Icon
              icon={Users}
              className="size-4 text-indigo-600 dark:text-indigo-400"
            />
            {t("profile.spaces.members")}
          </span>
          <button
            type="button"
            onClick={onBack}
            aria-label={t("common.close")}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <Icon icon={X} className="size-4" />
          </button>
        </div>
      ) : null}

      <div className="space-y-4">
        {isOwner && space.joinCode && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Icon icon={KeyRound} className="size-3.5 text-primary" />
              {t("profile.spaces.inviteCode")}
            </div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="min-w-0 truncate font-mono text-lg font-semibold tracking-widest text-primary">
                {space.joinCode}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyCode}
                title={t("profile.spaces.copyCode")}
                aria-label={t("profile.spaces.copyCode")}
                className="h-9 shrink-0 gap-1.5 rounded-lg border-primary/20 bg-background/80 text-primary hover:bg-primary/10"
              >
                <Icon icon={Copy} className="size-3.5" />
                {t("profile.spaces.copyCode")}
              </Button>
            </div>
          </div>
        )}

        {owner && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-muted/20 p-4">
            <div className="flex min-w-0 items-center gap-3">
              <UserAvatar
                key={owner.user.avatarUrl ?? "owner-avatar"}
                profile={owner.user}
                size="sm"
              />
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {owner.user.name ?? owner.user.email ?? t("profile.user")}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                  <Crown className="size-3 text-amber-500" />
                  {t("profile.spaces.owner")}
                  <Badge
                    variant="outline"
                    className="h-5 px-1.5 text-[10px] text-amber-600 dark:text-amber-400"
                  >
                    {t("profile.spaces.roleOwner")}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {regularMembers.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("profile.spaces.members")} ({regularMembers.length})
            </p>
            {regularMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-muted/20 p-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <UserAvatar
                    key={member.user.avatarUrl ?? member.user.id}
                    profile={member.user}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {member.user.name ??
                        member.user.email ??
                        t("profile.user")}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {member.user.email ?? t("profile.noEmail")}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="inline-flex items-center gap-1 text-xs text-muted-foreground/70">
                        <CalendarDays className="size-3" />
                        {t("profile.spaces.joinedOn", {
                          date: formatDate(member.joinedAt, i18n.language),
                        })}
                      </p>
                      <Badge
                        variant="outline"
                        className="h-5 px-1.5 text-[10px] text-muted-foreground"
                      >
                        {member.role === "owner"
                          ? t("profile.spaces.roleOwner")
                          : t("profile.spaces.roleMember")}
                      </Badge>
                    </div>
                  </div>
                </div>
                {isOwner && (
                  <Button
                    variant="ghost"
                    size="icon"
                    title={t("profile.spaces.removeMember")}
                    aria-label={`${t("profile.spaces.removeMember")} ${
                      member.user.name ?? member.user.email
                    }`}
                    className="size-9 self-stretch text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    onClick={() =>
                      setRemoveTarget({
                        userId: member.user.id,
                        name:
                          member.user.name ??
                          member.user.email ??
                          t("profile.user"),
                      })
                    }
                    disabled={removePending}
                  >
                    {removePending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <UserMinus className="size-4" />
                    )}
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border/50 bg-muted/10 px-6 py-8 text-center">
            <Users className="mx-auto size-8" />
            <p className="mt-2 text-sm font-medium">
              {t("profile.spaces.noMembers")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("profile.spaces.noMembersHint")}
            </p>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={removeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
        title={t("profile.spaces.removeMemberConfirmName", {
          name: removeTarget?.name ?? t("profile.user"),
        })}
        description={t("profile.spaces.removeMemberDescription")}
        confirmLabel={t("profile.spaces.removeMember")}
        cancelLabel={t("profile.spaces.cancel")}
        onConfirm={handleRemoveMember}
        variant="destructive"
      />
    </div>
  );
}
