"use client";

import { NotificationProvider } from "@context/NotificationProvider";
import { ProfileProvider } from "@context/ProfileContext";
import { ThemeProvider } from "@context/ThemeContext";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@/lib/react-query";
import { LocaleProvider } from "./LocaleContext";
import { PhantomProvider } from "./PhantomProvider";
import { ThemeProvider as NextThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <NextThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <ProfileProvider>
          <ThemeProvider>
            <LocaleProvider>
              <PhantomProvider>
                <NotificationProvider>{children}</NotificationProvider>
              </PhantomProvider>
            </LocaleProvider>
          </ThemeProvider>
        </ProfileProvider>
      </NextThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
