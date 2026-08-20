"use client";

import { motion } from "framer-motion";
import { Camera as CameraData } from "lucide";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon, LoadingIcon } from "@/components/shared";
import { toast } from "@/components/shared/toast";
import { uploadImage } from "@/lib/api/upload";
import { Camera, Trash2 } from "@/lib/icons";
import { cn } from "@/lib/utils";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const ACCEPTED = "image/png,image/jpeg,image/jpg,image/webp";

interface SpaceAvatarUploaderProps {
  name: string;
  value: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}

/** Compact picture uploader for a space, used inside the rename sheet. */
export function SpaceAvatarUploader({
  name,
  value,
  onChange,
  disabled = false,
}: SpaceAvatarUploaderProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    if (file.size > MAX_AVATAR_SIZE || !file.type.startsWith("image/")) {
      toast.error(t("profile.spaces.avatarError"));
      return;
    }
    setUploading(true);
    try {
      // Resized client-side to 512px and re-encoded as WebP before upload.
      const url = await uploadImage("/api/upload/space", file);
      onChange(url);
    } catch {
      toast.error(t("profile.spaces.avatarError"));
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void upload(file);
    e.target.value = "";
  };

  return (
    <div className="flex items-center gap-4">
      <motion.button
        type="button"
        whileHover={disabled || uploading ? undefined : { scale: 1.03 }}
        whileTap={disabled || uploading ? undefined : { scale: 0.97 }}
        onClick={() => {
          if (!disabled && !uploading) inputRef.current?.click();
        }}
        disabled={disabled || uploading}
        className={cn(
          "group relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-primary to-primary/70 font-semibold text-primary-foreground shadow-sm ring-1 ring-border/30",
          !disabled && !uploading && "cursor-pointer",
        )}
      >
        {value ? (
          /* biome-ignore lint/performance/noImgElement: Avatars are served from Supabase public storage. */
          <img
            src={value}
            alt={name}
            className="size-full rounded-xl object-cover"
          />
        ) : (
          <span className="text-xl font-bold">
            {name.trim().charAt(0).toUpperCase() || (
              <Icon icon={Camera} className="size-6" />
            )}
          </span>
        )}

        {uploading ? (
          <span className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <LoadingIcon
              icon={CameraData}
              loading
              size={20}
              className="text-primary"
            />
          </span>
        ) : !disabled ? (
          <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
            <Icon icon={Camera} className="size-5" />
          </span>
        ) : null}
      </motion.button>

      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-medium">{t("profile.spaces.avatarLabel")}</p>
        <p className="text-xs text-muted-foreground">
          {t("profile.spaces.avatarHint")}
        </p>
        {value && !disabled && !uploading ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition hover:text-destructive"
          >
            <Icon icon={Trash2} className="size-3.5" />
            {t("profile.spaces.avatarRemove")}
          </button>
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
