import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { databaseRequest } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Texto que la persona debe escribir para confirmar. */
const CONFIRM_WORD = "ELIMINAR";

/**
 * Elimina la cuenta: primero los datos de la nube y, solo si eso salió bien, la cuenta de acceso.
 * Así nunca quedan datos de salud huérfanos sin una cuenta que los gestione.
 */
export async function DELETE(request: Request) {
  let userId: string | null;
  try {
    ({ userId } = await auth());
  } catch {
    return NextResponse.json({ error: "No se pudo verificar la sesión. Revisa la configuración de Clerk en el servidor." }, { status: 503 });
  }
  if (!userId) return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });

  let body: { confirm?: unknown } | null = null;
  try {
    body = await request.json();
  } catch {
    /* se valida abajo */
  }
  if (body?.confirm !== CONFIRM_WORD) {
    return NextResponse.json({ error: `Escribe ${CONFIRM_WORD} para confirmar.` }, { status: 400 });
  }

  // 1) Datos en la nube.
  try {
    const query = new URLSearchParams({ user_id: `eq.${userId}` });
    const response = await databaseRequest(`gymrat_user_state?${query.toString()}`, { method: "DELETE" });
    if (!response.ok) {
      return NextResponse.json({ error: "No se pudieron borrar tus datos. Tu cuenta no se eliminó; inténtalo de nuevo." }, { status: 502 });
    }
  } catch (error) {
    // Sin Supabase configurado no hay datos en la nube que borrar; cualquier otro fallo detiene el proceso.
    const message = error instanceof Error ? error.message : "";
    if (!message.startsWith("Falta configurar")) {
      return NextResponse.json({ error: "No se pudieron borrar tus datos. Tu cuenta no se eliminó; inténtalo de nuevo." }, { status: 503 });
    }
  }

  // 2) Cuenta de acceso.
  try {
    const client = await clerkClient();
    await client.users.deleteUser(userId);
  } catch {
    return NextResponse.json({ error: "Tus datos se borraron, pero la cuenta no pudo eliminarse. Vuelve a intentarlo.", dataDeleted: true }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
