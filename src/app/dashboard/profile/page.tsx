"use client";

import {
  AccountSecurityActions,
  ProfileForm,
  PushNotificationsCard,
  SettingsNav,
  SpaceManager,
} from "@components/profile";
import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ThemeCustomizationSheet } from "@/components/profile/theme-customization-modal";
import { Animated, Icon, Skeleton, UserAvatar } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useChangelog } from "@/context/ChangelogContext";
import { useLocaleContext } from "@/context/LocaleContext";
import { useProfile } from "@/hooks/useProfile";
import {
  type ChangelogItem,
  type ChangelogSection,
  changelog,
} from "@/lib/changelog";
import { scopeColor } from "@/lib/changelog/scope";
import {
  BookOpen,
  CalendarDays,
  Coins,
  Droplet,
  ExternalLink,
  GitBranch,
  Globe2,
  Info,
  Pencil,
  Sparkles,
  UserRound,
  Users,
} from "@/lib/icons";

const GITHUB_URL = "https://github.com/GabrielCrackPro/flowy";
const CHANGELOG_URL = `${GITHUB_URL}/blob/main/CHANGELOG.md`;

function currencyName(code: string, locale: string): string {
  try {
    return (
      new Intl.DisplayNames([locale], { type: "currency" }).of(code) ?? code
    );
  } catch {
    return code;
  }
}

function languageName(code: string, locale: string): string {
  try {
    return (
      new Intl.DisplayNames([locale], { type: "language" }).of(code) ?? code
    );
  } catch {
    return code;
  }
}

