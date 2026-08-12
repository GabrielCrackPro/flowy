import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata(
  "Transactions",
  "Review and organize all of your income and expenses in Flowy.",
  "/dashboard/transactions",
);

export default function TransactionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
