"use client";

import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useChangelog } from "@/context/ChangelogContext";
import { useLocaleContext } from "@/context/LocaleContext";
import { useProfile } from "@/hooks/useProfile";
import { useSignOut } from "@/hooks/useSignOut";
import { useTheme } from "@/hooks/useTheme";
import { search } from "@/lib/api/search";
import { ArrowUpDown, Repeat2, Tag, Target, Wallet } from "@/lib/icons";
import type { SearchResultItem } from "@/types/SearchResult";
import type { IconProps } from "../icon";
import { CommandPaletteActions } from "./CommandPaletteActions";
import { CommandPaletteContainer } from "./CommandPaletteContainer";
import { CommandPaletteEmpty } from "./CommandPaletteEmpty";
import {
  CommandPaletteFilters,
  type FilterType,
} from "./CommandPaletteFilters";
import { CommandPaletteFooter } from "./CommandPaletteFooter";
import { CommandPaletteInput } from "./CommandPaletteInput";
import { CommandPaletteOverlay } from "./CommandPaletteOverlay";
import { CommandPaletteRecent } from "./CommandPaletteRecent";
import { CommandPaletteResults } from "./CommandPaletteResults";
import {
  type CommandContext,
  type ResolvedCommand,
  resolveCommand,
  useCommandRegistry,
} from "./command-registry";
import { deleteAllRecent, getRecent, saveRecent } from "./utils";

const sectionMeta: Record<
  SearchResultItem["type"],
  { icon: IconProps["icon"]; labelKey: string }
> = {
  transaction: { icon: ArrowUpDown, labelKey: "nav.transactions" },
  category: { icon: Tag, labelKey: "nav.categories" },
  budget: { icon: Wallet, labelKey: "nav.budgets" },
  goal: { icon: Target, labelKey: "nav.goals" },
  subscription: { icon: Repeat2, labelKey: "nav.subscriptions" },
};

const sectionOrder: SearchResultItem["type"][] = [
  "transaction",
  "category",
  "budget",
  "goal",
  "subscription",
];

