import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/api/route-utils";

export async function POST(request: Request) {
  const auth = await requireAuth();

  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
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
        email: auth.email!,
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
    });

    if (updateError) {
      return NextResponse.json(
        { message: updateError.message },
        { status: 400 },
      );
    }

    return NextResponse.json({ message: "Contraseña actualizada" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Could not update password" },
      { status: 500 },
    );
  }
}
