import { createClient } from "@supabase/supabase-js";

const RECEIPTS_BUCKET = "receipts";
const AVATARS_BUCKET = "avatars";
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

function generatePath(userId: string, ext: string): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  return `${userId}/${ts}-${rand}.${ext}`;
}

function getExtension(filename: string): string {
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

async function uploadFile(
  bucket: string,
  maxSize: number,
  allowedTypes: string[],
  userId: string,
  file: File,
): Promise<string> {
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Tipo de archivo no permitido");
  }
  if (file.size > maxSize) {
    throw new Error(
      `El archivo excede el tamaño máximo de ${Math.round(maxSize / 1024 / 1024)} MB`,
    );
  }

  await ensureBucket(bucket, maxSize);

  const supabase = getServiceClient();
  const ext = getExtension(file.name);
  const path = generatePath(userId, ext);

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

export async function deleteAvatar(url: string): Promise<void> {
  await deleteFile(AVATARS_BUCKET, url);
}
