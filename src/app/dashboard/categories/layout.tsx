import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata(
  "Categories",
  "Organize transactions into categories to understand your spending.",
  "/dashboard/categories",
);

export default function CategoriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
