"use client";

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SpaceSummary } from "@/lib/api/space";
import {
  CalendarDays,
  CheckCircle2,
  Copy,
  Crown,
  KeyRound,
  Loader2,
  LogOut,
  Pencil,
  UserMinus,
  Users,
} from "@/lib/icons";

import { cn } from "@/lib/utils";

function SpaceGlyph({
  name,
  shared,
  avatarUrl,
  className,
}: {
  name: string;
  shared: boolean;
  avatarUrl?: string | null;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-linear-to-br font-semibold text-primary-foreground shadow-sm transition-transform duration-300 group-hover:scale-105",
        shared
          ? "from-violet-500 to-violet-600 shadow-violet-500/20"
          : "from-primary to-primary/70 shadow-primary/20",
        className,
      )}
    >
      {avatarUrl ? (
        /* biome-ignore lint/performance/noImgElement: Avatars are served from Supabase public storage. */
        <img
          src={avatarUrl}
          alt={name}
          className="size-full rounded-xl object-cover"
        />
      ) : name ? (
        name.trim().charAt(0).toUpperCase()
      ) : (
        <Icon icon={Users} className="size-4" />
      )}
    </span>
  );
}

const MEMBER_COLORS = [
  "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
];

/** Deterministic color per user so the same member keeps the same avatar tint. */
function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return MEMBER_COLORS[Math.abs(hash) % MEMBER_COLORS.length];
}

function formatDate(
  date: string | undefined,
  locale: string,
  options: Intl.DateTimeFormatOptions,
): string {
  if (!date) return "";
  try {
    return new Intl.DateTimeFormat(locale, options).format(new Date(date));
  } catch {
    return "";
  }
}

