"use client";

import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/shared";
import { Camera, Loader2, Trash2 } from "@/lib/icons";
import { cn, getUserInitials } from "@/lib/utils";
import type { Profile } from "@/types/Profile";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const ACCEPTED = "image/png,image/jpeg,image/jpg,image/webp";

interface AvatarUploaderProps {
  profile: Profile;
  value: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}

export function AvatarUploader({
  profile,
  value,
  onChange,
  disabled = false,
}: AvatarUploaderProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    if (file.size > MAX_AVATAR_SIZE) {
      setError(t("settings.profile.avatarHint"));
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError(t("settings.profile.avatarHint"));
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error ?? t("settings.profile.avatarError"));
      onChange(data.url);
    } catch {
      setError(t("settings.profile.avatarError"));
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void upload(file);
    e.target.value = "";
  };

  const handleRemove = () => {
    setError(null);
    onChange(null);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <motion.button
          type="button"
          whileHover={disabled || uploading ? undefined : { scale: 1.03 }}
          whileTap={disabled || uploading ? undefined : { scale: 0.97 }}
          onClick={() => {
            if (!disabled && !uploading) inputRef.current?.click();
          }}
          disabled={disabled || uploading}
          className={cn(
            "group relative flex size-28 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-primary/70 font-semibold text-primary-foreground shadow-lg shadow-primary/20 ring-2 ring-background",
            !disabled && !uploading && "cursor-pointer",
          )}
        >
          {value ? (
            /* biome-ignore lint/performance/noImgElement: Avatars are served from Supabase public storage. */
            <img
              src={value}
              alt={profile.name ?? "Avatar"}
              className="size-full rounded-full object-cover"
            />
          ) : (
            <span className="text-3xl font-bold">
              {getUserInitials(profile)}
            </span>
          )}

          {uploading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
              <Icon
                icon={Loader2}
                className="size-6 animate-spin text-primary"
              />
            </div>
          ) : !disabled ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
              <Icon icon={Camera} className="size-6" />
            </div>
          ) : null}
        </motion.button>

        {value && !disabled && !uploading ? (
          <motion.button
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleRemove}
            title={t("settings.profile.avatarRemove")}
            aria-label={t("settings.profile.avatarRemove")}
            className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full border border-border/30 bg-background text-muted-foreground shadow-md transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <Icon icon={Trash2} className="size-4" />
          </motion.button>
        ) : null}
      </div>

      <div className="text-center">
        <p className="text-sm font-medium text-foreground">
          {t("settings.profile.avatarLabel")}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {t("settings.profile.avatarHint")}
        </p>
        {error ? (
          <p className="mt-1 text-xs text-destructive">{error}</p>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || uploading}
      />
    </div>
  );
}
