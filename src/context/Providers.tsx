"use client";

import { NotificationProvider } from "@context/NotificationProvider";
import { ProfileProvider } from "@context/ProfileContext";
import { ThemeProvider } from "@context/ThemeContext";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider as NextThemeProvider } from "next-themes";
import { queryClient } from "@/lib/react-query";
import { LocaleProvider } from "./LocaleContext";
import { PhantomProvider } from "./PhantomProvider";
import { RealtimeSyncProvider } from "./RealtimeSyncProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <NextThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <ProfileProvider>
          <ThemeProvider>
            <LocaleProvider>
              <PhantomProvider>
                <NotificationProvider>
                  <RealtimeSyncProvider>{children}</RealtimeSyncProvider>
                </NotificationProvider>
              </PhantomProvider>
            </LocaleProvider>
          </ThemeProvider>
        </ProfileProvider>
      </NextThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
