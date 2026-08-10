"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SheetLayout } from "@/components/ui/sheet-layout";
import { useLocaleContext } from "@/context/LocaleContext";
import {
  type ChangelogEntry,
  type ChangelogSection,
  changelog,
} from "@/lib/changelog";
import {
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Sparkles,
  Wrench,
} from "@/lib/icons";

const CHANGELOG_URL =
  "https://github.com/GabrielCrackPro/flowy/blob/main/CHANGELOG.md";

// Releases shown in the timeline before the "Show all releases" toggle.
const DEFAULT_VISIBLE_OLDER = 3;

function SectionsList({ sections }: { sections: ChangelogSection[] }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-3">
      {sections.map((section) => {
        const isFeatures = section.type === "features";
        return (
          <div key={section.type} className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider">
              {isFeatures ? (
                <Sparkles className="size-3.5 text-primary" />
              ) : (
                <Wrench className="size-3.5 text-amber-500 dark:text-amber-400" />
              )}
              <span
                className={
                  isFeatures
                    ? "text-primary"
                    : "text-amber-600 dark:text-amber-400"
                }
              >
                {t(isFeatures ? "changelog.features" : "changelog.fixes")}
              </span>
            </div>
            <ul className="space-y-1.5">
              {section.items.map((item, index) => (
                <li
                  // biome-ignore lint/suspicious/noArrayIndexKey: items are plain strings without a stable unique id (and can repeat across releases)
                  key={index}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <span className="mt-[7px] size-1 shrink-0 rounded-full bg-foreground/30" />
                  <span className="min-w-0">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

interface ChangelogSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangelogSheet({ open, onOpenChange }: ChangelogSheetProps) {
  const { t } = useTranslation();
  const { locale } = useLocaleContext();
  const [showAll, setShowAll] = useState(false);

  // Reset the expanded state whenever the sheet is closed.
  useEffect(() => {
    if (!open) setShowAll(false);
  }, [open]);

  const formatDate = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return (date: string) => formatter.format(new Date(`${date}T12:00:00`));
  }, [locale]);

  const { currentVersion, entries } = changelog;
  const latest: ChangelogEntry | null = entries[0] ?? null;
  const older = entries.slice(1);
  const visibleOlder = showAll ? older : older.slice(0, DEFAULT_VISIBLE_OLDER);
  const hasMore = older.length > visibleOlder.length;

  return (
    <SheetLayout
      open={open}
      onOpenChange={onOpenChange}
      title={t("changelog.title")}
      description={t("changelog.description")}
      icon={Sparkles}
      className="sm:max-w-lg"
      footerRight={
        <Button asChild variant="outline" className="w-full">
          <a href={CHANGELOG_URL} target="_blank" rel="noreferrer">
            <ExternalLink />
            {t("changelog.viewFull")}
          </a>
        </Button>
      }
    >
      {!latest ? (
        <p className="text-sm text-muted-foreground">
          {t("changelog.noChanges")}
        </p>
      ) : (
        <div className="space-y-6">
          {/* Latest release — hero card */}
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-5">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-primary">
                <Sparkles className="size-3.5" />
                {t("changelog.latest")}
              </span>
              {latest.version === currentVersion && (
                <Badge className="gap-1">
                  <Check className="size-3" />
                  {t("changelog.currentVersion")}
                </Badge>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <span className="text-2xl font-bold tracking-tight">
                v{latest.version}
              </span>
              <span className="text-sm text-muted-foreground">
                {formatDate(latest.date)}
              </span>
            </div>
            <div className="mt-4">
              <SectionsList sections={latest.sections} />
            </div>
          </div>

          {/* Previous releases — timeline */}
          {visibleOlder.length > 0 && (
            <ol className="relative ml-1.5 space-y-6 border-l border-border/60 pl-5">
              {visibleOlder.map((entry) => (
                <li key={entry.version} className="relative">
                  <span className="absolute -left-[25px] top-1.5 size-2.5 rounded-full border-2 border-primary bg-background" />
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <h3 className="text-sm font-semibold tracking-tight">
                      v{entry.version}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(entry.date)}
                    </span>
                    {entry.version === currentVersion && (
                      <Badge variant="secondary">
                        {t("changelog.currentVersion")}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-3">
                    <SectionsList sections={entry.sections} />
                  </div>
                </li>
              ))}
            </ol>
          )}

          {hasMore && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={() => setShowAll((value) => !value)}
            >
              {showAll ? (
                <>
                  {t("changelog.showLess")}
                  <ChevronUp />
                </>
              ) : (
                <>
                  {t("changelog.showAll")}
                  <ChevronDown />
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </SheetLayout>
  );
}
