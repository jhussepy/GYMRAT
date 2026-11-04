import { vi } from "vitest";

/**
 * Servidor de GYMRAT simulado con las mismas reglas que la API real:
 * una fila por usuario, revisiones y guardado condicional con respuesta 409 en caso de conflicto.
 */
export class FakeCloud {
  rows = new Map<string, { state: unknown; rev: string }>();
  counter = 0;
  /** Usuario de la sesión actual. */
  user = "user_a";
  /** Simula que no hay conexión. */
  down = false;
  puts = 0;
  /** Se marca cuando se pide eliminar la cuenta. */
  accountDeleted = false;
  accountFails = false;
  deletes = 0;

  reset() {
    this.rows.clear();
    this.counter = 0;
    this.user = "user_a";
    this.down = false;
    this.puts = 0;
    this.accountDeleted = false;
    this.accountFails = false;
    this.deletes = 0;
  }

  seed(user: string, state: unknown) {
    this.rows.set(user, { state, rev: `r${++this.counter}` });
  }

  state(user: string): unknown {
    return this.rows.get(user)?.state;
  }

  install() {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => this.handle(String(url), init)),
    );
  }

  private json(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), { status });
  }

  private handle(url: string, init?: RequestInit): Response {
    if (this.down) throw new TypeError("Failed to fetch");
    if (url.includes("/api/account")) {
      if (this.accountFails) return this.json({ error: "Tus datos se borraron, pero la cuenta no pudo eliminarse.", dataDeleted: true }, 502);
      this.rows.delete(this.user);
      this.accountDeleted = true;
      return this.json({ ok: true });
    }
    if (init?.method === "DELETE") {
      this.deletes++;
      this.rows.delete(this.user);
      return this.json({ ok: true });
    }
    const row = this.rows.get(this.user);
    if (init?.method !== "PUT") return this.json({ userId: this.user, state: row?.state ?? null, updatedAt: row?.rev ?? null });

    this.puts++;
    const body = JSON.parse(String(init.body)) as { state: unknown; baseRevision?: string | null };
    if ("baseRevision" in body && (row?.rev ?? null) !== body.baseRevision) {
      return this.json({ conflict: true, state: row?.state ?? null, updatedAt: row?.rev ?? null }, 409);
    }
    const rev = `r${++this.counter}`;
    this.rows.set(this.user, { state: body.state, rev });
    return this.json({ ok: true, updatedAt: rev });
  }
}

export const fakeCloud = new FakeCloud();

/** Acceso abreviado a los estados guardados: cloud["usuario"]. */
export const cloud: Record<string, unknown> = new Proxy({} as Record<string, unknown>, {
  get: (_t, key) => (typeof key === "string" ? fakeCloud.rows.get(key)?.state : undefined),
  set: (_t, key, value) => {
    if (typeof key === "string") fakeCloud.seed(key, value);
    return true;
  },
  deleteProperty: (_t, key) => typeof key === "string" && fakeCloud.rows.delete(key),
  ownKeys: () => [...fakeCloud.rows.keys()],
  getOwnPropertyDescriptor: (_t, key) => (typeof key === "string" && fakeCloud.rows.has(key) ? { value: fakeCloud.rows.get(key)?.state, enumerable: true, configurable: true, writable: true } : undefined),
});
