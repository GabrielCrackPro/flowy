import { authenticatedRequest } from "@/lib/api/client";

export interface SpaceSummary {
  id: string;
  name: string;
  joinCode?: string | null;
  ownerId: string;
  isPersonal: boolean;
  members: Array<{
    id: string;
    role: string;
    user: {
      id: string;
      name: string | null;
      email: string | null;
      avatarUrl: string | null;
    };
  }>;
}

export function getSpaces() {
  return authenticatedRequest<SpaceSummary[]>("/api/space");
}

export function createSpace(name: string, isPersonal: boolean = false) {
  return authenticatedRequest<SpaceSummary>("/api/space", {
    method: "POST",
    body: JSON.stringify({ name, isPersonal }),
  });
}

export function joinSpace(joinCode: string) {
  const normalizedCode = (joinCode ?? "").trim().toUpperCase();

  return authenticatedRequest<SpaceSummary>("/api/space", {
    method: "POST",
    body: JSON.stringify({ action: "join", joinCode: normalizedCode }),
  });
}

export function setActiveSpace(id: string) {
  return authenticatedRequest<{ activeSpaceId: string | null }>(
    `/api/space/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify({ action: "setActive" }),
    },
  );
}

export function updateSpaceName(
  id: string,
  name: string,
  isPersonal?: boolean,
) {
  return authenticatedRequest<SpaceSummary>(`/api/space/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "rename", name, isPersonal }),
  });
}

export function leaveSpace(id: string) {
  return authenticatedRequest<{ success: boolean }>(`/api/space/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "leave" }),
  });
}

export function deleteSpace(id: string) {
  return authenticatedRequest<{ success: boolean }>(`/api/space/${id}`, {
    method: "DELETE",
  });
}

export function removeMember(spaceId: string, memberUserId: string) {
  return authenticatedRequest<{ success: boolean }>(`/api/space/${spaceId}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "removeMember", memberUserId }),
  });
}
