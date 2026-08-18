"use client";

import { useId } from "react";
import { useTranslation } from "react-i18next";
import { BottomSheet } from "@/components/shared/bottom-sheet";
import { Button } from "@/components/ui";
import { useSpaces } from "@/hooks/useSpaces";
import type { SpaceSummary } from "@/lib/api/space";
import { Check, Loader2, Pencil, X } from "@/lib/icons";
import { SpaceEditForm } from "./space-edit-form";

interface SpaceEditSheetProps {
  /** Space being edited; null renders nothing (closed). */
  space: SpaceSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Shared rename sheet (name + avatar + personal toggle). Thin chrome around
 * `SpaceEditForm` — the form owns its state and the rename mutation, so the
 * profile page and the space switcher sheet share one edit flow.
 */
export function SpaceEditSheet({
  space,
  open,
  onOpenChange,
}: SpaceEditSheetProps) {
  const { t } = useTranslation();
  const { rename } = useSpaces();
  const formId = useId();

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("profile.spaces.rename")}
      description={t("profile.spaces.renameHint")}
      icon={<Pencil className="size-5" />}
      iconGradient="from-indigo-500/20 to-indigo-500/10"
      iconColor="text-indigo-600 dark:text-indigo-400"
      className="sm:max-w-[500px]"
      contentClassName="px-4 py-5 sm:px-6 sm:py-6"
      footerSecondary={
        <Button
          type="button"
          variant="ghost"
          onClick={() => onOpenChange(false)}
          disabled={rename.isPending}
          className="h-11 w-full sm:h-10 sm:w-auto sm:px-4"
        >
          <X className="mr-2 size-4" />
          {t("common.cancel")}
        </Button>
      }
      footerPrimary={
        <Button
          type="submit"
          form={formId}
          disabled={!space || rename.isPending}
          className="h-12 w-full gap-2 font-semibold shadow-md shadow-primary/20 sm:h-10 sm:w-auto sm:min-w-28"
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
      }
    >
      {space ? (
        <SpaceEditForm
          variant="sheet"
          formId={formId}
          space={space}
          autoFocus
          onSaved={() => onOpenChange(false)}
        />
      ) : null}
    </BottomSheet>
  );
}
