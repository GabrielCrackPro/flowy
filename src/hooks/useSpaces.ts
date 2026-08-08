"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/components/shared/toast";

import { useProfile } from "@/hooks/useProfile";
import {
  createSpace,
  deleteSpace,
  getSpaces,
  joinSpace,
  leaveSpace,
  removeMember as removeMemberApi,
  type SpaceSummary,
  setActiveSpace,
  updateSpaceName,
} from "@/lib/api/space";

export function useSpaces() {
  const queryClient = useQueryClient();
  const { profile } = useProfile();

  const userId = profile?.id;
  const activeSpaceId = profile?.activeSpaceId ?? null;

  const {
    data: spaces = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["spaces", userId],
    queryFn: getSpaces,
    enabled: !!userId,
    // The spaces table is not on the realtime publication (no filterable
    // column), so poll as a fallback like the other entities to keep renames
    // and membership changes in shared spaces fresh.
    staleTime: 30000,
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
  });

  const invalidateSpaces = async () => {
    await queryClient.invalidateQueries({ queryKey: ["spaces", userId] });
    await queryClient.invalidateQueries({ queryKey: ["profile", userId] });
  };

  const resetEntityQueries = async () => {
    await queryClient.resetQueries({ queryKey: ["dashboard"] });
    await queryClient.resetQueries({ queryKey: ["transactions"] });
    await queryClient.resetQueries({ queryKey: ["transaction"] });
    await queryClient.resetQueries({ queryKey: ["budgets"] });
    await queryClient.resetQueries({ queryKey: ["goals"] });
    await queryClient.resetQueries({ queryKey: ["subscriptions"] });
    await queryClient.resetQueries({ queryKey: ["categories"] });
    await queryClient.resetQueries({ queryKey: ["activities"] });
    await queryClient.resetQueries({ queryKey: ["notifications"] });
  };

  const invalidateSpaceDependent = async () => {
    await invalidateSpaces();
    await resetEntityQueries();
  };

  const create = useMutation({
    mutationFn: ({ name, isPersonal }: { name: string; isPersonal: boolean }) =>
      createSpace(name, isPersonal),
    onSuccess: async () => {
      toast.success("Espacio creado");
      await invalidateSpaceDependent();
    },
    onError: () => toast.error("Could not create space"),
  });

  const join = useMutation({
    mutationFn: (code: string) => joinSpace(code),
    onSuccess: async () => {
      toast.success("Te uniste al espacio");
      await invalidateSpaceDependent();
    },
    onError: () => toast.error("Could not join space"),
  });

  const setActive = useMutation({
    mutationFn: (id: string) => setActiveSpace(id),
    onSuccess: async () => {
      toast.success("Espacio activo actualizado");
      await invalidateSpaceDependent();
    },
    onError: () => toast.error("Could not update space"),
  });

  const leave = useMutation({
    mutationFn: (id: string) => leaveSpace(id),
    onSuccess: async () => {
      toast.success("Saliste del espacio");
      await invalidateSpaceDependent();
    },
    onError: () => toast.error("Could not leave space"),
  });

  const rename = useMutation({
    mutationFn: ({
      id,
      name,
      isPersonal,
    }: {
      id: string;
      name: string;
      isPersonal?: boolean;
    }) => updateSpaceName(id, name, isPersonal),
    onSuccess: async () => {
      toast.success("Espacio actualizado");
      await invalidateSpaces();
    },
    onError: () => toast.error("Could not update space"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteSpace(id),
    onSuccess: async () => {
      toast.success("Espacio eliminado");
      await invalidateSpaceDependent();
    },
    onError: () => toast.error("Could not delete space"),
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({
      spaceId,
      memberUserId,
    }: {
      spaceId: string;
      memberUserId: string;
    }) => removeMemberApi(spaceId, memberUserId),
    onSuccess: async () => {
      toast.success("Miembro eliminado");
      await invalidateSpaces();
    },
    onError: () => toast.error("Could not delete member"),
  });

  const activeSpace: SpaceSummary | null =
    spaces.find((space) => space.id === activeSpaceId) ?? null;

  return {
    spaces,
    activeSpace,
    activeSpaceId,
    isLoading,
    isError,
    create,
    join,
    setActive,
    leave,
    remove,
    rename,
    removeMember: removeMemberMutation,
  };
}
