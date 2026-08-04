"use client";

import type { IconProps } from "@components/shared";
import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocaleContext } from "@/context/LocaleContext";
import { useProfile } from "@/hooks/useProfile";
import { useSignOut } from "@/hooks/useSignOut";
import { useTheme } from "@/hooks/useTheme";
import { search } from "@/lib/api/search";
import {
  ArrowUpDown,
  Home,
  LogOut,
  Moon,
  Plus,
  Repeat2,
  Settings,
  Sun,
  Tag,
  Target,
  Wallet,
} from "@/lib/icons";
import type { SearchResultItem } from "@/types/SearchResult";
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

interface QuickAction {
  id: string;
  icon: IconProps["icon"];
  labelKey: string;
  url: string;
  keywords: string[];
}

interface SystemAction {
  id: string;
  icon: IconProps["icon"];
  label: string;
  keywords: string[];
  action: () => void;
}

const quickActions: QuickAction[] = [
  {
    id: "new-transaction",
    icon: Plus,
    labelKey: "header.newTransaction",
    url: "/dashboard/transactions/add",
    keywords: [
      "nueva",
      "nuevo",
      "crear",
      "transacción",
      "transaccion",
      "transaction",
      "add",
      "añadir",
    ],
  },
  {
    id: "new-budget",
    icon: Wallet,
    labelKey: "nav.budgets",
    url: "/dashboard/budgets",
    keywords: ["nuevo", "presupuesto", "presupuest", "budget", "crear", "add"],
  },
  {
    id: "new-goal",
    icon: Target,
    labelKey: "nav.goals",
    url: "/dashboard/goals",
    keywords: [
      "nueva",
      "meta",
      "goal",
      "crear",
      "ahorro",
      "saving",
      "objetivo",
    ],
  },
];

