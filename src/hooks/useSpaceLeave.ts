"use client";

import { useProfile } from "@/hooks/useProfile";
import { useSpaces } from "@/hooks/useSpaces";
import type { SpaceSummary } from "@/lib/api/space";

/**
 * Shared decision logic for the leave vs delete flow: owners with no other
 * members delete the space, everyone else leaves it. Used by the profile
 * leave dialog and the switcher sheet's inline confirm so the destructive
 * flow never branches in two places.
 */
export function useSpaceLeave(space: SpaceSummary | null) {
  const { profile } = useProfile();
  const { leave, remove } = useSpaces();

  const isOnlyMember = space
    ? space.ownerId === profile?.id && space.members.length <= 1
    : false;

  const handleConfirm = () => {
    if (!space) return;
    if (isOnlyMember) {
      remove.mutate(space.id);
    } else {
      leave.mutate(space.id);
    }
  };

  return {
    isOnlyMember,
    isPending: leave.isPending || remove.isPending,
    handleConfirm,
  };
}
