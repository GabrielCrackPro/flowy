import "@aejkatappaja/phantom-ui";
import "@aejkatappaja/phantom-ui/ssr.css";
import "./globals.css";

import type { Viewport } from "next";
import { Geist } from "next/font/google";
import { Favicon } from "@/components/shared/favicon";
import { ServiceWorkerRegister } from "@/components/shared/service-worker-register";
import { SkipLink } from "@/components/shared/skip-link";
import { Providers } from "@/context";
import { siteMetadata } from "@/lib/metadata";
import { cn } from "@/lib/utils";

// Optimize font loading with display swap for better LCP
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  preload: true,
});

export const metadata = siteMetadata;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full antialiased", geist.variable)}
    >
      <body className="min-h-full bg-background text-foreground">
        <Providers>
          <SkipLink />
          <Favicon />
          <ServiceWorkerRegister />
          <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_42%)]">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
