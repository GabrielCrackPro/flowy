import type { Metadata } from "next";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://flowy-jade.vercel.app";

const APP_ICON = "/app-icon.svg";
const SITE_DESCRIPTION =
  "Flowy is a simple personal finance manager for tracking income, expenses, budgets, goals, and subscriptions.";

const socialImage = {
  url: APP_ICON,
  width: 512,
  height: 512,
  alt: "Flowy app icon",
};

export const siteMetadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Flowy",
    template: "%s | Flowy",
  },
  description: SITE_DESCRIPTION,
  applicationName: "Flowy",
  keywords: [
    "personal finance",
    "budget tracker",
    "expense tracker",
    "savings goals",
    "subscriptions",
  ],
  creator: "Gabriel Vargas (@GabrielCrackPro)",
  publisher: "Gabriel Vargas (@GabrielCrackPro)",
  category: "finance",
  referrer: "origin-when-cross-origin",
  robots: {
    index: false,
    follow: false,
  },
  icons: {
    icon: [
      {
        url: "/favicon-light.svg",
        type: "image/svg+xml",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/favicon-dark.svg",
        type: "image/svg+xml",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon-180.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  openGraph: {
    type: "website",
    siteName: "Flowy",
    title: "Flowy",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    images: [socialImage],
  },
  twitter: {
    card: "summary",
    title: "Flowy",
    description: SITE_DESCRIPTION,
    images: [APP_ICON],
  },
  appleWebApp: {
    capable: true,
    title: "Flowy",
    statusBarStyle: "default",
  },
};

export function createPageMetadata(
  title: string,
  description: string,
  pathname: string,
): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: pathname,
    },
    openGraph: {
      type: "website",
      siteName: "Flowy",
      title,
      description,
      url: pathname,
      images: [socialImage],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [APP_ICON],
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}