const navActions: QuickAction[] = [
  {
    id: "nav-overview",
    icon: Home,
    labelKey: "nav.overview",
    url: "/dashboard",
    keywords: ["resumen", "inicio", "home", "overview", "ir", "panel"],
  },
  {
    id: "nav-transactions",
    icon: ArrowUpDown,
    labelKey: "nav.transactions",
    url: "/dashboard/transactions",
    keywords: [
      "transacciones",
      "transactions",
      "movimientos",
      "gastos",
      "ingresos",
    ],
  },
  {
    id: "nav-categories",
    icon: Tag,
    labelKey: "nav.categories",
    url: "/dashboard/categories",
    keywords: ["categorías", "categorias", "categories"],
  },
  {
    id: "nav-budgets",
    icon: Wallet,
    labelKey: "nav.budgets",
    url: "/dashboard/budgets",
    keywords: ["presupuestos", "budgets", "presupuesto"],
  },
  {
    id: "nav-goals",
    icon: Target,
    labelKey: "nav.goals",
    url: "/dashboard/goals",
    keywords: ["metas", "goals", "objetivos", "ahorro"],
  },
  {
    id: "nav-subscriptions",
    icon: Repeat2,
    labelKey: "nav.subscriptions",
    url: "/dashboard/subscriptions",
    keywords: ["suscripciones", "subscriptions", "recurrentes"],
  },
  {
    id: "nav-settings",
    icon: Settings,
    labelKey: "nav.settings",
    url: "/dashboard/profile",
    keywords: [
      "configuración",
      "configuracion",
      "settings",
      "ajustes",
      "perfil",
    ],
  },
];

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
  const handleSignOut = useSignOut();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  function handleThemeSelect() {
    const pos = lastPosRef.current;
    lastPosRef.current = null;
    onOpenChange(false);
    toggleTheme(pos ?? undefined);
  }

  const systemActions = useMemo<SystemAction[]>(
    () => [
      {
        id: "toggle-theme",
        icon: isDark ? Sun : Moon,
        label: isDark ? "Modo claro" : "Modo oscuro",
        keywords: [
          "tema",
          "theme",
          "oscuro",
          "claro",
          "dark",
          "light",
          "modo",
          "toggle",
        ],
        action: () => {
          onOpenChange(false);
        },
      },
      {
        id: "sign-out",
        icon: LogOut,
        label: "Cerrar sesión",
        keywords: ["cerrar", "sesión", "sesion", "logout", "signout", "salir"],
        action: async () => {
          onOpenChange(false);
          await handleSignOut();
        },
      },
    ],
    [isDark, onOpenChange, handleSignOut],
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };

    if (open) {
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  useEffect(() => {
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
        setResults(data.results);
        setActiveFilter("all");
        if (data.results.length > 0) {
          saveRecent(query);
          refreshRecent();
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
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

  const matchingNav = useMemo(() => {
    if (query.length < 2) return navActions;
    const q = query.toLowerCase();
    return navActions.filter((a) => a.keywords.some((kw) => kw.includes(q)));
  }, [query]);

  const matchingActions = useMemo(() => {
    if (query.length < 2) return quickActions;
    const q = query.toLowerCase();
    return quickActions.filter((a) => a.keywords.some((kw) => kw.includes(q)));
  }, [query]);

  const matchingSystem = useMemo(() => {
    if (query.length < 2) return systemActions;
    const q = query.toLowerCase();
    return systemActions.filter((a) => a.keywords.some((kw) => kw.includes(q)));
  }, [query, systemActions]);

  const hasMatchingQuick =
    matchingNav.length > 0 ||
    matchingActions.length > 0 ||
    matchingSystem.length > 0;

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

  function handleAction(action: QuickAction) {
    onOpenChange(false);
    router.push(action.url);
  }

  function handleSystemAction(action: (typeof systemActions)[number]) {
    action.action();
  }

  const showHint = query.length >= 1 && query.length < 2 && !loading;
  const showSearching = loading && query.length >= 2;
  const showNoQuickResults =
    !loading && query.length >= 2 && results.length === 0 && !hasMatchingQuick;
  const showQuickItems = !loading && query.length >= 2 && hasMatchingQuick;
  const showFilterEmpty =
    !loading && grouped.length > 0 && filteredGroups.length === 0;
  const showResults = !loading && filteredGroups.length > 0;

  return (
    <>
      <CommandPaletteOverlay open={open} onClose={() => onOpenChange(false)} />
      <CommandPaletteContainer open={open}>
        <Command
          shouldFilter={false}
          label="Buscar en Flowy"
          className="overflow-hidden bg-background"
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

          <Command.List className="max-h-96 overflow-y-auto overscroll-contain py-1.5">
            {query.length === 0 && (
              <>
                <CommandPaletteRecent
                  recentSearches={recentSearches}
                  onRecentClick={handleRecentClick}
                  onClearRecent={handleClearRecent}
                  t={t}
                />
                <CommandPaletteActions
                  navActions={matchingNav}
                  quickActions={matchingActions}
                  systemActions={matchingSystem}
                  onActionSelect={handleAction}
                  onSystemActionSelect={handleSystemAction}
                  onThemeSelect={handleThemeSelect}
                  t={t}
                />
              </>
            )}

            {showHint && <CommandPaletteEmpty type="hint" t={t} />}

            {showSearching && <CommandPaletteEmpty type="searching" t={t} />}

            {showQuickItems && (
              <CommandPaletteActions
                navActions={matchingNav}
                quickActions={matchingActions}
                systemActions={matchingSystem}
                onActionSelect={handleAction}
                onSystemActionSelect={handleSystemAction}
                onThemeSelect={handleThemeSelect}
                t={t}
              />
            )}

            {showNoQuickResults && (
              <CommandPaletteEmpty type="noResults" t={t} />
            )}

            {showFilterEmpty && (
              <CommandPaletteEmpty type="filterEmpty" t={t} />
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
              !hasMatchingQuick && <div className="h-2" />}
          </Command.List>

          <CommandPaletteFooter t={t} />
        </Command>
      </CommandPaletteContainer>
    </>
  );
}
