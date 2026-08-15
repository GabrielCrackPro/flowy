"use client";

import { Skeleton } from "@components/shared";
import { useProfile } from "@hooks/useProfile";
import { useSpaces } from "@hooks/useSpaces";
import type { SpaceSummary } from "@lib/api/space";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SpaceCreateForm } from "../shared/space-create-form";
import { SpaceEditSheet } from "../shared/space-edit-sheet";
import { SpaceJoinForm } from "../shared/space-join-form";
import { SpaceLeaveDialog } from "../shared/space-leave-dialog";
import { SpaceMembersSheet } from "../shared/space-members-sheet";
import { toast } from "../shared/toast";
import { SpaceCard } from "./space-card";

export function SpaceManager() {
  const { spaces, activeSpaceId, isLoading, setActive, removeMember } =
    useSpaces();
  const { profile } = useProfile();
  const { t } = useTranslation();

  const [leaveTarget, setLeaveTarget] = useState<SpaceSummary | null>(null);
  const [editingSpace, setEditingSpace] = useState<SpaceSummary | null>(null);
  const [membersSpace, setMembersSpace] = useState<SpaceSummary | null>(null);

  const handleCopyCode = (code: string) => {
    void navigator.clipboard.writeText(code);
    toast.success(t("profile.spaces.codeCopied"));
  };

  const handleRemoveMember = (memberUserId: string) => {
    if (!membersSpace) return;
    removeMember.mutate(
      { spaceId: membersSpace.id, memberUserId },
      { onSuccess: () => setMembersSpace(null) },
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <SpaceCreateForm />
        <SpaceJoinForm />
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">
            {t("profile.spaces.mySpaces")}
          </h3>
          <span className="text-xs text-muted-foreground">
            {spaces.length} {t("profile.spaces.total")}
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="flex min-w-0 items-center gap-4 rounded-2xl bg-muted/25 p-4"
              >
                <div className="size-11">
                  <Skeleton variant="rounded" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40">
                    <Skeleton />
                  </div>
                  <div className="h-3 w-24">
                    <Skeleton />
                  </div>
                </div>
                <div className="h-8 w-20">
                  <Skeleton variant="rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : spaces.length === 0 ? (
          <div className="rounded-2xl bg-muted/20 px-6 py-10 text-center">
            <p className="text-sm font-medium">
              {t("profile.spaces.noSpaces")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("profile.spaces.noSpacesHint")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {spaces.map((space) => (
              <SpaceCard
                key={space.id}
                space={space}
                isActive={space.id === activeSpaceId}
                isOwner={space.ownerId === profile?.id}
                activatePending={setActive.isPending}
                onActivate={() => setActive.mutate(space.id)}
                onEdit={() => setEditingSpace(space)}
                onLeave={() => setLeaveTarget(space)}
                onCopyCode={handleCopyCode}
                onManageMembers={() => setMembersSpace(space)}
              />
            ))}
          </div>
        )}
      </div>

      <SpaceLeaveDialog
        space={leaveTarget}
        open={leaveTarget !== null}
        onOpenChange={(open) => {
          if (!open) setLeaveTarget(null);
        }}
      />

      <SpaceEditSheet
        space={editingSpace}
        open={editingSpace !== null}
        onOpenChange={(open) => {
          if (!open) setEditingSpace(null);
        }}
      />

      <SpaceMembersSheet
        space={membersSpace}
        open={membersSpace !== null}
        onOpenChange={(open) => {
          if (!open) setMembersSpace(null);
        }}
        onRemoveMember={handleRemoveMember}
        removePending={removeMember.isPending}
      />
    </div>
  );
}
