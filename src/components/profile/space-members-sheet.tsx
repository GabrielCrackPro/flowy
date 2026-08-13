"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { UserAvatar } from "@/components/shared";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SheetClose } from "@/components/ui/sheet";
import { SheetLayout } from "@/components/ui/sheet-layout";
import { useProfile } from "@/hooks/useProfile";
import type { SpaceSummary } from "@/lib/api/space";
import { CalendarDays, Crown, Loader2, UserMinus, Users, X } from "@/lib/icons";

interface SpaceMembersSheetProps {
  space: SpaceSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRemoveMember: (memberUserId: string) => void;
  removePending?: boolean;
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

export function SpaceMembersSheet({
  space,
  open,
  onOpenChange,
  onRemoveMember,
  removePending = false,
}: SpaceMembersSheetProps) {
  const { profile } = useProfile();
  const { t, i18n } = useTranslation();
  const [removeTarget, setRemoveTarget] = useState<{
    userId: string;
    name: string;
  } | null>(null);

  if (!space) return null;

  const isOwner = space.ownerId === profile?.id;
  const members = space.members;
  const owner = members.find((m) => m.user.id === space.ownerId);
  const regularMembers = members.filter((m) => m.user.id !== space.ownerId);

  const handleRemoveMember = () => {
    if (removeTarget) {
      onRemoveMember(removeTarget.userId);
      setRemoveTarget(null);
    }
  };

  return (
    <>
      <SheetLayout
        open={open}
        onOpenChange={onOpenChange}
        title={`${t("profile.spaces.members")} ${space.name}`}
        icon={Users}
        iconGradient="from-indigo-500/20 to-indigo-500/10"
        iconColor="text-indigo-600 dark:text-indigo-400"
        footerRight={
          <SheetClose>
            <Button variant="outline" className="h-10">
              <X className="size-4" />
              {t("profile.spaces.close")}
            </Button>
          </SheetClose>
        }
      >
        <div className="space-y-4">
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
                      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
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
      </SheetLayout>

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
    </>
  );
}
