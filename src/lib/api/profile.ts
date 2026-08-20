import { authenticatedRequest } from "@/lib/api/client";
import type { Profile } from "@/types/Profile";

export type UpdateProfileInput = Partial<
  Pick<
    Profile,
    | "name"
    | "avatarUrl"
    | "currency"
    | "locale"
    | "showLanguageSelector"
    | "dashboardCards"
    | "dashboardOrder"
    | "primaryColor"
    | "secondaryColor"
    | "accentColor"
    | "onboardingCompletedAt"
  >
>;

export function ensureProfile() {
  return authenticatedRequest<Profile>("/api/profile", {
    method: "POST",
  });
}

export function getProfile(id: string) {
  return authenticatedRequest<Profile>(`/api/profile/${id}`);
}

export function updateProfile(id: string, data: UpdateProfileInput) {
  return authenticatedRequest<Profile>(`/api/profile/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteProfile(id: string) {
  return authenticatedRequest<void>(`/api/profile/${id}`, {
    method: "DELETE",
  });
}
