import { NextResponse } from "next/server";
import { withAuthenticatedRoute } from "@/lib/api/route-utils";
import { ValidationError } from "@/lib/errors/error-types";
import { uploadSpaceAvatar } from "@/lib/services/storage";

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

      const url = await uploadSpaceAvatar(auth.id, file);
      return NextResponse.json({ url });
    } catch (err) {
      const code =
        err instanceof ValidationError ? "invalid_file" : "upload_failed";
      return NextResponse.json({ error: code }, { status: 400 });
    }
  },
});