const sectionLabels: Record<SearchResultItem["type"], string> = {
  transaction: "nav.transactions",
  category: "nav.categories",
  budget: "nav.budgets",
  goal: "nav.goals",
  subscription: "nav.subscriptions",
};

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { isDark, toggleTheme } = useTheme();
  const { profile } = useProfile();
  const { locale } = useLocaleContext();
  const { openChangelog } = useChangelog();
  const handleSignOut = useSignOut();

  // NOTE: the palette deliberately does NOT intercept system back via
  // useSystemBackDismiss. Its synthetic history entries race with App Router
  // navigations — a command that closes the palette and navigates would have
  // its navigation silently cancelled by the marker entry's popstate. Escape
  // and the backdrop already dismiss it.

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchRequestRef = useRef(0);
  const registeredCommands = useCommandRegistry();

  const commandContext = useMemo<CommandContext>(
    () => ({
      t,
      isDark,
      close: () => onOpenChange(false),
      navigate: (url) => router.push(url),
      toggleTheme: () => toggleTheme(),
      openChangelog,
      signOut: handleSignOut,
    }),
    [
      t,
      isDark,
      onOpenChange,
      router,
      toggleTheme,
      openChangelog,
      handleSignOut,
    ],
  );

  const commands = useMemo<ResolvedCommand[]>(
    () =>
      registeredCommands.map((command) =>
        resolveCommand(command, commandContext),
      ),
    [registeredCommands, commandContext],
  );

  const refreshRecent = useCallback(() => {
    setRecentSearches(getRecent());
  }, []);

  useEffect(() => {
    if (open) {
      refreshRecent();
      setQuery("");
      setResults([]);
      setLoading(false);
      setActiveFilter("all");
    }
  }, [open, refreshRecent]);

  // First Escape clears the query, second closes the palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        e.preventDefault();
        if (query) {
          setQuery("");
        } else {
          onOpenChange(false);
        }
      }
    };

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange, query]);

  // Lock body scroll while the palette is open
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    const requestId = ++searchRequestRef.current;

    if (query.length < 2) {
      setResults([]);
      setLoading(false);
      setActiveFilter("all");
      return;
    }

    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const data = await search(query);
        if (requestId !== searchRequestRef.current) return;
        setResults(data.results);
        setActiveFilter("all");
        if (data.results.length > 0) {
          saveRecent(query);
          refreshRecent();
        }
      } catch {
        if (requestId === searchRequestRef.current) setResults([]);
      } finally {
        if (requestId === searchRequestRef.current) setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, refreshRecent]);

  const grouped = useMemo(() => {
    const map = new Map<SearchResultItem["type"], SearchResultItem[]>();
    for (const r of results) {
      if (!map.has(r.type)) map.set(r.type, []);
      map.get(r.type)?.push(r);
    }
    return sectionOrder
      .filter((type) => map.has(type))
      .flatMap((type) => {
        const items = map.get(type);
        return items ? [{ type, items }] : [];
      });
  }, [results]);

  const filteredGroups = useMemo(() => {
    if (activeFilter === "all") return grouped;
    return grouped.filter((g) => g.type === activeFilter);
  }, [grouped, activeFilter]);

  const availableFilters = useMemo(() => {
    const types = new Set(grouped.map((g) => g.type));
    return sectionOrder.filter((t) => types.has(t));
  }, [grouped]);

  // Match against resolved labels and keyword aliases so registered commands
  // remain searchable without changing the palette implementation.
  const matchingCommands = useMemo(() => {
    if (query.length < 2) return commands;
    const normalizedQuery = query.toLowerCase();
    return commands.filter((command) =>
      [command.label, ...command.keywords].some((term) =>
        term.toLowerCase().includes(normalizedQuery),
      ),
    );
  }, [commands, query]);

  const matchingNav = matchingCommands.filter(
    (command) => command.group === "navigation",
  );
  const matchingActions = matchingCommands.filter(
    (command) => command.group !== "navigation",
  );
  const hasMatchingCommands = matchingCommands.length > 0;

  function handleSelect(item: SearchResultItem) {
    onOpenChange(false);
    router.push(item.url);
  }

  function handleRecentClick(q: string) {
    setQuery(q);
  }

  function handleClearRecent(e: React.MouseEvent) {
    e.stopPropagation();
    deleteAllRecent();
    setRecentSearches([]);
  }

  function handleCommand(command: ResolvedCommand) {
    onOpenChange(false);
    void command.execute(commandContext);
  }

  const showHint = query.length >= 1 && query.length < 2 && !loading;
  const showSearching = loading && query.length >= 2;
  const showNoQuickResults =
    !loading &&
    query.length >= 2 &&
    results.length === 0 &&
    !hasMatchingCommands;
  const showQuickItems = !loading && query.length >= 2 && hasMatchingCommands;
  const showFilterEmpty =
    !loading && grouped.length > 0 && filteredGroups.length === 0;
  const showResults = !loading && filteredGroups.length > 0;
  const suggestedQueries = [
    {
      label: t("nav.transactions"),
      query: t("nav.transactions"),
      icon: ArrowUpDown,
    },
    { label: t("nav.budgets"), query: t("nav.budgets"), icon: Wallet },
    { label: t("nav.goals"), query: t("nav.goals"), icon: Target },
  ];

  return (
    <>
      <CommandPaletteOverlay open={open} onClose={() => onOpenChange(false)} />
      <CommandPaletteContainer open={open} onOpenChange={onOpenChange}>
        <Command
          shouldFilter={false}
          label={t("search.placeholder")}
          className="flex max-h-[min(88dvh,720px)] flex-col overflow-hidden bg-background"
        >
          <CommandPaletteInput
            value={query}
            onChange={setQuery}
            placeholder={t("search.placeholder")}
            loading={loading}
          />

          {availableFilters.length > 1 && grouped.length > 0 && (
            <CommandPaletteFilters
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              availableFilters={availableFilters}
              sectionMeta={sectionMeta}
              sectionLabels={sectionLabels}
              t={t}
            />
          )}

          <Command.List className="min-h-0 max-h-[min(64dvh,480px)] overflow-y-auto overscroll-contain py-1.5 sm:max-h-96">
            {query.length === 0 && (
              <>
                <CommandPaletteRecent
                  recentSearches={recentSearches}
                  onRecentClick={handleRecentClick}
                  onClearRecent={handleClearRecent}
                  t={t}
                />
                <CommandPaletteActions
                  navigationCommands={matchingNav}
                  actionCommands={matchingActions}
                  onCommandSelect={handleCommand}
                  t={t}
                />
              </>
            )}

            {showHint && <CommandPaletteEmpty type="hint" t={t} />}

            {showSearching && <CommandPaletteEmpty type="searching" t={t} />}

            {showQuickItems && (
              <CommandPaletteActions
                navigationCommands={matchingNav}
                actionCommands={matchingActions}
                onCommandSelect={handleCommand}
                t={t}
              />
            )}

            {showNoQuickResults && (
              <CommandPaletteEmpty
                type="noResults"
                t={t}
                suggestions={suggestedQueries}
                onSuggestion={setQuery}
              />
            )}

            {showFilterEmpty && (
              <CommandPaletteEmpty
                type="filterEmpty"
                t={t}
                suggestions={suggestedQueries}
                onSuggestion={setQuery}
              />
            )}

            {showResults && (
              <CommandPaletteResults
                filteredGroups={filteredGroups}
                sectionMeta={sectionMeta}
                sectionLabels={sectionLabels}
                query={query}
                locale={locale}
                currency={profile?.currency ?? "USD"}
                onResultSelect={handleSelect}
                t={t}
              />
            )}

            {!showHint &&
              !showSearching &&
              !showNoQuickResults &&
              !showQuickItems &&
              !showFilterEmpty &&
              !showResults &&
              query.length === 0 &&
              recentSearches.length === 0 &&
              !hasMatchingCommands && <div className="h-2" />}
          </Command.List>

          <CommandPaletteFooter t={t} />
        </Command>
      </CommandPaletteContainer>
    </>
  );
}
