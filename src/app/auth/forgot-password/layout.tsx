import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata(
  "Reset password",
  "Recover access to your Flowy account securely.",
  "/auth/forgot-password",
);

export default function ForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
