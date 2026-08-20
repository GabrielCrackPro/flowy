import { ENTITY_REGISTRY } from "./entity-registry";

export const SINGULAR_QUERY_KEYS: Record<string, string> = Object.fromEntries(
  Object.values(ENTITY_REGISTRY)
    .filter((entity): entity is typeof entity & { singular: string } =>
      Boolean(entity.singular),
    )
    .map((entity) => [entity.key, entity.singular]),
);

export const DEPENDENT_QUERY_KEYS: Record<string, string[]> =
  Object.fromEntries(
    Object.values(ENTITY_REGISTRY).map((entity) => [
      entity.key,
      [...entity.dependencies],
    ]),
  );

export const REALTIME_QUERY_KEYS: Record<string, string[]> = Object.fromEntries(
  Object.values(ENTITY_REGISTRY).map((entity) => [
    entity.key,
    [
      entity.key,
      ...(entity.singular ? [entity.singular] : []),
      ...entity.dependencies,
    ],
  ]),
);

Object.assign(REALTIME_QUERY_KEYS, {
  comments: ["comments"],
  activities: ["activities"],
  profiles: ["profile", "push-preferences", "status-preferences"],
  push_subscriptions: ["push-subscriptions"],
  push_deliveries: ["push-delivery-history", "push-subscriptions"],
  space_members: ["spaces", "profile"],
});
