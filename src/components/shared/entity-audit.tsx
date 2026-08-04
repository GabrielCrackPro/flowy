"use client";

import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { ProfileIdentity } from "@/types/ProfileIdentity";
import { RelativeTime } from "./relative-time";

interface EntityAuditProps {
  createdAt?: string | null;
  createdBy?: ProfileIdentity | null;
  updatedAt?: string | null;
  updatedBy?: ProfileIdentity | null;
  className?: string;
}

function MiniAvatar({ identity }: { identity?: ProfileIdentity | null }) {
  if (!identity) return null;

  const displayName = identity.name ?? identity.email ?? "?";

  return (
    <span className="flex size-4 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary/20 to-primary/10 font-semibold text-primary ring-1 ring-background">
      {identity.avatarUrl ? (
        // biome-ignore lint/performance/noImgElement: Avatars are served from Supabase public storage.
        <img
          src={identity.avatarUrl}
          alt={displayName}
          className="size-full object-cover"
        />
      ) : (
        <span className="text-[0.55rem] leading-none">
          {displayName.charAt(0).toUpperCase()}
        </span>
      )}
    </span>
  );
}

function AuditEntry({
  label,
  identity,
  date,
}: {
  label: string;
  identity?: ProfileIdentity | null;
  date?: string | null;
}) {
  if (!identity) return null;

  const displayName = identity.name ?? identity.email ?? "?";

  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <MiniAvatar identity={identity} />
      <span className="truncate">
        <span className="text-muted-foreground/50">{label}</span>{" "}
        <span className="font-medium text-muted-foreground">{displayName}</span>
        <RelativeTime date={date} className="ml-1 text-muted-foreground/40" />
      </span>
    </span>
  );
}

export function EntityAudit({
  createdAt,
  createdBy,
  updatedAt,
  updatedBy,
  className,
}: EntityAuditProps) {
  const { t } = useTranslation();

  const hasModification =
    !!createdBy &&
    !!updatedBy &&
    !!createdAt &&
    !!updatedAt &&
    updatedAt !== createdAt;

  if (!createdBy && !hasModification) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-2 gap-y-1 text-xs",
        className,
      )}
    >
      <AuditEntry
        label={t("entityAudit.createdBy")}
        identity={createdBy}
        date={createdAt}
      />
      {hasModification && (
        <>
          <span className="text-muted-foreground/25">·</span>
          <AuditEntry
            label={t("entityAudit.updatedBy")}
            identity={updatedBy}
            date={updatedAt}
          />
        </>
      )}
    </div>
  );
}
