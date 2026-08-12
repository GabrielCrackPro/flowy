import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata(
  "Settings",
  "Manage your Flowy profile, preferences, security, and notifications.",
  "/dashboard/profile",
);

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
