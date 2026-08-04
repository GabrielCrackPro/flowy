import { NextResponse } from "next/server";
import { isAuthResponse, requireAuth } from "@/lib/api/route-utils";
import { uploadAvatar } from "@/lib/services/storage";

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (isAuthResponse(auth)) return auth;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No se proporcionó un archivo válido" },
        { status: 400 },
      );
    }

    const url = await uploadAvatar(auth.id, file);
    return NextResponse.json({ url });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Error al subir el avatar";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
