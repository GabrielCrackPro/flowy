import { authenticatedRequest } from "@/lib/api/client";

export async function changePassword(
  currentPassword: string,
  newPassword: string,
) {
  return authenticatedRequest<{ message: string }>("/api/account/password", {
    method: "POST",
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function deleteAccount() {
  return authenticatedRequest<{ message: string }>("/api/account", {
    method: "DELETE",
  });
}
