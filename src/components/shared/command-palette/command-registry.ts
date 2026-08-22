"use client";

import { useSyncExternalStore } from "react";
import {
  ArrowUpDown,
  Home,
  LogOut,
  Moon,
  Plus,
  Repeat2,
  Settings,
  Sparkles,
  Sun,
  Tag,
  Target,
  Wallet,
} from "@/lib/icons";
import type { IconProps } from "../icon";

export type CommandGroup = "navigation" | "actions" | "system";
export type CommandTranslate = (key: string) => string;

export interface CommandContext {
  t: CommandTranslate;
  isDark: boolean;
  close: () => void;
  navigate: (url: string) => void;
  toggleTheme: () => void;
  openChangelog: () => void;
  openAssistant: () => void;
  resetOnboarding: () => void | Promise<void>;
  signOut: () => void | Promise<void>;
}

export interface CommandDefinition {
  id: string;
  group: CommandGroup;
  icon: IconProps["icon"];
  getIcon?: (context: CommandContext) => IconProps["icon"];
  labelKey?: string;
  getLabel?: (context: CommandContext) => string;
  keywordKeys: string[];
  getKeywordKeys?: (context: CommandContext) => string[];
  execute: (context: CommandContext) => void | Promise<void>;
  showChevron?: boolean;
}

export interface ResolvedCommand extends CommandDefinition {
  label: string;
  keywords: string[];
}

const registry = new Map<string, CommandDefinition>();
let snapshot: readonly CommandDefinition[] = [];
const listeners = new Set<() => void>();

function publish() {
  snapshot = Array.from(registry.values());
  for (const listener of listeners) listener();
}

export function registerCommand(command: CommandDefinition) {
  registry.set(command.id, command);
  publish();

  return () => {
    if (registry.get(command.id) === command) {
      registry.delete(command.id);
      publish();
    }
  };
}

export function getCommandRegistry() {
  return snapshot;
}

export function resolveCommand(
  command: CommandDefinition,
  context: CommandContext,
): ResolvedCommand {
  return {
    ...command,
    icon: command.getIcon?.(context) ?? command.icon,
    label:
      command.getLabel?.(context) ??
      (command.labelKey ? context.t(command.labelKey) : command.id),
    keywords: [
      ...command.keywordKeys.map((key) => context.t(key)),
      ...(command.getKeywordKeys?.(context) ?? []).map((key) => context.t(key)),
    ],
  };
}

export function useCommandRegistry() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getCommandRegistry,
    getCommandRegistry,
  );
}

function registerBuiltInCommands() {
  const commands: CommandDefinition[] = [
    {
      id: "nav-overview",
      group: "navigation",
      icon: Home,
      labelKey: "nav.overview",
      keywordKeys: ["nav.overview", "header.home"],
      execute: ({ navigate }) => navigate("/dashboard"),
      showChevron: true,
    },
    {
      id: "nav-transactions",
      group: "navigation",
      icon: ArrowUpDown,
      labelKey: "nav.transactions",
      keywordKeys: [
        "nav.transactions",
        "transactions.description",
        "transactions.expenses",
        "transactions.income",
      ],
      execute: ({ navigate }) => navigate("/dashboard/transactions"),
      showChevron: true,
    },
    {
      id: "nav-categories",
      group: "navigation",
      icon: Tag,
      labelKey: "nav.categories",
      keywordKeys: ["nav.categories", "categories.description"],
      execute: ({ navigate }) => navigate("/dashboard/categories"),
      showChevron: true,
    },
    {
      id: "nav-budgets",
      group: "navigation",
      icon: Wallet,
      labelKey: "nav.budgets",
      keywordKeys: ["nav.budgets", "budgets.description"],
      execute: ({ navigate }) => navigate("/dashboard/budgets"),
      showChevron: true,
    },
    {
      id: "nav-goals",
      group: "navigation",
      icon: Target,
      labelKey: "nav.goals",
      keywordKeys: ["nav.goals", "goals.description"],
      execute: ({ navigate }) => navigate("/dashboard/goals"),
      showChevron: true,
    },
    {
      id: "nav-subscriptions",
      group: "navigation",
      icon: Repeat2,
      labelKey: "nav.subscriptions",
      keywordKeys: ["nav.subscriptions", "subscriptions.pageDescription"],
      execute: ({ navigate }) => navigate("/dashboard/subscriptions"),
      showChevron: true,
    },
    {
      id: "nav-settings",
      group: "navigation",
      icon: Settings,
      labelKey: "nav.settings",
      keywordKeys: ["nav.settings", "header.profile", "settings.description"],
      execute: ({ navigate }) => navigate("/dashboard/profile"),
      showChevron: true,
    },
    {
      id: "new-transaction",
      group: "actions",
      icon: Plus,
      labelKey: "header.newTransaction",
      keywordKeys: [
        "header.newTransaction",
        "transaction.pageTitle",
        "transactions.title",
      ],
      execute: ({ navigate }) => navigate("/dashboard/transactions/add"),
      showChevron: true,
    },
    {
      id: "new-budget",
      group: "actions",
      icon: Wallet,
      labelKey: "budgets.new",
      keywordKeys: ["budgets.new", "nav.budgets"],
      execute: ({ navigate }) => navigate("/dashboard/budgets"),
      showChevron: true,
    },
    {
      id: "new-goal",
      group: "actions",
      icon: Target,
      labelKey: "goals.new",
      keywordKeys: ["goals.new", "nav.goals"],
      execute: ({ navigate }) => navigate("/dashboard/goals"),
      showChevron: true,
    },
    {
      id: "toggle-theme",
      group: "system",
      icon: Moon,
      getIcon: ({ isDark }) => (isDark ? Sun : Moon),
      getLabel: ({ isDark, t }) =>
        isDark ? t("search.themeLight") : t("search.themeDark"),
      keywordKeys: ["search.themeLight", "search.themeDark"],
      execute: ({ toggleTheme }) => toggleTheme(),
      showChevron: true,
    },
    {
      id: "replay-onboarding",
      group: "system",
      icon: Sparkles,
      labelKey: "settings.preferences.replayOnboarding",
      keywordKeys: [
        "settings.preferences.replayOnboarding",
        "settings.preferences.replayOnboardingHint",
        "onboarding.welcomeTitle",
      ],
      execute: ({ resetOnboarding }) => void resetOnboarding(),
      showChevron: true,
    },
    {
      id: "whats-new",
      group: "system",
      icon: Sparkles,
      labelKey: "search.whatsNew",
      keywordKeys: ["search.whatsNew"],
      execute: ({ openChangelog }) => openChangelog(),
      showChevron: true,
    },
    {
      id: "ask-assistant",
      group: "actions",
      icon: Sparkles,
      labelKey: "assistant.openFromPalette",
      keywordKeys: [
        "assistant.openFromPalette",
        "assistant.title",
        "assistant.emptyTitle",
      ],
      execute: ({ openAssistant }) => openAssistant(),
      showChevron: true,
    },
    {
      id: "sign-out",
      group: "system",
      icon: LogOut,
      labelKey: "search.signOut",
      keywordKeys: ["search.signOut", "profile.signOut"],
      execute: ({ signOut }) => signOut(),
      showChevron: true,
    },
  ];

  for (const command of commands) registerCommand(command);
}

registerBuiltInCommands();
