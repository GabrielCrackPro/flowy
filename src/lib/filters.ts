export function filtersToQueryParams(
  filters: Record<string, string | undefined>,
): Record<string, string> {
  const query: Record<string, string> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") {
      if (key === "dateFrom") query.from = value;
      else if (key === "dateTo") query.to = value;
      else query[key] = value;
    }
  }
  return query;
}
