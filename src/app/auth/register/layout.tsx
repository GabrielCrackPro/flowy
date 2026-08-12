import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata(
  "Create account",
  "Create a Flowy account and start organizing your personal finances.",
  "/auth/register",
);

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
