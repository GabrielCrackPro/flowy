"use client";

import { ChangelogProvider } from "@context/ChangelogContext";
import { NotificationProvider } from "@context/NotificationProvider";
import { OfflineProvider } from "@context/OfflineProvider";
import { ProfileProvider } from "@context/ProfileContext";
import { ThemeProvider } from "@context/ThemeContext";
import { QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import { ThemeProvider as NextThemeProvider } from "next-themes";
import { queryClient } from "@/lib/react-query";
import { LocaleProvider } from "./LocaleContext";
import { PhantomProvider } from "./PhantomProvider";
import { RealtimeSyncProvider } from "./RealtimeSyncProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <NextThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ProfileProvider>
            <ThemeProvider>
              <LocaleProvider>
                <ChangelogProvider>
                  <OfflineProvider>
                    <PhantomProvider>
                      <NotificationProvider>
                        <RealtimeSyncProvider>{children}</RealtimeSyncProvider>
                      </NotificationProvider>
                    </PhantomProvider>
                  </OfflineProvider>
                </ChangelogProvider>
              </LocaleProvider>
            </ThemeProvider>
          </ProfileProvider>
        </NextThemeProvider>
      </MotionConfig>
    </QueryClientProvider>
  );
}
