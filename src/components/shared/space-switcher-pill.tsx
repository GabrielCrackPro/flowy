"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BottomSheet } from "@/components/shared/bottom-sheet";
import { Icon } from "@/components/shared/icon";
import { SpaceCreateForm } from "@/components/shared/space-create-form";
import { SpaceEditForm } from "@/components/shared/space-edit-form";
import { SpaceGlyph } from "@/components/shared/space-glyph";
import { SpaceJoinForm } from "@/components/shared/space-join-form";
import { SpaceLeaveConfirm } from "@/components/shared/space-leave-confirm";
import { SpaceMembersList } from "@/components/shared/space-members-list";
import { toast } from "@/components/shared/toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useProfile } from "@/hooks/useProfile";
import { useSpaces } from "@/hooks/useSpaces";
import type { SpaceSummary } from "@/lib/api/space";
import {
  Check,
  ChevronsUpDown,
  Copy,
  KeyRound,
  Layers,
  Loader2,
  LogOut,
  MoreHorizontal,
  Pencil,
  Plus,
  Settings2,
  UserMinus,
  X,
} from "@/lib/icons";
import { cn } from "@/lib/utils";

interface SpaceSwitcherPillProps {
  className?: string;
  compactMobile?: boolean;
}

/**
 * Space switcher used in the dashboard header. Desktop keeps a compact menu;
 * mobile uses the shared bottom-sheet pattern with larger touch targets. The
 * mobile sheet also hosts the full management flows — create, rename and
 * leave/delete — so spaces can be managed without leaving the current page.
 */
