import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata(
  "Subscriptions",
  "Track recurring payments and understand your monthly subscription spending.",
  "/dashboard/subscriptions",
);

export default function SubscriptionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
