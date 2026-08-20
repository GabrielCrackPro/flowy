export function inSpace(spaceId: string | null): { spaceId: string | null } {
  return { spaceId };
}

export function entityInSpace(
  id: string,
  spaceId: string | null,
): { id: string; spaceId: string | null } {
  return { id, spaceId };
}
