import { NextResponse } from "next/server";
import {
  applyRateLimitHeaders,
  isAuthResponse,
  requireAuth,
  withRateLimit,
} from "@/lib/api/route-utils";
import { ValidationError } from "@/lib/errors/error-types";
import { uploadReceipt } from "@/lib/services/storage";

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
