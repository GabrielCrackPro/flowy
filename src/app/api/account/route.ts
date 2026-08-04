import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api/route-utils";
import { ProfileService } from "@/lib/services/profiles";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE() {
  const auth = await requireAuth();

  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    await ProfileService.deleteAccount(auth.id);

    const supabase = createAdminClient();
    const { error } = await supabase.auth.admin.deleteUser(auth.id);

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Cuenta eliminada" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "No se pudo eliminar la cuenta" },
      { status: 500 },
    );
  }
}
