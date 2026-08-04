import { cn, getUserInitials } from "@/lib/utils";
import type { Profile } from "@/types/Profile";
import type { ProfileIdentity } from "@/types/ProfileIdentity";

interface UserAvatarProps {
  profile: Profile | ProfileIdentity;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "h-9 w-9 text-xs",
  md: "h-10 w-10 text-xs",
  lg: "h-11 w-11 text-sm",
  xl: "h-20 w-20 text-2xl",
};

export function UserAvatar({
  profile,
  size = "sm",
  className,
}: UserAvatarProps) {
  const baseClasses = cn(
    "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 font-semibold text-primary-foreground shadow-sm shadow-primary/20 ring-2 ring-background",
    sizeClasses[size],
    className,
  );

  if (profile.avatarUrl) {
    return (
      <div className={cn(baseClasses, "overflow-hidden p-0")}>
        {/* biome-ignore lint/performance/noImgElement: Avatars are served from Supabase public storage. */}
        <img
          src={profile.avatarUrl}
          alt={profile.name ?? profile.email ?? "Avatar"}
          className="size-full rounded-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      </div>
    );
  }

  return <div className={baseClasses}>{getUserInitials(profile)}</div>;
}
