"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { BottomSheet } from "@/components/shared/bottom-sheet";
import { Icon } from "@/components/shared/icon";
import { SearchInput } from "@/components/shared/search-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocaleContext } from "@/context/LocaleContext";
import {
  type ChangelogEntry,
  type ChangelogItem,
  type ChangelogSection,
  changelog,
} from "@/lib/changelog";
import { scopeColor } from "@/lib/changelog/scope";
import { getLastSeenChangelogVersion } from "@/lib/changelog/storage";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Sparkles,
} from "@/lib/icons";

const DEFAULT_VISIBLE_OLDER = 3;

function dominantType(entry: ChangelogEntry): "features" | "fixes" | "mixed" {
  const types = entry.sections.map((s) => s.type);
  if (types.length === 1) return types[0];
  return "mixed";
}

/** Returns true when the item matches the search query. */
function itemMatches(item: ChangelogItem, query: string): boolean {
  const q = query.toLowerCase();
  if (item.text.toLowerCase().includes(q)) return true;
  if (item.scope?.toLowerCase().includes(q)) return true;
  return false;
}

/** Returns a filtered copy of the section, or null if no items match. */
function filterSection(
  section: ChangelogSection,
  query: string,
): ChangelogSection | null {
  if (!query) return section;
  const items = section.items.filter((i) => itemMatches(i, query));
  if (items.length === 0) return null;
  return { ...section, items };
}

/** Returns a filtered copy of the entry, or null if no sections survive. */
function filterEntry(
  entry: ChangelogEntry,
  query: string,
): ChangelogEntry | null {
  if (!query) return entry;
  const sections = entry.sections
    .map((s) => filterSection(s, query))
    .filter((s): s is ChangelogSection => s !== null);
  if (sections.length === 0) return null;
  return { ...entry, sections };
}

