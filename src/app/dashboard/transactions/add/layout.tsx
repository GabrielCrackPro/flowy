import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata(
  "New transaction",
  "Record a new income or expense in Flowy.",
  "/dashboard/transactions/add",
);

export default function NewTransactionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
