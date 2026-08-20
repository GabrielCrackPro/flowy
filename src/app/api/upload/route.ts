import { NextResponse } from "next/server";
import { withAuthenticatedRoute } from "@/lib/api/route-utils";
import { ValidationError } from "@/lib/errors/error-types";
import { deleteReceiptForUser, uploadReceipt } from "@/lib/services/storage";

export const DELETE = withAuthenticatedRoute({
  routeName: "upload",
  fallbackMessage: "Upload failed",
  handler: async ({ auth, request }) => {
    try {
      const body = (await request.json()) as { url?: unknown };
      if (typeof body.url !== "string" || body.url.length === 0) {
        return NextResponse.json({ error: "invalid_url" }, { status: 400 });
      }

      await deleteReceiptForUser(auth.id, body.url);
      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json({ error: "delete_failed" }, { status: 400 });
    }
  },
});

export const POST = withAuthenticatedRoute({
  routeName: "upload",
  fallbackMessage: "Upload failed",
  handler: async ({ auth, request }) => {
    try {
      const formData = await request.formData();
      const file = formData.get("file");

      if (!file || !(file instanceof File)) {
        return NextResponse.json({ error: "invalid_file" }, { status: 400 });
      }

      const url = await uploadReceipt(auth.id, file);
      return NextResponse.json({ url });
    } catch (err) {
      const code =
        err instanceof ValidationError ? "invalid_file" : "upload_failed";
      return NextResponse.json({ error: code }, { status: 400 });
    }
  },
});
