import type { SearchResponse } from "@/types/SearchResult";
import { authenticatedRequest } from "./client";

export async function search(query: string): Promise<SearchResponse> {
  return authenticatedRequest<SearchResponse>(
    `/api/search?q=${encodeURIComponent(query)}`,
  );
}
