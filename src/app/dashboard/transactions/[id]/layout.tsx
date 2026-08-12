import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Transaction details",
  description: "Review the details of a transaction in Flowy.",
};

export default function TransactionDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