export function SpaceSwitcherPill({
  className,
  compactMobile = false,
}: SpaceSwitcherPillProps) {
  const { t } = useTranslation();
  const { spaces, activeSpace, activeSpaceId, setActive, removeMember } =
    useSpaces();
  const { profile } = useProfile();
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [editingSpace, setEditingSpace] = useState<SpaceSummary | null>(null);
  const [leaveTarget, setLeaveTarget] = useState<SpaceSummary | null>(null);
  const [membersSpace, setMembersSpace] = useState<SpaceSummary | null>(null);
  const [actionSpaceId, setActionSpaceId] = useState<string | null>(null);
  const isPending = setActive.isPending;
  // Resolve the members view against the live spaces list so removals/renames
  // refresh in place while the view stays open.
  const membersView = membersSpace
    ? (spaces.find((space) => space.id === membersSpace.id) ?? membersSpace)
    : null;
  const displayName = activeSpace?.name ?? t("profile.spaces.noSpace");

  const triggerClassName = cn(
    "group inline-flex max-w-44 items-center gap-1.5 rounded-full border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5 py-1 pl-1.5 pr-2.5 text-xs font-medium text-primary shadow-[0_1px_2px_rgba(0,0,0,0.03)] outline-none transition hover:border-primary/40 hover:shadow-[0_2px_6px_rgba(0,0,0,0.05)] data-open:border-primary/40 aria-expanded:border-primary/40 aria-expanded:bg-primary/10",
    "max-sm:gap-1 max-sm:py-0.5 max-sm:pl-1 max-sm:pr-1.5",
    compactMobile &&
      "max-md:h-9 max-md:max-w-[8.5rem] max-md:rounded-xl max-md:border-primary/20 max-md:bg-primary/5 max-md:px-1.5 max-md:py-1",
    className,
  );

  const triggerContent = (
    <>
      <SpaceGlyph
        name={activeSpace?.name ?? ""}
        active={!!activeSpace}
        shared={activeSpace ? !activeSpace.isPersonal : false}
        avatarUrl={activeSpace?.avatarUrl}
        className={cn(
          "size-5 text-[0.6rem]",
          compactMobile && "max-md:size-6 max-md:rounded-xl",
        )}
      />
      <span className="min-w-0 truncate">{displayName}</span>
      <Icon
        icon={ChevronsUpDown}
        className="size-3 shrink-0 opacity-60 transition group-hover:opacity-100"
      />
    </>
  );

  const handleSelect = (spaceId: string) => {
    if (spaceId === activeSpace?.id || isPending) return;
    setActive.mutate(spaceId);
    setSheetOpen(false);
  };

  const handleCopyCode = (code: string) => {
    void navigator.clipboard.writeText(code);
    toast.success(t("profile.spaces.codeCopied"));
  };

  const spaceRow = (space: SpaceSummary) => {
    const isActive = space.id === activeSpaceId;
    const isOwner = space.ownerId === profile?.id;
    const canLeave = !space.isPersonal || !isOwner;

    const isExpanded = actionSpaceId === space.id;
    const deleteLabel =
      space.members.length <= 1 && isOwner
        ? t("profile.spaces.deleteSpace")
        : t("profile.spaces.leave");

    const actionItem = (
      icon: LucideIcon,
      label: string,
      onClick: () => void,
      destructive = false,
    ) => (
      <button
        type="button"
        onClick={() => {
          setActionSpaceId(null);
          onClick();
        }}
        className={cn(
          "flex min-h-11 items-center gap-2.5 rounded-xl px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          destructive
            ? "text-destructive hover:bg-destructive/10"
            : "text-foreground hover:bg-muted/60 active:bg-muted",
        )}
      >
        <Icon
          icon={icon}
          className={cn(
            "size-4",
            destructive ? "text-destructive" : "text-muted-foreground",
          )}
        />
        {label}
      </button>
    );

    return (
      <div key={space.id} className="rounded-2xl">
        <div className="flex items-center gap-1 rounded-2xl transition-colors focus-within:bg-muted/40">
          <button
            type="button"
            disabled={isPending}
            aria-current={isActive ? "true" : undefined}
            onClick={() => handleSelect(space.id)}
            className={cn(
              "flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-2xl px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-foreground hover:bg-muted/60 active:bg-muted",
              isPending && !isActive && "opacity-60",
            )}
          >
            <SpaceGlyph
              name={space.name}
              active={isActive}
              shared={!space.isPersonal}
              avatarUrl={space.avatarUrl}
              className="size-9 text-sm"
            />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">
                {space.name}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {t("profile.spaces.member", { count: space.members.length })}
                {space.isPersonal
                  ? ` · ${t("profile.spaces.personal")}`
                  : ` · ${t("profile.spaces.shared")}`}
              </span>
            </span>
            {isActive ? (
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Icon icon={Check} className="size-4" />
              </span>
            ) : isPending ? (
              <Icon
                icon={Loader2}
                className="size-4 shrink-0 animate-spin text-muted-foreground"
              />
            ) : null}
          </button>

          <button
            type="button"
            aria-expanded={isExpanded}
            aria-label={`${t("profile.spaces.manageSpaces")} ${space.name}`}
            onClick={() => setActionSpaceId(isExpanded ? null : space.id)}
            className="flex w-9 shrink-0 items-center justify-center self-stretch rounded-xl text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={isExpanded ? "close" : "more"}
                initial={{ opacity: 0, rotate: -45, scale: 0.6 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 45, scale: 0.6 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="flex"
              >
                <Icon
                  icon={isExpanded ? X : MoreHorizontal}
                  className="size-4"
                />
              </motion.span>
            </AnimatePresence>
          </button>
        </div>

        <AnimatePresence initial={false}>
          {isExpanded ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="my-1 ml-12 mr-1 flex flex-col gap-0.5 rounded-xl bg-muted/40 p-1">
                {isOwner && !space.isPersonal ? (
                  <>
                    {space.joinCode
                      ? actionItem(Copy, t("profile.spaces.copyCode"), () =>
                          handleCopyCode(space.joinCode ?? ""),
                        )
                      : null}
                    {actionItem(
                      UserMinus,
                      t("profile.spaces.manageMembers"),
                      () => setMembersSpace(space),
                    )}
                  </>
                ) : null}
                {isOwner
                  ? actionItem(Pencil, t("profile.spaces.rename"), () =>
                      setEditingSpace(space),
                    )
                  : null}
                {canLeave
                  ? actionItem(
                      LogOut,
                      deleteLabel,
                      () => setLeaveTarget(space),
                      true,
                    )
                  : null}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    );
  };

  if (compactMobile && isMobile) {
    return (
      <>
        <button
          type="button"
          aria-label={displayName}
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
          title={displayName}
          onClick={() => {
            setEditingSpace(null);
            setMembersSpace(null);
            setLeaveTarget(null);
            setActionSpaceId(null);
            setShowCreate(false);
            setShowJoin(false);
            setSheetOpen(true);
          }}
          className={triggerClassName}
        >
          {triggerContent}
        </button>

        <BottomSheet
          open={sheetOpen}
          onOpenChange={(open) => {
            setSheetOpen(open);
            if (!open) {
              setEditingSpace(null);
              setMembersSpace(null);
              setLeaveTarget(null);
              setActionSpaceId(null);
              setShowCreate(false);
              setShowJoin(false);
            }
          }}
          title={t("profile.spaces.switchSpace")}
          description={t("profile.spaces.selectSpace")}
          icon={<Icon icon={Layers} className="size-5" />}
          metadata={
            <span className="truncate font-medium text-primary">
              {displayName}
            </span>
          }
          className="max-h-[min(88dvh,720px)]"
          contentClassName="p-3"
        >
          <AnimatePresence initial={false}>
            {!(
              showCreate ||
              showJoin ||
              editingSpace ||
              membersView ||
              leaveTarget
            ) ? (
              <motion.div
                key="space-list"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="space-y-1">
                  {spaces.length === 0 ? (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                      {t("profile.spaces.noSpaces")}
                    </div>
                  ) : (
                    spaces.map(spaceRow)
                  )}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
          <div
            className={cn(
              "pt-3",
              showCreate ||
                showJoin ||
                editingSpace ||
                membersView ||
                leaveTarget
                ? "border-t border-border/50"
                : "mt-2 border-t border-border/50",
            )}
          >
            <AnimatePresence initial={false}>
              {showCreate ? (
                <motion.div
                  key="create-form"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <SpaceCreateForm
                    variant="inline"
                    className="mb-1"
                    onCreated={() => {
                      // Land in the new space: collapse the form and close
                      // the sheet, mirroring tapping a space to select it.
                      setShowCreate(false);
                      setSheetOpen(false);
                    }}
                    onCancel={() => setShowCreate(false)}
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>

            <AnimatePresence initial={false}>
              {editingSpace ? (
                <motion.div
                  key="edit-form"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <SpaceEditForm
                    variant="inline"
                    space={editingSpace}
                    className="mb-1"
                    onSaved={() => setEditingSpace(null)}
                    onCancel={() => setEditingSpace(null)}
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>

            <AnimatePresence initial={false}>
              {leaveTarget ? (
                <motion.div
                  key="leave-confirm"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <SpaceLeaveConfirm
                    space={leaveTarget}
                    className="mb-1"
                    onCancel={() => setLeaveTarget(null)}
                    onConfirmed={() => setLeaveTarget(null)}
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>

            <AnimatePresence initial={false}>
              {membersView ? (
                <motion.div
                  key="members-view"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <SpaceMembersList
                    variant="inline"
                    space={membersView}
                    className="mb-1"
                    onRemoveMember={(memberUserId) => {
                      if (!membersView) return;
                      removeMember.mutate({
                        spaceId: membersView.id,
                        memberUserId,
                      });
                    }}
                    removePending={removeMember.isPending}
                    onBack={() => setMembersSpace(null)}
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>

            <AnimatePresence initial={false}>
              {showJoin ? (
                <motion.div
                  key="join-form"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <SpaceJoinForm
                    variant="inline"
                    className="mb-1"
                    onJoined={() => {
                      setShowJoin(false);
                      setSheetOpen(false);
                    }}
                    onCancel={() => setShowJoin(false)}
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>

            <AnimatePresence initial={false}>
              {!(
                showCreate ||
                showJoin ||
                editingSpace ||
                membersView ||
                leaveTarget
              ) ? (
                <motion.div
                  key="action-toggles"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => setShowCreate(true)}
                      className="flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium text-primary transition-colors hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      <span className="flex size-6 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon icon={Plus} className="size-3.5" />
                      </span>
                      {t("profile.spaces.create")}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowJoin(true)}
                      className="flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:text-indigo-400"
                    >
                      <span className="flex size-6 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                        <Icon icon={KeyRound} className="size-3.5" />
                      </span>
                      {t("profile.spaces.join")}
                    </button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <Link
              href="/dashboard/profile#spaces"
              onClick={() => setSheetOpen(false)}
              className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              <Icon icon={Settings2} className="size-4" />
              {t("profile.spaces.manageSpaces")}
            </Link>
          </div>
        </BottomSheet>
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={displayName}
        title={displayName}
        className={triggerClassName}
      >
        {triggerContent}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        side="bottom"
        sideOffset={8}
        className="w-64 p-1"
      >
        {spaces.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            {t("profile.spaces.noSpaces")}
          </div>
        ) : (
          spaces.map((space) => {
            const isActive = space.id === activeSpace?.id;

            return (
              <DropdownMenuItem
                key={space.id}
                disabled={isActive || isPending}
                onClick={() => handleSelect(space.id)}
                className="flex items-center gap-2.5 rounded-md px-2 py-2"
              >
                <SpaceGlyph
                  name={space.name}
                  shared={!space.isPersonal}
                  avatarUrl={space.avatarUrl}
                  className="size-8 text-sm"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {space.name}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {t("profile.spaces.member", {
                      count: space.members.length,
                    })}
                    {space.isPersonal
                      ? ` · ${t("profile.spaces.personal")}`
                      : ""}
                  </span>
                </span>
                {isActive && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
                  >
                    <Icon icon={Check} className="size-3.5" />
                  </motion.span>
                )}
              </DropdownMenuItem>
            );
          })
        )}

        <div className="mt-1 border-t border-border/60 pt-1">
          <DropdownMenuItem className="rounded-md p-0">
            <Link
              href="/dashboard/profile#spaces"
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5"
            >
              <Icon icon={Settings2} className="size-4" />
              {t("profile.spaces.manageSpaces")}
            </Link>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
