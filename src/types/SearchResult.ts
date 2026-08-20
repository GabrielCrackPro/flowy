export interface SearchResultItem {
  id: string;
  type: "transaction" | "category" | "budget" | "goal" | "subscription";
  title: string;
  subtitle: string | null;
  url: string;
  amount?: number;
}

export interface SearchResponse {
  query: string;
  results: SearchResultItem[];
  total: number;
  nextCursor?: string;
}
