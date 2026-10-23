"use client";

import { STORAGE_KEY } from "@/lib/config";
import { getCurrentSession, getSupabaseConfig } from "@/lib/supabase-auth";

export interface CloudStateResult {
  exists: boolean;
  updatedAt: string | null;
  state: unknown | null;
}

function validateAppState(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const state = value as Record<string, unknown>;
  return [5, 6, 7, 8].includes(state.version as number);
}

async function requestState(method: "GET" | "POST", state?: Record<string, unknown>): Promise<Response> {
  const session = await getCurrentSession();
  if (!session) throw new Error("Tu sesión ha caducado. Inicia sesión de nuevo.");
  const { url, key } = getSupabaseConfig();
  return fetch(`${url}/rest/v1/user_app_state${method === "GET" ? "?select=state,updated_at" : "?on_conflict=user_id"}`, {
    method,
    headers: {
      apikey: key,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
      ...(method === "POST" ? { Prefer: "resolution=merge-duplicates,return=minimal" } : {}),
    },
    ...(method === "POST" ? { body: JSON.stringify({ user_id: session.user.id, state }) } : {}),
  });
}

export function readLocalAppState(): Record<string, unknown> | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return validateAppState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function fetchCloudState(): Promise<CloudStateResult> {
  const response = await requestState("GET");
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(detail || `No se pudieron consultar los datos de la nube (HTTP ${response.status}).`);
  }
  const rows = await response.json() as Array<{ state?: unknown; updated_at?: string }>;
  const row = rows[0];
  if (!row) return { exists: false, updatedAt: null, state: null };
  if (!validateAppState(row.state)) {
    throw new Error("Los datos de Supabase no tienen una versión de GYMRAT reconocida. No se ha modificado nada.");
  }
  return { exists: true, updatedAt: row.updated_at ?? null, state: row.state };
}

export async function uploadLocalStateToCloud(): Promise<void> {
  const local = readLocalAppState();
  if (!local) throw new Error("No se encontraron datos locales válidos para subir. Abre GYMRAT en este dispositivo y comprueba tus registros.");
  const response = await requestState("POST", local);
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(detail || `No se pudieron guardar los datos en Supabase (HTTP ${response.status}).`);
  }
}

export async function restoreCloudStateToLocal(): Promise<void> {
  const cloud = await fetchCloudState();
  if (!cloud.exists || !cloud.state) throw new Error("No hay datos en la nube para restaurar.");
  // Guardar el estado importado en la misma clave que consume StoreProvider.
  // La recarga posterior permite que el proveedor valide y cargue el estado.
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cloud.state));
}
