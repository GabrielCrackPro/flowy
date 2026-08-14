"use client";

import { BackHeader } from "@components/dashboard";
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
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useSpaces } from "@/hooks/useSpaces";
import {
  type ChangelogItem,
  type ChangelogSection,
  changelog,
} from "@/lib/changelog";
import { scopeColor } from "@/lib/changelog/scope";
import {
  Activity,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Coins,
  Crown,
  Droplet,
  ExternalLink,
  GitBranch,
  Globe2,
  Info,
  Palette,
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
    <span className="flex size-6 shrink-0 items-center justify-center text-muted-foreground">
      <Icon icon={icon} className="size-4" />
    </span>
  );
}

function SpaceOverviewAvatar({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl?: string | null;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-linear-to-br from-violet-500 to-violet-600 text-sm font-semibold text-white shadow-sm shadow-violet-500/20">
      {avatarUrl && !imageFailed ? (
        /* biome-ignore lint/performance/noImgElement: Avatars are served from Supabase public storage. */
        <img
          src={avatarUrl}
          alt={name}
          className="size-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : name ? (
        name.trim().charAt(0).toUpperCase()
      ) : (
        <Users className="size-4" />
      )}
    </span>
  );
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const { locale } = useLocaleContext();
  const { profile, loading } = useProfile();
  const { activeSpace } = useSpaces();
  const { checked: pushChecked, subscribed } = usePushNotifications();
  const { openChangelog } = useChangelog();
  const [editing, setEditing] = useState(false);

  const hasCustomTheme = Boolean(
    profile?.primaryColor || profile?.secondaryColor || profile?.accentColor,
  );

  const memberSince = profile?.createdAt
    ? new Intl.DateTimeFormat(locale, {
        month: "long",
        year: "numeric",
      }).format(new Date(profile.createdAt))
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
    <div className="mx-auto min-w-0 max-w-6xl space-y-5 sm:space-y-6">
      <div className="space-y-2">
        <BackHeader title={t("nav.settings")} href="/dashboard" />
        <p className="pl-12 text-sm text-muted-foreground sm:pl-14">
          {t("settings.description")}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start lg:gap-6">
        <SettingsNav />

        <div className="grid min-w-0 gap-5">
          <Card id="profile" className="scroll-mt-20">
            <CardHeader className="gap-3 pb-4 sm:pb-5">
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
                  <div className="flex justify-end gap-1.5">
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
                    <div className="space-y-5">
                      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                        <UserAvatar
                          profile={profile}
                          size="xl"
                          className="size-16 text-xl ring-4 ring-primary/10 sm:size-20 sm:text-2xl"
                        />
                        <div className="min-w-0">
                          <h2 className="truncate text-xl font-semibold tracking-tight">
                            {profile.name ?? t("profile.user")}
                          </h2>
                          <p className="mt-0.5 truncate text-sm text-muted-foreground">
                            {profile.email ?? t("profile.noEmail")}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 rounded-xl bg-muted/25 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-3.5">
                        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <SpaceOverviewAvatar
                              name={activeSpace?.name ?? ""}
                              avatarUrl={activeSpace?.avatarUrl}
                            />
                            <div className="min-w-0">
                              <span className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                                {t("settings.profile.activeSpace")}
                              </span>
                              <span className="block max-w-52 truncate text-sm font-semibold text-foreground">
                                {activeSpace?.name ??
                                  t("profile.spaces.noSpace")}
                              </span>
                            </div>
                          </div>
                          {activeSpace ? (
                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1.5">
                                <Users className="size-3.5" />
                                {t(
                                  activeSpace.members.length === 1
                                    ? "profile.spaces.member_one"
                                    : "profile.spaces.member_other",
                                  { count: activeSpace.members.length },
                                )}
                              </span>
                              <Badge
                                variant="outline"
                                className="h-6 gap-1 border-amber-500/25 px-2 text-[10px] text-amber-600 dark:text-amber-400"
                              >
                                <Crown className="size-3" />
                                {activeSpace.ownerId === profile.id
                                  ? t("profile.spaces.roleOwner")
                                  : t("profile.spaces.roleMember")}
                              </Badge>
                            </div>
                          ) : null}
                        </div>
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="w-full shrink-0 gap-1.5 sm:w-auto"
                        >
                          <Link href="#spaces">
                            <Users className="size-3.5" />
                            <span>{t("profile.spaces.manageSpaces")}</span>
                          </Link>
                        </Button>
                      </div>

                      <div className="grid gap-x-4 gap-y-1.5 sm:grid-cols-2 xl:grid-cols-3">
                        <div className="flex items-center gap-3 px-1 py-2.5">
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

                        <div className="flex items-center gap-3 px-1 py-2.5">
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

                        <div className="flex items-center gap-3 px-1 py-2.5">
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

                        <div className="flex items-center gap-3 px-1 py-2.5">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-emerald-500/20 to-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <Icon
                              icon={subscribed ? CheckCircle2 : Bell}
                              className="size-4"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">
                              {t("settings.profile.notificationStatus")}
                            </p>
                            <p className="truncate text-sm font-medium">
                              {pushChecked && subscribed
                                ? t("settings.notifications.enabled")
                                : t("settings.notifications.disabled")}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 px-1 py-2.5">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-sky-500/20 to-sky-500/10 text-sky-600 dark:text-sky-400">
                            <Icon icon={Palette} className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">
                              {t("settings.profile.themeSummary")}
                            </p>
                            <p className="truncate text-sm font-medium">
                              {hasCustomTheme
                                ? t("settings.theme.customize")
                                : t("settings.theme.default")}
                            </p>
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
                <div className="flex flex-wrap justify-end gap-2">
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
            <CardContent className="space-y-4">
              {/* Brand hero */}
              <div className="flex items-center gap-3 border-b border-border/40 pb-4">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon icon={Droplet} className="size-5" />
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
                </div>
              </div>

              {/* Latest release preview */}
              {latestEntry && (
                <div className="border-b border-border/40 pb-4">
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
                <Button asChild variant="outline" size="sm">
                  <Link href="/status">
                    <Icon icon={Activity} className="size-4" />
                    {t("settings.about.status")}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
