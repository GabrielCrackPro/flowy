import { createClient } from "@supabase/supabase-js";
import { ValidationError } from "@/lib/errors/error-types";

const RECEIPTS_BUCKET = "receipts";
const AVATARS_BUCKET = "avatars";
const SPACES_BUCKET = "spaces";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "application/pdf",
];

const ALLOWED_AVATAR_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

function getServiceClient() {
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function generatePath(
  userId: string,
  ext: string,
  file: File,
): Promise<string> {
  // Content-addressed paths make retrying the same upload idempotent instead
  // of creating another storage object for the same document.
  const digest = await crypto.subtle.digest(
    "SHA-256",
    await file.arrayBuffer(),
  );
  const hash = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return `${userId}/${hash}.${ext}`;
}

function getExtension(filename: string, contentType?: string): string {
  if (contentType === "image/jpeg" || contentType === "image/jpg") {
    return "jpg";
  }
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  if (contentType === "application/pdf") return "pdf";

  const parts = filename.split(".");
  return parts.length > 1
    ? (parts[parts.length - 1]?.toLowerCase() ?? "bin")
    : "bin";
}

async function ensureBucket(name: string, maxSize: number): Promise<void> {
  const supabase = getServiceClient();
  const { data: buckets } = await supabase.storage.listBuckets();
  if (buckets?.some((b) => b.name === name)) return;
  await supabase.storage.createBucket(name, {
    public: true,
    fileSizeLimit: maxSize,
  });
}

/**
 * Best-effort magic-byte check so a file with a spoofed MIME type is rejected
 * (PNG 89 50 4E 47, JPEG FF D8 FF, WebP RIFF....WEBP).
 */
async function hasValidImageSignature(file: File): Promise<boolean> {
  try {
    const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    if (bytes.length < 3) return false;
    // JPEG
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff)
      return true;
    // PNG
    if (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    ) {
      return true;
    }
    // WebP (RIFF....WEBP)
    if (
      bytes.length >= 12 &&
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/** Best-effort magic-byte check for PDFs (%PDF-). */
async function hasValidPdfSignature(file: File): Promise<boolean> {
  try {
    const bytes = new Uint8Array(await file.slice(0, 5).arrayBuffer());
    return (
      bytes.length >= 5 &&
      bytes[0] === 0x25 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x44 &&
      bytes[3] === 0x46 &&
      bytes[4] === 0x2d
    );
  } catch {
    return false;
  }
}

async function uploadFile(
  bucket: string,
  maxSize: number,
  allowedTypes: string[],
  userId: string,
  file: File,
): Promise<string> {
  if (!allowedTypes.includes(file.type)) {
    throw new ValidationError("File type not allowed");
  }
  if (file.size > maxSize) {
    throw new ValidationError(
      `File exceeds the maximum size of ${Math.round(maxSize / 1024 / 1024)} MB`,
    );
  }
  // Verify the actual file content, not just the user-supplied MIME type.
  if (file.type.startsWith("image/") && !(await hasValidImageSignature(file))) {
    throw new ValidationError("Invalid image file");
  }
  if (file.type === "application/pdf" && !(await hasValidPdfSignature(file))) {
    throw new ValidationError("Invalid PDF file");
  }

  await ensureBucket(bucket, maxSize);

  const supabase = getServiceClient();
  const ext = getExtension(file.name, file.type);
  const path = await generatePath(userId, ext, file);

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true });

  if (error) throw new Error(error.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  return publicUrl;
}

export async function uploadReceipt(
  userId: string,
  file: File,
): Promise<string> {
  return uploadFile(
    RECEIPTS_BUCKET,
    MAX_FILE_SIZE,
    ALLOWED_TYPES,
    userId,
    file,
  );
}

export async function uploadAvatar(
  userId: string,
  file: File,
): Promise<string> {
  return uploadFile(
    AVATARS_BUCKET,
    MAX_AVATAR_SIZE,
    ALLOWED_AVATAR_TYPES,
    userId,
    file,
  );
}

export async function uploadSpaceAvatar(
  userId: string,
  file: File,
): Promise<string> {
  return uploadFile(
    SPACES_BUCKET,
    MAX_AVATAR_SIZE,
    ALLOWED_AVATAR_TYPES,
    userId,
    file,
  );
}

function publicPrefix(bucket: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/`;
}

export async function deleteFile(
  bucket: string,
  fileUrl: string,
): Promise<void> {
  const supabase = getServiceClient();
  const prefix = publicPrefix(bucket);
  if (!fileUrl.startsWith(prefix)) return;
  const path = fileUrl.replace(prefix, "");
  await supabase.storage.from(bucket).remove([path]);
}

export async function deleteReceipt(url: string): Promise<void> {
  await deleteFile(RECEIPTS_BUCKET, url);
}

/**
 * Deletes a receipt only when no transaction still references its public URL.
 * This keeps shared/content-addressed uploads safe when one transaction is
 * removed or replaces its receipt.
 */
export async function deleteReceiptIfUnreferenced(url: string): Promise<void> {
  const { prisma } = await import("@/lib/prisma/client");
  const references = await prisma.transaction.count({
    where: { receiptUrl: url },
  });

  if (references === 0) {
    await deleteReceipt(url);
  }
}

/** Deletes an unreferenced receipt uploaded by the authenticated user. */
export async function deleteReceiptForUser(
  userId: string,
  url: string,
): Promise<void> {
  const prefix = publicPrefix(RECEIPTS_BUCKET);
  if (!url.startsWith(prefix)) return;

  const path = url.slice(prefix.length);
  if (!path.startsWith(`${userId}/`)) return;

  await deleteReceiptIfUnreferenced(url);
}

export async function deleteAvatar(url: string): Promise<void> {
  await deleteFile(AVATARS_BUCKET, url);
}

export async function deleteSpaceAvatar(url: string): Promise<void> {
  await deleteFile(SPACES_BUCKET, url);
}
