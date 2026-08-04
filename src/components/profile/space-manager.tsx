"use client";

import { ConfirmDialog, Icon, Skeleton } from "@components/shared";
import { Button, Input, Switch } from "@components/ui";
import { useProfile } from "@hooks/useProfile";
import { useSpaces } from "@hooks/useSpaces";
import type { SpaceSummary } from "@lib/api/space";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { SheetLayout } from "@/components/ui/sheet-layout";
import { Check, KeyRound, Loader2, Pencil, Plus, X } from "@/lib/icons";
import { toast } from "../shared/toast";
import { SpaceCard } from "./space-card";
import { SpaceMembersSheet } from "./space-members-sheet";

export function SpaceManager() {
  const {
    spaces,
    activeSpaceId,
    isLoading,
    create,
    join,
    setActive,
    leave,
    remove,
    rename,
    removeMember,
  } = useSpaces();
  const { profile } = useProfile();
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isPersonal, setIsPersonal] = useState(false);
  const [leaveTarget, setLeaveTarget] = useState<SpaceSummary | null>(null);
  const [editingSpace, setEditingSpace] = useState<SpaceSummary | null>(null);
  const [editName, setEditName] = useState("");
  const [editIsPersonal, setEditIsPersonal] = useState(false);
  const [membersSpace, setMembersSpace] = useState<SpaceSummary | null>(null);

  const isOnlyMember = (space: SpaceSummary) =>
    space.ownerId === profile?.id && space.members.length <= 1;

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault();
    const value = name.trim();
    if (!value || create.isPending) return;
    create.mutate(
      { name: value, isPersonal },
      {
        onSuccess: () => {
          setName("");
          setIsPersonal(false);
        },
      },
    );
  };

  const handleJoin = (event: React.FormEvent) => {
    event.preventDefault();
    const value = joinCode.trim();
    if (!value || join.isPending) return;
    join.mutate(value, { onSuccess: () => setJoinCode("") });
  };

  const handleCopyCode = (code: string) => {
    void navigator.clipboard.writeText(code);
    toast.success(t("profile.spaces.codeCopied"));
  };

  const handleOpenEdit = (space: SpaceSummary) => {
    setEditingSpace(space);
    setEditName(space.name);
    setEditIsPersonal(space.isPersonal);
  };

  const handleEditSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const value = editName.trim();
    if (!value || !editingSpace || rename.isPending) return;
    rename.mutate(
      { id: editingSpace.id, name: value, isPersonal: editIsPersonal },
      { onSuccess: () => setEditingSpace(null) },
    );
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
        <form
          onSubmit={handleCreate}
          className="rounded-2xl border border-border/40 bg-muted/20 p-4 transition-colors focus-within:border-primary/40"
        >
          <div className="mb-3 flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon icon={Plus} className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold">
                {t("profile.spaces.create")}
              </p>
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
              className="h-10"
            />
            <Button
              type="submit"
              disabled={!name.trim() || create.isPending}
              className="shrink-0"
            >
              {create.isPending ? (
                <Icon icon={Loader2} className="size-4 animate-spin" />
              ) : (
                <Icon icon={Plus} className="size-4" />
              )}
              {t("profile.spaces.create")}
            </Button>
          </div>

          <div className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2 mt-3">
            <Switch
              checked={isPersonal}
              onCheckedChange={setIsPersonal}
              size="sm"
            />
            <div className="flex flex-col">
              <span className="text-xs font-medium text-foreground">
                {t("profile.spaces.createPersonal")}
              </span>
              <p className="text-[10px] text-muted-foreground">
                {t("profile.spaces.createPersonalHint")}
              </p>
            </div>
          </div>
        </form>

        <form
          onSubmit={handleJoin}
          className="rounded-2xl border border-border/40 bg-muted/20 p-4 transition-colors focus-within:border-primary/40"
        >
          <div className="mb-3 flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon icon={KeyRound} className="size-4" />
            </span>
            <div>
              <p className="text-sm font-semibold">
                {t("profile.spaces.join")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("profile.spaces.joinHint")}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={joinCode}
              onChange={(event) =>
                setJoinCode(event.target.value.toUpperCase())
              }
              placeholder={t("profile.spaces.joinPlaceholder")}
              maxLength={8}
              className="h-10 font-mono tracking-widest uppercase"
            />
            <Button
              type="submit"
              variant="outline"
              disabled={!joinCode.trim() || join.isPending}
              className="shrink-0"
            >
              {join.isPending ? (
                <Icon icon={Loader2} className="size-4 animate-spin" />
              ) : (
                <Icon icon={KeyRound} className="size-4" />
              )}
              {t("profile.spaces.join")}
            </Button>
          </div>
        </form>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
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
                className="flex items-center gap-4 rounded-2xl border border-border/40 bg-muted/20 p-4"
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
          <div className="rounded-2xl border border-dashed border-border/50 bg-muted/10 px-6 py-10 text-center">
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
                renamePending={rename.isPending}
                leavePending={leave.isPending}
                removePending={remove.isPending}
                onActivate={() => setActive.mutate(space.id)}
                onEdit={() => handleOpenEdit(space)}
                onLeave={() => setLeaveTarget(space)}
                onCopyCode={handleCopyCode}
                onManageMembers={() => setMembersSpace(space)}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={leaveTarget !== null}
        onOpenChange={(open) => {
          if (!open) setLeaveTarget(null);
        }}
        title={
          leaveTarget && isOnlyMember(leaveTarget)
            ? `${t("profile.spaces.leaveConfirmOwner")} "${leaveTarget.name}"`
            : `${t("profile.spaces.leaveConfirm")} "${leaveTarget?.name ?? ""}"`
        }
        description={
          leaveTarget && isOnlyMember(leaveTarget)
            ? t("profile.spaces.leaveConfirmOwnerDescription")
            : t("profile.spaces.leaveConfirmDescription")
        }
        confirmLabel={
          leaveTarget && isOnlyMember(leaveTarget)
            ? t("profile.spaces.deleteSpace")
            : t("profile.spaces.leaveSpace")
        }
        cancelLabel={t("profile.spaces.cancel")}
        onConfirm={() => {
          if (leaveTarget) {
            if (isOnlyMember(leaveTarget)) {
              remove.mutate(leaveTarget.id);
            } else {
              leave.mutate(leaveTarget.id);
            }
          }
          setLeaveTarget(null);
        }}
      />

      <SheetLayout
        open={editingSpace !== null}
        onOpenChange={(open) => {
          if (!open) setEditingSpace(null);
        }}
        title={t("profile.spaces.rename")}
        description={t("profile.spaces.renameHint")}
        icon={Pencil}
        iconGradient="from-indigo-500/20 to-indigo-500/10"
        iconColor="text-indigo-600 dark:text-indigo-400"
        maxWidth="sm:max-w-[500px]"
        footerRight={
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEditingSpace(null)}
              disabled={rename.isPending}
              className="h-10"
            >
              <X className="size-4 mr-2" />
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              onClick={handleEditSubmit}
              disabled={!editName.trim() || rename.isPending}
              className="h-10 gap-1.5 shadow-sm"
            >
              {rename.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t("common.saving")}
                </>
              ) : (
                <>
                  {t("profile.spaces.save")}
                  <Check className="size-4" />
                </>
              )}
            </Button>
          </>
        }
      >
        <form onSubmit={handleEditSubmit} className="space-y-6">
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
              autoFocus
              className="h-11 rounded-xl border-border/70 bg-background/80 px-3 shadow-sm"
            />
          </div>

          {editingSpace && editingSpace.members.length <= 1 && (
            <div className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2">
              <Switch
                checked={editIsPersonal}
                onCheckedChange={setEditIsPersonal}
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
        </form>
      </SheetLayout>

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
