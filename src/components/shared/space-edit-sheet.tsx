"use client";

import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui";
import { SheetLayout } from "@/components/ui/sheet-layout";
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
    <SheetLayout
      open={open}
      onOpenChange={onOpenChange}
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
            onClick={() => onOpenChange(false)}
            disabled={rename.isPending}
            className="h-10"
          >
            <X className="mr-2 size-4" />
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form={formId}
            disabled={!space || rename.isPending}
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
      {space ? (
        <SpaceEditForm
          variant="sheet"
          formId={formId}
          space={space}
          autoFocus
          onSaved={() => onOpenChange(false)}
        />
      ) : null}
    </SheetLayout>
  );
}
