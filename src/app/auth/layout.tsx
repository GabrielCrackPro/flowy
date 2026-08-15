import { Icon, ThemeToggle } from "@components/shared";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { AuthPageTransition } from "@/components/auth/auth-page-transition";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { FlagsProvider } from "@/context/FlagsProvider";
import { oauthEnabled } from "@/lib/flags";
import { getServerT, LOCALE_COOKIE, normalizeLocale } from "@/lib/i18n";
import {
  Activity,
  BarChart3,
  Droplet,
  Shield,
  Sparkles,
  Wallet,
} from "@/lib/icons";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata(
  "Authentication",
  "Sign in or create your Flowy account to manage your personal finances.",
  "/auth",
);

async function AuthContent({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = normalizeLocale(localeCookie);
  const t = await getServerT(locale, "auth");
  const oauth = await oauthEnabled();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 transition-colors dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 md:p-7">
      <div className="fixed right-4 top-4 z-50 flex items-center gap-1 rounded-xl border border-slate-200/60 bg-white/75 p-1 shadow-sm backdrop-blur-md dark:border-slate-700/60 dark:bg-slate-900/75">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <div className="mx-auto grid min-h-[90vh] max-w-7xl overflow-hidden rounded-3xl border border-slate-200/50 bg-white/80 backdrop-blur-xl shadow-2xl transition-colors dark:border-slate-800/50 dark:bg-slate-900/80 lg:grid-cols-[48%_52%]">
        <aside className="hidden flex-col justify-between bg-gradient-to-br from-primary via-primary/90 to-blue-600 px-12 py-10 text-white lg:flex relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 -right-24 size-96 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-32 -left-32 size-80 rounded-full bg-blue-400/20 blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-64 rounded-full bg-white/5 blur-2xl" />
          </div>

          <div className="relative z-10">
            <div className="mb-16 flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <Icon icon={Droplet} className="size-6" />
                </div>
                <span className="text-2xl font-bold tracking-tight">Flowy</span>
              </div>
              <div className="flex items-center gap-1 text-white/60">
                <Icon icon={Sparkles} className="size-4" />
                <span className="text-sm font-medium">
                  {t("layout.tagline")}
                </span>
              </div>
            </div>

            <div className="max-w-md space-y-8">
              <div>
                <h1 className="text-5xl font-bold leading-tight tracking-tight">
                  {t("layout.title")}
                </h1>
                <p className="mt-6 text-lg leading-7 text-white/80">
                  {t("layout.description")}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
                    <Icon icon={BarChart3} className="size-5" />
                  </div>
                  <div>
                    <p className="font-semibold">
                      {t("layout.smartAnalyticsTitle")}
                    </p>
                    <p className="text-sm text-white/70">
                      {t("layout.smartAnalyticsDesc")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
                    <Icon icon={Wallet} className="size-5" />
                  </div>
                  <div>
                    <p className="font-semibold">
                      {t("layout.budgetControlTitle")}
                    </p>
                    <p className="text-sm text-white/70">
                      {t("layout.budgetControlDesc")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
                    <Icon icon={Shield} className="size-5" />
                  </div>
                  <div>
                    <p className="font-semibold">
                      {t("layout.securePrivateTitle")}
                    </p>
                    <p className="text-sm text-white/70">
                      {t("layout.securePrivateDesc")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main
          id="main"
          className="flex items-center justify-center bg-white/50 px-6 py-12 transition-colors dark:bg-slate-900/50 sm:px-10 lg:px-20 relative"
        >
          <div className="w-full max-w-md text-slate-900 dark:text-slate-100">
            <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-blue-600 text-white shadow-lg shadow-primary/25">
                <Icon icon={Droplet} className="size-6" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-foreground">
                Flowy
              </span>
            </div>

            <div className="flex min-h-0 w-full items-center lg:min-h-[540px]">
              <AuthPageTransition>
                <FlagsProvider flags={{ oauthEnabled: oauth }}>
                  {children}
                </FlagsProvider>
              </AuthPageTransition>
            </div>

            <div className="mt-8 space-y-2 text-center">
              <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground/80">
                <Icon icon={Shield} className="size-3.5" />
                {t("layout.securityNote")}
              </p>
              <a
                href="/status"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary/80 transition hover:text-primary hover:underline underline-offset-2"
              >
                <Icon icon={Activity} className="size-3.5" />
                {t("layout.statusPage")}
              </a>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-background" aria-busy="true" />}
    >
      <AuthContent>{children}</AuthContent>
    </Suspense>
  );
}