function MemberStack({ space }: { space: SpaceSummary }) {
  const { t, i18n } = useTranslation();
  const members = space.members;
  const visible = members.slice(0, 3);
  const overflow = members.length - visible.length;

  if (members.length === 0) {
    return (
      <span className="text-xs text-muted-foreground">
        {t("profile.spaces.memberNone")}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-2">
        {visible.map((member) => {
          const user = member.user;
          const initial =
            user.name?.charAt(0).toUpperCase() ??
            user.email?.charAt(0).toUpperCase() ??
            "?";
          return (
            <span
              key={member.id}
              title={`${user.name ?? user.email ?? t("profile.user")} · ${t(
                "profile.spaces.joinedOn",
                {
                  date: formatDate(member.joinedAt, i18n.language, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }),
                },
              )}`}
              className={cn(
                "relative flex size-6 items-center justify-center overflow-hidden rounded-full text-[0.6rem] font-semibold ring-2 ring-background",
                avatarColor(user.id),
              )}
            >
              {initial}
              {user.avatarUrl ? (
                /* biome-ignore lint/performance/noImgElement: Avatars are served from Supabase public storage. */
                <img
                  src={user.avatarUrl}
                  alt={user.name ?? user.email ?? t("profile.user")}
                  className="absolute inset-0 size-full rounded-full object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              ) : null}
            </span>
          );
        })}

        {overflow > 0 ? (
          <span
            title={t("profile.spaces.member_other", {
              count: members.length,
            })}
            className="flex size-6 items-center justify-center rounded-full bg-muted text-[0.6rem] font-semibold text-muted-foreground ring-2 ring-background"
          >
            +{overflow}
          </span>
        ) : null}
      </div>

      <span className="text-xs text-muted-foreground tabular-nums">
        {t(
          members.length === 1
            ? "profile.spaces.member_one"
            : "profile.spaces.member_other",
          { count: members.length },
        )}
      </span>
    </div>
  );
}

export interface SpaceCardProps {
  space: SpaceSummary;
  isActive: boolean;
  isOwner: boolean;
  activatePending?: boolean;
  onActivate: () => void;
  onEdit: () => void;
  onLeave: () => void;
  onCopyCode: (code: string) => void;
  onManageMembers?: () => void;
}

export function SpaceCard({
  space,
  isActive,
  isOwner,
  activatePending = false,
  onActivate,
  onEdit,
  onLeave,
  onCopyCode,
  onManageMembers,
}: SpaceCardProps) {
  const { t, i18n } = useTranslation();
  const joinCode = space.joinCode ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border transition duration-300",
        isActive
          ? "border-primary/40 bg-gradient-to-br from-primary/8 via-primary/[0.03] to-transparent shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
          : "border-border/30 bg-gradient-to-br from-card to-card/50 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)]",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r",
          isActive
            ? "from-primary via-primary to-primary"
            : "from-primary/30 via-primary/10 to-transparent",
        )}
      />

      <div className="relative flex items-start gap-4 p-5">
        <SpaceGlyph
          name={space.name}
          shared={!space.isPersonal}
          avatarUrl={space.avatarUrl}
          className="size-12 text-lg"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold tracking-tight">
              {space.name}
            </p>

            {isActive ? (
              <Badge className="gap-1.5 border-primary/20 bg-primary/10 text-primary hover:bg-primary/10">
                <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                {t("profile.spaces.activate")}
              </Badge>
            ) : null}

            {space.isPersonal ? (
              <Badge variant="secondary">{t("profile.spaces.personal")}</Badge>
            ) : (
              <Badge className="gap-1 border-violet-500/20 bg-violet-500/10 text-violet-600 hover:bg-violet-500/10 dark:text-violet-400">
                <Icon icon={Users} className="size-3" />
                {t("profile.spaces.shared")}
              </Badge>
            )}

            <Badge
              variant="outline"
              className={cn(
                "gap-1 border-border/50 text-[10px]",
                isOwner
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-muted-foreground",
              )}
            >
              <Icon icon={isOwner ? Crown : Users} className="size-3" />
              {t(
                isOwner
                  ? "profile.spaces.roleOwner"
                  : "profile.spaces.roleMember",
              )}
            </Badge>
          </div>

          <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground/70">
            <Icon icon={CalendarDays} className="size-3" />
            {t("profile.spaces.createdOn", {
              date: formatDate(space.createdAt, i18n.language, {
                month: "short",
                year: "numeric",
              }),
            })}
          </p>
        </div>
      </div>

      <div className="relative flex flex-col gap-3 border-t border-border/40 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <MemberStack space={space} />

          {joinCode ? (
            isOwner ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onCopyCode(joinCode)}
                title={t("profile.spaces.copyCode")}
                aria-label={`${t("profile.spaces.copyCode")} ${space.name}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/40 bg-muted/30 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/50 hover:text-foreground"
              >
                <Icon icon={KeyRound} className="size-3.5" />
                <span className="font-mono tracking-widest">{joinCode}</span>
                <Icon icon={Copy} className="size-3.5" />
              </Button>
            ) : (
              <span
                title={t("profile.spaces.codeWithOwner")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/40 bg-muted/20 px-2.5 py-1 text-xs font-medium text-muted-foreground/80"
              >
                <Icon icon={KeyRound} className="size-3.5" />
                {t("profile.spaces.codeWithOwner")}
              </span>
            )
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {isOwner && !space.isPersonal ? (
            <Button
              variant="outline"
              size="icon"
              title={t("profile.spaces.manageMembers")}
              aria-label={`${t("profile.spaces.manageMembers")} ${space.name}`}
              className="text-muted-foreground hover:text-foreground"
              onClick={onManageMembers}
            >
              <Icon icon={UserMinus} className="size-4" />
            </Button>
          ) : null}
          {isOwner ? (
            <Button
              variant="outline"
              size="icon"
              title={t("profile.spaces.rename")}
              aria-label={`${t("profile.spaces.rename")} ${space.name}`}
              className="text-muted-foreground hover:text-foreground"
              onClick={onEdit}
            >
              <Icon icon={Pencil} className="size-4" />
            </Button>
          ) : null}

          {!isActive ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onActivate}
              disabled={activatePending}
            >
              {activatePending ? (
                <Icon icon={Loader2} className="size-4 animate-spin" />
              ) : (
                <Icon icon={CheckCircle2} className="size-4" />
              )}
              {t("profile.spaces.activate")}
            </Button>
          ) : null}

          {!space.isPersonal || !isOwner ? (
            <Button
              variant="ghost"
              size="sm"
              title={t("profile.spaces.leave")}
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              onClick={onLeave}
            >
              <Icon icon={LogOut} className="size-4" />
              {t("profile.spaces.leave")}
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground/70">
              {t("profile.spaces.personal")}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
