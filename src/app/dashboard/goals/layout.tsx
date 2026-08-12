import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata(
  "Savings goals",
  "Create savings goals and track your progress with Flowy.",
  "/dashboard/goals",
);

export default function GoalsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
