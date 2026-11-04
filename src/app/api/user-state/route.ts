import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { databaseRequest } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  let userId: string | null;
  try {
    ({ userId } = await auth());
  } catch {
    return NextResponse.json(
      { error: "No se pudo verificar la sesión. Revisa la configuración de Clerk en el servidor." },
      { status: 503 },
    );
  }
  if (!userId) return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  try {
    const query = new URLSearchParams({ select: "state,updated_at", user_id: `eq.${userId}`, limit: "1" });
    const response = await databaseRequest(`gymrat_user_state?${query.toString()}`);
    if (!response.ok) {
      const detail = await response.text();
      return NextResponse.json({ error: detail || "No se pudieron cargar tus datos de Supabase." }, { status: 502 });
    }
    const rows = await response.json() as Array<{ state: unknown; updated_at: string }>;
    return NextResponse.json({ userId, state: rows[0]?.state ?? null, updatedAt: rows[0]?.updated_at ?? null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo conectar con Supabase.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

/** Una revisión es la marca de tiempo exacta que devolvió el servidor al guardar. */
function isRevision(value: unknown): value is string {
  return typeof value === "string" && value.length <= 64 && !Number.isNaN(Date.parse(value));
}

type Row = { state: unknown; updated_at: string };

/** Respuesta cuando otro dispositivo guardó primero: incluye lo que hay ahora para fusionar. */
async function conflictResponse(userId: string) {
  const query = new URLSearchParams({ select: "state,updated_at", user_id: `eq.${userId}`, limit: "1" });
  const response = await databaseRequest(`gymrat_user_state?${query.toString()}`);
  if (!response.ok) {
    const detail = await response.text();
    return NextResponse.json({ error: detail || "No se pudieron cargar tus datos de Supabase." }, { status: 502 });
  }
  const rows = (await response.json()) as Row[];
  return NextResponse.json({ conflict: true, state: rows[0]?.state ?? null, updatedAt: rows[0]?.updated_at ?? null }, { status: 409 });
}

export async function PUT(request: Request) {
  let userId: string | null;
  try {
    ({ userId } = await auth());
  } catch {
    return NextResponse.json(
      { error: "No se pudo verificar la sesión. Revisa la configuración de Clerk en el servidor." },
      { status: 503 },
    );
  }
  if (!userId) return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  let body: { state?: unknown; baseRevision?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "El cuerpo de la solicitud no es JSON válido." }, { status: 400 });
  }
  if (!body.state || typeof body.state !== "object" || Array.isArray(body.state)) {
    return NextResponse.json({ error: "El estado de GYMRAT no es válido." }, { status: 400 });
  }
  const state = body.state as Record<string, unknown>;
  if (![5, 6, 7, 8, 9].includes(state.version as number)) {
    return NextResponse.json({ error: "La versión de los datos no es compatible." }, { status: 400 });
  }
  const conditional = "baseRevision" in body;
  if (conditional && body.baseRevision !== null && !isRevision(body.baseRevision)) {
    return NextResponse.json({ error: "La revisión indicada no es válida." }, { status: 400 });
  }
  const now = new Date().toISOString();

  try {
    // Clientes antiguos que aún no envían revisión: se conserva el guardado directo.
    if (!conditional) {
      const response = await databaseRequest("gymrat_user_state?on_conflict=user_id", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({ user_id: userId, state, updated_at: now }),
      });
      if (!response.ok) {
        const detail = await response.text();
        return NextResponse.json({ error: detail || "No se pudieron guardar tus datos en Supabase." }, { status: 502 });
      }
      return NextResponse.json({ ok: true, updatedAt: now });
    }

    // Primera vez (sin revisión): solo se crea si la fila no existe todavía.
    if (body.baseRevision === null) {
      const response = await databaseRequest("gymrat_user_state", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ user_id: userId, state, updated_at: now }),
      });
      if (response.status === 409) return conflictResponse(userId);
      if (!response.ok) {
        const detail = await response.text();
        return NextResponse.json({ error: detail || "No se pudieron guardar tus datos en Supabase." }, { status: 502 });
      }
      const rows = (await response.json()) as Row[];
      return NextResponse.json({ ok: true, updatedAt: rows[0]?.updated_at ?? now });
    }

    // Guardado condicional: la actualización solo ocurre si la nube sigue en la revisión que conocías.
    const query = new URLSearchParams({ user_id: `eq.${userId}`, updated_at: `eq.${body.baseRevision as string}` });
    const response = await databaseRequest(`gymrat_user_state?${query.toString()}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ state, updated_at: now }),
    });
    if (!response.ok) {
      const detail = await response.text();
      return NextResponse.json({ error: detail || "No se pudieron guardar tus datos en Supabase." }, { status: 502 });
    }
    const rows = (await response.json()) as Row[];
    if (rows.length === 0) return conflictResponse(userId);
    return NextResponse.json({ ok: true, updatedAt: rows[0].updated_at });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo conectar con Supabase.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}

/** Borra todos los datos del usuario en la nube. La cuenta de acceso no se toca. */
export async function DELETE() {
  let userId: string | null;
  try {
    ({ userId } = await auth());
  } catch {
    return NextResponse.json({ error: "No se pudo verificar la sesión. Revisa la configuración de Clerk en el servidor." }, { status: 503 });
  }
  if (!userId) return NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 });
  try {
    const query = new URLSearchParams({ user_id: `eq.${userId}` });
    const response = await databaseRequest(`gymrat_user_state?${query.toString()}`, { method: "DELETE" });
    if (!response.ok) {
      const detail = await response.text();
      return NextResponse.json({ error: detail || "No se pudieron borrar tus datos de Supabase." }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No se pudo conectar con Supabase." }, { status: 503 });
  }
}
