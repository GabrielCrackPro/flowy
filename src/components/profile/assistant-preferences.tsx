"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
import { Switch } from "@components/ui/switch";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { ConfirmDialog, Icon } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { useFlags } from "@/hooks/useFlags";
import { usePreferences } from "@/hooks/usePreferences";
import { Clock, MessageSquare, Trash2 } from "@/lib/icons";
import { PreferenceRow } from "./preference-row";

type SavingField = "enabled" | "storeHistory" | "clearAll" | null;

export function AssistantPreferences() {
  const { t } = useTranslation();
  const { assistantEnabled: assistantFlag } = useFlags();
  const {
    preferences,
    updatePreferences,
    saving: prefSaving,
  } = usePreferences();
  const [saving, setSaving] = useState<SavingField>(null);
  const [clearAllOpen, setClearAllOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  const withSaving = useCallback(
    async (field: SavingField, fn: () => Promise<void>) => {
      setSaving(field);
      try {
        await fn();
      } finally {
        setSaving(null);
      }
    },
    [],
  );

  const handleClearAll = useCallback(async () => {
    setClearing(true);
    try {
      const response = await fetch("/api/assistant/conversations", {
        method: "DELETE",
      });
      if (response.ok) {
        setClearAllOpen(false);
        window.location.reload();
      }
    } finally {
      setClearing(false);
    }
  }, []);

  const isSaving = saving !== null || prefSaving;

  // Hide entirely when the feature flag is off
  if (!assistantFlag) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-3">
          <span className="flex size-6 shrink-0 items-center justify-center text-muted-foreground">
            <Icon icon={MessageSquare} className="size-4" />
          </span>
          <div className="min-w-0">
            <CardTitle>{t("settings.assistant.title")}</CardTitle>
            <CardDescription>
              {t("settings.assistant.description")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5">
        <PreferenceRow
          icon={MessageSquare}
          title={t("settings.preferences.assistantEnabledLabel")}
          hint={t("settings.preferences.assistantEnabledHint")}
          saving={saving === "enabled" && prefSaving}
          control={
            <Switch
              checked={preferences.assistantEnabled}
              disabled={isSaving}
              onCheckedChange={(checked) => {
                void withSaving("enabled", () =>
                  updatePreferences({ assistantEnabled: checked }),
                );
              }}
              aria-label={t("settings.preferences.assistantEnabledLabel")}
            />
          }
        />

        <PreferenceRow
          icon={Clock}
          title={t("settings.preferences.assistantStoreHistoryLabel")}
          hint={t("settings.preferences.assistantStoreHistoryHint")}
          saving={saving === "storeHistory" && prefSaving}
          control={
            <Switch
              checked={preferences.assistantStoreHistory}
              disabled={isSaving}
              onCheckedChange={(checked) => {
                void withSaving("storeHistory", () =>
                  updatePreferences({ assistantStoreHistory: checked }),
                );
              }}
              aria-label={t("settings.preferences.assistantStoreHistoryLabel")}
            />
          }
        />

        <PreferenceRow
          icon={Trash2}
          title={t("settings.preferences.assistantClearHistory")}
          hint={t("settings.preferences.assistantClearHistoryHint")}
          control={
            <Button
              variant="ghost"
              className="gap-1.5 text-destructive hover:text-destructive"
              onClick={() => setClearAllOpen(true)}
              disabled={clearing}
            >
              <Trash2 className="size-4" />
              <span className="hidden sm:inline">
                {t("settings.preferences.assistantClearHistory")}
              </span>
            </Button>
          }
        />
      </CardContent>

      <ConfirmDialog
        open={clearAllOpen}
        onOpenChange={setClearAllOpen}
        title={t("settings.preferences.assistantClearHistory")}
        description={t("settings.preferences.assistantClearHistoryConfirm")}
        confirmLabel={t("settings.preferences.assistantClearHistory")}
        variant="destructive"
        icon={<Icon icon={Trash2} className="size-5" />}
        onConfirm={() => void handleClearAll()}
      />
    </Card>
  );
}
