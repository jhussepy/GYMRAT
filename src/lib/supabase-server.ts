/** Configuración de Supabase para la API de servidor. Nunca incluye valores en los mensajes de error. */

type Env = Record<string, string | undefined>;

/** Quita espacios, saltos de línea y comillas que suelen colarse al pegar en Vercel. */
const clean = (value: string | undefined) => (value ?? "").trim().replace(/^["']+|["']+$/g, "").trim();

const isAscii = (value: string) => [...value].every((c) => c.charCodeAt(0) > 32 && c.charCodeAt(0) < 127);

/** Rol declarado dentro de una clave JWT antigua (anon / service_role), o null si no es un JWT legible. */
function jwtRole(key: string): string | null {
  const parts = key.split(".");
  if (parts.length !== 3) return null;
  try {
    const payload = JSON.parse(Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8")) as { role?: unknown };
    return typeof payload.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

export function readSupabaseConfig(env: Env = process.env): { url: string; key: string } {
  const url = clean(env.SUPABASE_URL) || clean(env.NEXT_PUBLIC_SUPABASE_URL);
  const key = clean(env.SUPABASE_SERVICE_ROLE_KEY);

  const missing: string[] = [];
  if (!url) missing.push("SUPABASE_URL (o NEXT_PUBLIC_SUPABASE_URL)");
  if (!key) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (missing.length) {
    throw new Error(
      `Falta configurar ${missing.join(" y ")} en las variables de entorno del servidor. En Vercel añádela en Settings → Environment Variables (la clave secreta SIN el prefijo NEXT_PUBLIC_), márcala para Production y vuelve a desplegar.`,
    );
  }
  if (!/^https?:\/\//i.test(url)) {
    throw new Error("SUPABASE_URL debe empezar por https:// . Copia la «Project URL» desde Supabase → Settings → API.");
  }
  if (!isAscii(key)) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY contiene caracteres no válidos. ¿Copiaste una versión truncada con «…»? Cópiala completa desde Supabase → Settings → API Keys.");
  }
  if (key.startsWith("sb_publishable_") || jwtRole(key) === "anon") {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY contiene la clave pública. Esta variable necesita la clave secreta (sb_secret_… o service_role), que solo debe vivir en el servidor.");
  }
  return { url: url.replace(/\/+$/, ""), key };
}

/**
 * Las claves nuevas (sb_secret_…) no son JWT y solo se envían en `apikey`.
 * Las antiguas (JWT service_role) también se envían como Bearer.
 */
export function supabaseHeaders(key: string): Record<string, string> {
  const headers: Record<string, string> = { apikey: key, "Content-Type": "application/json" };
  if (!key.startsWith("sb_")) headers.Authorization = `Bearer ${key}`;
  return headers;
}