function SectionIcon({ icon }: { icon: typeof UserRound }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-primary/20 to-primary/10 text-primary">
      <Icon icon={icon} className="size-4" />
    </span>
  );
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const { locale } = useLocaleContext();
  const { profile, loading } = useProfile();
  const { openChangelog } = useChangelog();
  const [editing, setEditing] = useState(false);

  const memberSince = profile?.createdAt
    ? new Intl.DateTimeFormat(locale, {
        month: "long",
        year: "numeric",
      }).format(new Date(profile.createdAt))
    : "";

  const releaseDate = changelog.entries[0]?.date
    ? new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(changelog.entries[0].date))
    : "";

  // Latest release preview — flatten the newest entry's sections into a
  // compact list (scoped badges, feature/fix dots) for the About card.
  const latestEntry = changelog.entries[0] ?? null;
  const latestItems = latestEntry
    ? latestEntry.sections
        .flatMap((section: ChangelogSection) =>
          section.items.map((item: ChangelogItem) => ({
            ...item,
            sectionType: section.type,
          })),
        )
        .slice(0, 4)
    : [];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          {t("nav.settings")}
        </h1>
        <p className="text-muted-foreground">{t("settings.description")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start">
        <SettingsNav />

        <div className="grid gap-6">
          <Card id="profile" className="scroll-mt-20">
            <CardHeader>
              <div className="flex items-start gap-3">
                <SectionIcon icon={UserRound} />
                <div className="min-w-0">
                  <CardTitle>{t("settings.profile.title")}</CardTitle>
                  <CardDescription>
                    {t("settings.profile.description")}
                  </CardDescription>
                </div>
              </div>
              {!loading && profile && !editing ? (
                <CardAction>
                  <div className="flex items-center gap-1.5">
                    <ThemeCustomizationSheet label />
                    <Button
                      variant="ghost"
                      onClick={() => setEditing(true)}
                      className="gap-1.5"
                    >
                      <Icon icon={Pencil} className="size-4" />
                      <span className="hidden sm:inline">
                        {t("settings.profile.edit")}
                      </span>
                    </Button>
                  </div>
                </CardAction>
              ) : null}
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center gap-4">
                  <div className="size-16">
                    <Skeleton variant="circular" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-48">
                      <Skeleton />
                    </div>
                    <div className="h-3 w-32">
                      <Skeleton />
                    </div>
                  </div>
                </div>
              ) : profile ? (
                <Animated.div
                  key={editing ? "edit" : "view"}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {editing ? (
                    <ProfileForm
                      profile={profile}
                      onCancel={() => setEditing(false)}
                      onSuccess={() => setEditing(false)}
                    />
                  ) : (
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                      <div className="flex shrink-0 justify-center">
                        <UserAvatar
                          profile={profile}
                          size="xl"
                          className="ring-4 ring-primary/10"
                        />
                      </div>

                      <div className="min-w-0 flex-1 space-y-5">
                        <div>
                          <h2 className="text-xl font-semibold tracking-tight">
                            {profile.name ?? t("profile.user")}
                          </h2>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {profile.email ?? t("profile.noEmail")}
                          </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                          <div className="flex items-center gap-3 rounded-xl border border-border/30 bg-muted/30 px-4 py-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-primary/20 to-primary/10 text-primary">
                              <Icon icon={Coins} className="size-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground">
                                {t("settings.profile.currencyLabel")}
                              </p>
                              <p className="truncate text-sm font-medium">
                                {profile.currency} ·{" "}
                                {currencyName(profile.currency, locale)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 rounded-xl border border-border/30 bg-muted/30 px-4 py-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-primary/20 to-primary/10 text-primary">
                              <Icon icon={Globe2} className="size-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground">
                                {t("settings.profile.localeLabel")}
                              </p>
                              <p className="truncate text-sm font-medium">
                                {languageName(profile.locale, locale)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 rounded-xl border border-border/30 bg-muted/30 px-4 py-3">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-primary/20 to-primary/10 text-primary">
                              <Icon icon={CalendarDays} className="size-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground">
                                {t("settings.profile.memberSince")}
                              </p>
                              <p className="truncate text-sm font-medium">
                                {memberSince || "—"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Animated.div>
              ) : null}
            </CardContent>
          </Card>

          <Card id="spaces" className="scroll-mt-20">
            <CardHeader>
              <div className="flex items-start gap-3">
                <SectionIcon icon={Users} />
                <div className="min-w-0">
                  <CardTitle>{t("profile.spaces.title")}</CardTitle>
                  <CardDescription>
                    {t("profile.spaces.description")}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <SpaceManager />
            </CardContent>
          </Card>

          <div id="notifications" className="scroll-mt-20">
            <PushNotificationsCard />
          </div>

          <div id="security" className="scroll-mt-20">
            <AccountSecurityActions />
          </div>

          <Card id="about" className="scroll-mt-20">
            <CardHeader>
              <div className="flex items-start gap-3">
                <SectionIcon icon={Info} />
                <div className="min-w-0">
                  <CardTitle>{t("settings.about.title")}</CardTitle>
                  <CardDescription>
                    {t("settings.about.description")}
                  </CardDescription>
                </div>
              </div>
              <CardAction>
                <div className="flex flex-wrap gap-2">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="px-2.5 sm:px-3"
                  >
                    <Link href="/api/docs" target="_blank" rel="noreferrer">
                      <Icon icon={BookOpen} className="size-4" />
                      <span className="hidden sm:inline">
                        {t("settings.apiDocs.open")}
                      </span>
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="px-2.5 sm:px-3"
                    onClick={openChangelog}
                  >
                    <Sparkles className="size-4" />
                    <span className="hidden sm:inline">
                      {t("settings.about.whatNew")}
                    </span>
                  </Button>
                </div>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Brand hero */}
              <div className="flex items-center gap-4">
                <div className="relative flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lg shadow-primary/20 sm:size-16">
                  <Icon icon={Droplet} className="size-7 sm:size-8" />
                  <span className="pointer-events-none absolute -inset-1 -z-10 rounded-3xl bg-primary/20 blur-xl" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-bold tracking-tight sm:text-xl">
                      Flowy
                    </p>
                    <Badge variant="secondary" className="tabular-nums">
                      v{changelog.currentVersion}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("settings.about.tagline")}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground/70">
                    <Icon icon={CalendarDays} className="size-3.5" />
                    {t("settings.about.releasedOn")} {releaseDate}
                  </p>
                </div>
              </div>

              {/* Latest release preview */}
              {latestEntry && (
                <div className="rounded-2xl border border-border/40 bg-muted/20 p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-primary">
                      <Sparkles className="size-3.5" />
                      {t("settings.about.latestRelease")}
                    </span>
                    {/* Only repeat the version when it's not the current one
                        (the hero badge already shows it). */}
                    {latestEntry.version !== changelog.currentVersion && (
                      <span className="text-sm font-semibold tabular-nums">
                        v{latestEntry.version}
                      </span>
                    )}
                  </div>
                  <ul className="space-y-1.5">
                    {latestItems.map((item, index) => (
                      <li
                        // biome-ignore lint/suspicious/noArrayIndexKey: changelog items lack a stable id
                        key={index}
                        className="flex items-start gap-2.5"
                      >
                        <span
                          className={`mt-1.5 size-1.5 shrink-0 rounded-sm ${
                            item.sectionType === "features"
                              ? "bg-primary/60"
                              : "bg-emerald-500/60"
                          }`}
                        />
                        {item.scope ? (
                          <Badge
                            variant="outline"
                            className={`shrink-0 border px-1 py-0 font-mono text-[10px] leading-snug ${scopeColor(item.scope)}`}
                          >
                            {item.scope}
                          </Badge>
                        ) : null}
                        <span className="min-w-0 text-sm text-muted-foreground">
                          {item.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Links */}
              <div className="flex flex-wrap gap-2 border-t border-border/50 pt-4">
                <Button asChild variant="outline" size="sm">
                  <a href={GITHUB_URL} target="_blank" rel="noreferrer">
                    <Icon icon={GitBranch} className="size-4" />
                    {t("settings.about.github")}
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <a href={CHANGELOG_URL} target="_blank" rel="noreferrer">
                    <Icon icon={ExternalLink} className="size-4" />
                    {t("changelog.viewFull")}
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
