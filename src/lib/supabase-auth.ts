"use client";

export interface AuthUser {
  id: string;
  email?: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  expires_in?: number;
  token_type?: string;
  user: AuthUser;
}

const SESSION_KEY = "gymrat_supabase_session";

function config() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL y la clave pública de Supabase en las variables de entorno.");
  }

  return { url, key };
}

function readStoredSession(): AuthSession | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.access_token || !parsed?.refresh_token || !parsed?.user?.id) return null;
    return parsed;
  } catch {
    return null;
  }
}

function storeSession(session: AuthSession | null) {
  if (session) window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else window.localStorage.removeItem(SESSION_KEY);
}

async function authRequest<T>(path: string, body?: unknown, accessToken?: string): Promise<T> {
  const { url, key } = config();
  const response = await fetch(`${url}/auth/v1/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      apikey: key,
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof result?.msg === "string" ? result.msg
      : typeof result?.message === "string" ? result.message
      : typeof result?.error_description === "string" ? result.error_description
      : typeof result?.error === "string" ? result.error
      : "No se pudo completar la solicitud de autenticación.";
    throw new Error(message);
  }
  return result as T;
}

function withExpiry(session: AuthSession): AuthSession {
  return {
    ...session,
    expires_at: session.expires_at ?? (session.expires_in ? Math.floor(Date.now() / 1000) + session.expires_in : undefined),
  };
}

export async function signInWithPassword(email: string, password: string): Promise<AuthSession> {
  const session = withExpiry(await authRequest<AuthSession>("token?grant_type=password", { email, password }));
  storeSession(session);
  return session;
}

export async function signUpWithPassword(email: string, password: string): Promise<{ session: AuthSession | null; confirmationRequired: boolean }> {
  const result = await authRequest<AuthSession & { user?: AuthUser }>("signup", { email, password });
  if (result.access_token && result.refresh_token && result.user?.id) {
    const session = withExpiry(result as AuthSession);
    storeSession(session);
    return { session, confirmationRequired: false };
  }
  return { session: null, confirmationRequired: true };
}

export async function getCurrentSession(): Promise<AuthSession | null> {
  let session = readStoredSession();
  if (!session) return null;

  const expiresAt = session.expires_at ?? 0;
  if (expiresAt > Math.floor(Date.now() / 1000) + 60) return session;

  try {
    const refreshed = withExpiry(await authRequest<AuthSession>("token?grant_type=refresh_token", {
      refresh_token: session.refresh_token,
    }));
    storeSession(refreshed);
    return refreshed;
  } catch {
    storeSession(null);
    return null;
  }
}

export async function signOut(): Promise<void> {
  const session = readStoredSession();
  if (session?.access_token) {
    try {
      await authRequest("logout", undefined, session.access_token);
    } finally {
      storeSession(null);
    }
  } else {
    storeSession(null);
  }
}