const ISSUE_RE = /\(#(\d+)\)/g;
const GITHUB_BASE = "https://github.com/GabrielCrackPro/flowy/issues";

function RichText({ text }: { text: string }) {
  const segments = text.split(ISSUE_RE);
  if (segments.length === 1) return <>{text}</>;

  // split with capture group produces: [before, num, after, num, after, ...]
  const children: React.ReactNode[] = [];
  for (let i = 0; i < segments.length; i++) {
    if (i % 2 === 0) {
      if (segments[i]) children.push(segments[i]);
    } else {
      children.push(
        <a
          key={i}
          href={`${GITHUB_BASE}/${segments[i]}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-0.5 whitespace-nowrap text-[11px] text-primary/70 transition hover:text-primary hover:underline underline-offset-2"
        >
          #{segments[i]}
          <ExternalLink className="size-3" />
        </a>,
      );
    }
  }
  return <>{children}</>;
}

function ItemLine({ item }: { item: ChangelogItem }) {
  return (
    <span className="flex items-start gap-1.5">
      {item.scope && (
        <Badge
          variant="outline"
          className={`mt-0.5 shrink-0 border px-1 py-0 text-[10px] font-mono leading-snug ${scopeColor(item.scope)}`}
        >
          {item.scope}
        </Badge>
      )}
      <span className="min-w-0">
        <RichText text={item.text} />
      </span>
    </span>
  );
}

function SectionsList({ sections }: { sections: ChangelogSection[] }) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      {sections.map((section) => {
        const isFeatures = section.type === "features";
        return (
          <div key={section.type}>
            <div className="mb-2.5 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  isFeatures
                    ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground"
                    : "bg-gradient-to-r from-emerald-500/90 to-emerald-500/70 text-white"
                }`}
              >
                {isFeatures ? (
                  <Sparkles className="size-3" />
                ) : (
                  <CheckCircle2 className="size-3" />
                )}
                {t(isFeatures ? "changelog.features" : "changelog.fixes")}
              </span>
              <Badge
                variant="secondary"
                className="px-1 py-0 text-[10px] tabular-nums"
              >
                {section.items.length}
              </Badge>
            </div>
            <ul className="space-y-0.5">
              {section.items.map((item, index) => (
                <li
                  // biome-ignore lint/suspicious/noArrayIndexKey: items lack a stable unique id
                  key={index}
                  className="flex items-start gap-2.5 rounded-lg px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/50"
                >
                  <span
                    className={`mt-1.5 size-1.5 shrink-0 rounded-sm ${
                      isFeatures ? "bg-primary/60" : "bg-emerald-500/60"
                    }`}
                  />
                  <ItemLine item={item} />
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

const DOT_COLORS: Record<string, string> = {
  features: "border-emerald-500 bg-emerald-100 dark:bg-emerald-900/50",
  fixes: "border-amber-500 bg-amber-100 dark:bg-amber-900/50",
  mixed: "border-primary bg-primary/20",
};

export function ChangelogContent({ open }: { open: boolean }) {
  const { t } = useTranslation();
  const { locale } = useLocaleContext();
  const [showAll, setShowAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!open) {
      setShowAll(false);
      setSearchQuery("");
    }
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
  const q = searchQuery.trim();

  // Entries newer than the last-seen version get a "New" badge.
  const lastSeenVersion = getLastSeenChangelogVersion();
  const lastSeenIndex = lastSeenVersion
    ? entries.findIndex((e) => e.version === lastSeenVersion)
    : -1;
  const isNew = (entry: ChangelogEntry) =>
    lastSeenIndex >= 0
      ? entries.findIndex((e) => e.version === entry.version) < lastSeenIndex
      : false;

  const latest: ChangelogEntry | null = entries[0]
    ? (filterEntry(entries[0], q) ?? null)
    : null;
  const older = entries.slice(1);

  const currentVersionIndex = older.findIndex(
    (e) => e.version === currentVersion,
  );
  const currentOlder =
    currentVersionIndex >= 0 ? older[currentVersionIndex] : null;

  const filteredOlder = useMemo(() => {
    return older
      .map((e) => filterEntry(e, q))
      .filter((e): e is ChangelogEntry => e !== null);
  }, [older, q]);

  const visibleOlder = useMemo(() => {
    if (showAll || q) return filteredOlder;
    let sliced = filteredOlder.slice(0, DEFAULT_VISIBLE_OLDER);
    // Ensure current version row is always visible.
    if (currentOlder) {
      const filteredCurrent = filterEntry(currentOlder, q);
      if (filteredCurrent && !sliced.includes(filteredCurrent)) {
        sliced = [...sliced, filteredCurrent];
      }
    }
    return sliced;
  }, [showAll, filteredOlder, q, currentOlder]);

  const hasMore = !q && older.length > visibleOlder.length;

  const latestSummary = useMemo(() => {
    if (!latest) return null;
    const featCount = latest.sections
      .filter((s) => s.type === "features")
      .reduce((n, s) => n + s.items.length, 0);
    const fixCount = latest.sections
      .filter((s) => s.type === "fixes")
      .reduce((n, s) => n + s.items.length, 0);
    const parts: string[] = [];
    if (featCount > 0)
      parts.push(t("changelog.countFeatures", { count: featCount }));
    if (fixCount > 0)
      parts.push(t("changelog.countFixes", { count: fixCount }));
    return parts.join(" · ");
  }, [latest, t]);

  const isLatestCurrent = latest?.version === currentVersion;
  const totalVisible = (latest ? 1 : 0) + visibleOlder.length;
  const isEmpty = totalVisible === 0;

  return (
    <>
      {/* Search bar */}
      <SearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder={t("changelog.searchPlaceholder")}
        className="mb-4"
      />

      {isEmpty ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {q ? t("changelog.noFilterResults") : t("changelog.noChanges")}
        </p>
      ) : (
        <div className="space-y-6">
          {/* Latest release — hero card */}
          {latest && (
            <div
              className={`relative overflow-hidden rounded-2xl border p-5 ${
                isLatestCurrent
                  ? "border-primary/40 bg-gradient-to-br from-primary/[0.12] via-primary/[0.04] to-transparent"
                  : "border-primary/20 bg-gradient-to-br from-primary/[0.06] via-primary/[0.01] to-transparent"
              }`}
            >
              {isLatestCurrent && (
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              )}
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-primary">
                <Sparkles className="size-3.5" />
                {t("changelog.latest")}
              </span>
              <div className="mt-2 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <span className="text-2xl font-bold tracking-tight">
                  v{latest.version}
                </span>
                {isNew(latest) && (
                  <Badge className="border-0 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-[10px]">
                    {t("changelog.newLabel")}
                  </Badge>
                )}
                <span className="text-sm text-muted-foreground">
                  {formatDate(latest.date)}
                </span>
              </div>
              {latestSummary && (
                <p className="mt-1 text-xs text-muted-foreground/80">
                  {latestSummary}
                </p>
              )}
              <div className="mt-4">
                <SectionsList sections={latest.sections} />
              </div>
            </div>
          )}

          <p className="text-[11px] leading-relaxed text-muted-foreground/60">
            {t("changelog.englishOnlyNote")}
          </p>

          {/* Previous releases — timeline */}
          {visibleOlder.length > 0 && (
            <ol className="relative ml-1.5 space-y-6 border-l border-border/60 pl-5">
              {visibleOlder.map((entry, idx) => {
                const dotType = dominantType(entry);
                const isCurrent = entry.version === currentVersion;
                const showGap =
                  !showAll &&
                  !q &&
                  isCurrent &&
                  currentVersionIndex >= DEFAULT_VISIBLE_OLDER &&
                  idx === visibleOlder.length - 1;

                return (
                  <li key={entry.version} className="relative">
                    {showGap && (
                      <p className="-mt-3 mb-4 text-[11px] text-muted-foreground/60">
                        {t("changelog.olderReleases")}
                      </p>
                    )}
                    <span
                      className={`absolute -left-[25px] top-1.5 size-2.5 rounded-full border-2 ${
                        isCurrent
                          ? "border-primary bg-primary/30 ring-2 ring-primary/20"
                          : DOT_COLORS[dotType]
                      }`}
                    />
                    <div
                      className={`-mx-3 -my-2 rounded-xl px-3 py-2 ${
                        isCurrent
                          ? "border-l-2 border-l-primary bg-primary/5"
                          : isNew(entry)
                            ? "bg-primary/[0.03]"
                            : ""
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <h3 className="text-sm font-semibold tracking-tight">
                          v{entry.version}
                        </h3>
                        {isNew(entry) && (
                          <Badge className="border-0 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-[10px]">
                            {t("changelog.newLabel")}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDate(entry.date)}
                        </span>
                      </div>
                      <div className="mt-3">
                        <SectionsList sections={entry.sections} />
                      </div>
                    </div>
                  </li>
                );
              })}
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
    </>
  );
}

export function ChangelogSheet({ open, onOpenChange }: ChangelogSheetProps) {
  const { t } = useTranslation();

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t("changelog.title")}
      description={t("changelog.description")}
      icon={<Icon icon={Sparkles} className="size-5" />}
      externalHref="/changelog"
      className="sm:max-w-lg sm:mx-auto sm:rounded-3xl"
      contentClassName="px-4 py-5 sm:px-5 sm:py-5"
      snapPoints={[0.45, 0.92]}
    >
      <ChangelogContent open={open} />
    </BottomSheet>
  );
}
