"use client";

import { useTranslation } from "react-i18next";
import { useSpaceLeave } from "@/hooks/useSpaceLeave";
import type { SpaceSummary } from "@/lib/api/space";
import { ConfirmDialog } from "./confirm-dialog";

interface SpaceLeaveDialogProps {
  /** Space the user is leaving; null renders nothing (closed). */
  space: SpaceSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Shared confirm for leaving or deleting a space. Self-contained: decides
 * between leave (shared/member) and delete (owner with no other members)
 * using the profile + space data, so the profile page and the space switcher
 * sheet share one destructive flow.
 */
export function SpaceLeaveDialog({
  space,
  open,
  onOpenChange,
}: SpaceLeaveDialogProps) {
  const { t } = useTranslation();
  const { isOnlyMember, handleConfirm } = useSpaceLeave(space);

  const confirm = () => {
    handleConfirm();
    onOpenChange(false);
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        space && isOnlyMember
          ? `${t("profile.spaces.leaveConfirmOwner")} "${space.name}"`
          : `${t("profile.spaces.leaveConfirm")} "${space?.name ?? ""}"`
      }
      description={
        space && isOnlyMember
          ? t("profile.spaces.leaveConfirmOwnerDescription")
          : t("profile.spaces.leaveConfirmDescription")
      }
      confirmLabel={
        space && isOnlyMember
          ? t("profile.spaces.deleteSpace")
          : t("profile.spaces.leaveSpace")
      }
      cancelLabel={t("profile.spaces.cancel")}
      onConfirm={confirm}
      variant="destructive"
    />
  );
}
