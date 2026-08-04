import { authenticatedRequest } from "@/lib/api/client";
import type { DashboardData } from "@/types/Dashboard";

export function getDashboardData(month?: number, year?: number) {
  const params = new URLSearchParams();
  if (month != null) params.set("month", String(month));
  if (year != null) params.set("year", String(year));
  const query = params.toString();
  return authenticatedRequest<DashboardData>(
    `/api/dashboard${query ? `?${query}` : ""}`,
  );
}
