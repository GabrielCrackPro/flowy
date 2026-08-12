"use client";

import {
  AccountSecurityActions,
  ProfileForm,
  PushNotificationsCard,
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
import { changelog } from "@/lib/changelog";
import {
  BookOpen,
  CalendarDays,
  Coins,
  Droplet,
  Globe2,
  Mail,
  Pencil,
  Sparkles,
} from "@/lib/icons";

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

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          {t("nav.settings")}
        </h1>
        <p className="text-muted-foreground">{t("settings.description")}</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.profile.title")}</CardTitle>
            <CardDescription>
              {t("settings.profile.description")}
            </CardDescription>
            {!loading && profile && !editing ? (
              <CardAction>
                <div className="flex gap-2">
                  <ThemeCustomizationSheet />
                  <Button variant="ghost" onClick={() => setEditing(true)}>
                    <Icon icon={Pencil} className="size-4" />
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
                      <UserAvatar profile={profile} size="xl" />
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

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="flex items-center gap-3 rounded-xl border border-border/30 bg-muted/30 px-4 py-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-primary/20 to-primary/10 text-primary">
                            <Icon icon={Mail} className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-muted-foreground">
                              {t("settings.profile.emailLabel")}
                            </p>
                            <p className="truncate text-sm font-medium">
                              {profile.email ?? t("profile.noEmail")}
                            </p>
                          </div>
                        </div>

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

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{profile.currency}</Badge>
                        <Badge variant="outline">
                          {languageName(profile.locale, locale)}
                        </Badge>
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
            <CardTitle>{t("profile.spaces.title")}</CardTitle>
            <CardDescription>{t("profile.spaces.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <SpaceManager />
          </CardContent>
        </Card>

        <PushNotificationsCard />

        <AccountSecurityActions />

        <Card id="about" className="scroll-mt-20">
          <CardHeader>
            <CardTitle>{t("settings.about.title")}</CardTitle>
            <CardDescription>{t("settings.about.description")}</CardDescription>
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
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-md shadow-primary/20 sm:size-14">
                <Icon icon={Droplet} className="size-6 sm:size-7" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-bold tracking-tight">Flowy</p>
                  <Badge variant="secondary">v{changelog.currentVersion}</Badge>
                </div>
                <p className="mt-1 truncate text-xs text-muted-foreground sm:text-sm">
                  {t("settings.about.releasedOn")} {releaseDate}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
