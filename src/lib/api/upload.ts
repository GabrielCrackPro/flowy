import { authenticatedRequest } from "@/lib/api/client";
import { resizeImage } from "@/lib/image-utils";

/**
 * Uploads an image to one of the upload endpoints, resized client-side.
 *
 * The server answers with `{ url }` on success or `{ error: "<code>" }` on
 * failure; `authenticatedRequest` surfaces the code (or a generic failure)
 * so callers can show a localized message instead of raw server text.
 */
export async function uploadImage(
  endpoint: string,
  file: File,
): Promise<string> {
  const resized = await resizeImage(file);

  const formData = new FormData();
  formData.append("file", resized);

  const data = await authenticatedRequest<{ url?: string }>(endpoint, {
    method: "POST",
    body: formData,
  });

  if (!data?.url) {
    throw new Error("upload_failed");
  }
  return data.url;
}
