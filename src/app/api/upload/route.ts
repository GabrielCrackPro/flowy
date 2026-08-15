import { NextResponse } from "next/server";
import {
  applyRateLimitHeaders,
  isAuthResponse,
  requireAuth,
  withRateLimit,
} from "@/lib/api/route-utils";
import { ValidationError } from "@/lib/errors/error-types";
import { deleteReceiptForUser, uploadReceipt } from "@/lib/services/storage";

export async function DELETE(request: Request) {
  const auth = await requireAuth();
  if (isAuthResponse(auth)) return auth;

  const rateLimitResponse = await withRateLimit(auth.id, "upload");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = (await request.json()) as { url?: unknown };
    if (typeof body.url !== "string" || body.url.length === 0) {
      return NextResponse.json({ error: "invalid_url" }, { status: 400 });
    }

    await deleteReceiptForUser(auth.id, body.url);
    return applyRateLimitHeaders(
      NextResponse.json({ success: true }),
      auth.id,
      "upload",
    );
  } catch {
    return NextResponse.json({ error: "delete_failed" }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (isAuthResponse(auth)) return auth;

  const rateLimitResponse = await withRateLimit(auth.id, "upload");
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "invalid_file" }, { status: 400 });
    }

    const url = await uploadReceipt(auth.id, file);
    return applyRateLimitHeaders(NextResponse.json({ url }), auth.id, "upload");
  } catch (err) {
    const code =
      err instanceof ValidationError ? "invalid_file" : "upload_failed";
    return NextResponse.json({ error: code }, { status: 400 });
  }
}
