import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata(
  "Sign in",
  "Sign in to Flowy to manage your income, expenses, budgets, and savings goals.",
  "/auth/login",
);

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
