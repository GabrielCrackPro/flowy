import { authenticatedRequest } from "./client";

type QueryParams = Record<string, string | number | boolean | undefined>;

function buildQuery(filters?: QueryParams): string {
  if (!filters) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined) params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function createApi<T, F = QueryParams>(basePath: string) {
  const methods = {
    list: (filters?: F) =>
      authenticatedRequest<T[]>(
        `${basePath}${buildQuery(filters as QueryParams)}`,
      ),

    get: (id: string) => authenticatedRequest<T>(`${basePath}/${id}`),

    create: (data: unknown) =>
      authenticatedRequest<T>(basePath, {
        method: "POST",
        body: JSON.stringify(data),
      }),

    update: (id: string, data: unknown) =>
      authenticatedRequest<T>(`${basePath}/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      authenticatedRequest<void>(`${basePath}/${id}`, {
        method: "DELETE",
      }),
  };

  for (const [name, fn] of Object.entries(methods)) {
    Object.defineProperty(fn, "name", {
      value: `${basePath}.${name}`,
      configurable: true,
    });
  }

  return methods;
}
