import { NextResponse } from "next/server";
import { withAuthenticatedRoute } from "@/lib/api/route-utils";
import { createClient } from "@/lib/supabase/server";

export const POST = withAuthenticatedRoute({
  routeName: "account",
  fallbackMessage: "Could not update password",
  handler: async ({ auth, request }) => {
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: "Se requieren los datos de la contraseña" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: auth.email ?? "",
        password: currentPassword,
      });

    if (signInError || !signInData.user) {
      return NextResponse.json(
        { message: "La contraseña actual es incorrecta" },
        { status: 400 },
      );
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
      data: {
        ...(signInData.user.user_metadata ?? {}),
        password_changed_at: new Date().toISOString(),
      },
    });

    if (updateError) {
      return NextResponse.json(
        { message: updateError.message },
        { status: 400 },
      );
    }

    return NextResponse.json({ message: "Contraseña actualizada" });
  },
});
