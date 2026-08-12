import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata(
  "Budgets",
  "Set spending limits and keep your monthly finances on track with Flowy.",
  "/dashboard/budgets",
);

export default function BudgetsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
