"use client";

import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { SheetClose } from "@/components/ui/sheet";
import { SheetLayout } from "@/components/ui/sheet-layout";
import type { SpaceSummary } from "@/lib/api/space";
import { Users, X } from "@/lib/icons";
import { SpaceMembersList } from "./space-members-list";

interface SpaceMembersSheetProps {
  space: SpaceSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRemoveMember: (memberUserId: string) => void;
  removePending?: boolean;
}

/**
 * Shared members sheet (profile page). Thin chrome around `SpaceMembersList`
 * — the list owns its content and the removal confirm, so the profile page and
 * the space switcher sheet share one membership view.
 */
export function SpaceMembersSheet({
  space,
  open,
  onOpenChange,
  onRemoveMember,
  removePending = false,
}: SpaceMembersSheetProps) {
  const { t } = useTranslation();

  if (!space) return null;

  return (
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
      <SpaceMembersList
        variant="sheet"
        space={space}
        onRemoveMember={onRemoveMember}
        removePending={removePending}
      />
    </SheetLayout>
  );
}
