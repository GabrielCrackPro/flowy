import type { QueryClient } from "@tanstack/react-query";
import { SINGULAR_QUERY_KEYS } from "@/lib/entity-query-keys";
import {
  getEntityDefinition,
  getEntityDependencies,
} from "@/lib/entity-registry";

export function invalidateEntityQueries(
  queryClient: QueryClient,
  entityKey: string,
  options: { includeDependencies?: boolean } = {},
) {
  const definition = getEntityDefinition(entityKey);
  void queryClient.invalidateQueries({ queryKey: [entityKey] });

  const singular = SINGULAR_QUERY_KEYS[entityKey];
  if (singular) {
    void queryClient.invalidateQueries({ queryKey: [singular] });
  }

  if (options.includeDependencies !== false) {
    for (const dependency of getEntityDependencies(entityKey)) {
      void queryClient.invalidateQueries({ queryKey: [dependency] });
    }
  }

  return definition;
}
