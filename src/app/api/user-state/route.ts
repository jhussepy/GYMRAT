import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function config() {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Falta configurar SUPABASE_URL (o NEXT_PUBLIC_SUPABASE_URL) y SUPABASE_SERVICE_ROLE_KEY en el servidor.");
  return { url, key };
}

async function databaseRequest(path: string, init: RequestInit = {}) {
  const { url, key } = config();
  return fetch(`${url}/rest/v1/${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
}

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
  let body: { state?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "El cuerpo de la solicitud no es JSON válido." }, { status: 400 });
  }
  if (!body.state || typeof body.state !== "object" || Array.isArray(body.state)) {
    return NextResponse.json({ error: "El estado de GYMRAT no es válido." }, { status: 400 });
  }
  const state = body.state as Record<string, unknown>;
  if (![5, 6, 7, 8].includes(state.version as number)) {
    return NextResponse.json({ error: "La versión de los datos no es compatible." }, { status: 400 });
  }
  try {
    const response = await databaseRequest("gymrat_user_state?on_conflict=user_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({ user_id: userId, state, updated_at: new Date().toISOString() }),
    });
    if (!response.ok) {
      const detail = await response.text();
      return NextResponse.json({ error: detail || "No se pudieron guardar tus datos en Supabase." }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo conectar con Supabase.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
