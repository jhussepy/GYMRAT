// @vitest-environment node
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

/** Supabase simulado: reproduce la parte de PostgREST que usa la API (filtros eq., Prefer, 409 por duplicado). */
type Row = { user_id: string; state: unknown; updated_at: string };
const rows = new Map<string, Row>();
const pgTime = (iso: string) => new Date(iso).toISOString().replace("Z", "+00:00");
let currentUser: string | null = "user_a";

vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: currentUser }) }));

let server: Server;
let GET: () => Promise<Response>;
let PUT: (req: Request) => Promise<Response>;

beforeAll(async () => {
  server = createServer((req, res) => {
    const url = new URL(req.url ?? "", "http://x");
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : null;
      const prefer = String(req.headers.prefer ?? "");
      const send = (status: number, data: unknown) => {
        res.writeHead(status, { "content-type": "application/json" });
        res.end(JSON.stringify(data));
      };
      const eq = (name: string) => url.searchParams.get(name)?.replace(/^eq\./, "");
      const matches = (r: Row) => {
        const uid = eq("user_id");
        const upd = eq("updated_at");
        return (uid === undefined || r.user_id === uid) && (upd === undefined || Date.parse(r.updated_at) === Date.parse(upd));
      };
      if (req.method === "GET") return send(200, [...rows.values()].filter(matches));
      if (req.method === "POST") {
        const existing = rows.get(body.user_id);
        if (existing && url.searchParams.get("on_conflict") && prefer.includes("merge-duplicates")) {
          rows.set(body.user_id, { ...body, updated_at: pgTime(body.updated_at) });
          return send(201, []);
        }
        if (existing) return send(409, { code: "23505", message: "duplicate key value violates unique constraint" });
        const row = { ...body, updated_at: pgTime(body.updated_at) } as Row;
        rows.set(row.user_id, row);
        return send(201, prefer.includes("return=representation") ? [row] : []);
      }
      if (req.method === "PATCH") {
        const hit = [...rows.values()].filter(matches);
        for (const r of hit) rows.set(r.user_id, { ...r, ...body, updated_at: pgTime(body.updated_at) });
        return send(200, prefer.includes("return=representation") ? hit.map((r) => rows.get(r.user_id)) : []);
      }
      return send(405, {});
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  vi.stubEnv("SUPABASE_URL", `http://127.0.0.1:${(server.address() as AddressInfo).port}`);
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "sb_secret_pruebas123");
  ({ GET, PUT } = await import("@/app/api/user-state/route"));
});

afterAll(() => {
  server.close();
  vi.unstubAllEnvs();
});

beforeEach(() => {
  rows.clear();
  currentUser = "user_a";
});

const state = (extra: Record<string, unknown> = {}) => ({ version: 9, water: {}, ...extra });
const put = (body: unknown) => PUT(new Request("http://x/api/user-state", { method: "PUT", body: JSON.stringify(body) }));
const json = async (r: Response) => (await r.json()) as Record<string, unknown>;

describe("GET", () => {
  it("devuelve null y sin revisión si el usuario aún no tiene datos", async () => {
    const body = await json(await GET());
    expect(body).toMatchObject({ userId: "user_a", state: null, updatedAt: null });
  });
  it("exige sesión", async () => {
    currentUser = null;
    expect((await GET()).status).toBe(401);
  });
});

describe("guardado condicional", () => {
  it("crea el estado la primera vez y devuelve la revisión", async () => {
    const res = await put({ state: state({ water: { d: 1 } }), baseRevision: null });
    const body = await json(res);
    expect(res.status).toBe(200);
    expect(typeof body.updatedAt).toBe("string");
    expect((await json(await GET())).updatedAt).toBe(body.updatedAt);
  });

  it("actualiza cuando la revisión coincide y entrega una revisión nueva", async () => {
    const first = await json(await put({ state: state(), baseRevision: null }));
    await new Promise((r) => setTimeout(r, 5));
    const second = await put({ state: state({ water: { d: 2 } }), baseRevision: first.updatedAt });
    const body = await json(second);
    expect(second.status).toBe(200);
    expect(body.updatedAt).not.toBe(first.updatedAt);
    expect((await json(await GET())).state).toMatchObject({ water: { d: 2 } });
  });

  it("con una revisión vieja responde 409, entrega lo que hay en la nube y NO sobrescribe", async () => {
    const first = await json(await put({ state: state({ water: { d: 1 } }), baseRevision: null }));
    await new Promise((r) => setTimeout(r, 5));
    await put({ state: state({ water: { d: 99 } }), baseRevision: first.updatedAt }); // otro dispositivo guarda
    const stale = await put({ state: state({ water: { d: 5 } }), baseRevision: first.updatedAt }); // este tenía datos viejos
    const body = await json(stale);
    expect(stale.status).toBe(409);
    expect(body).toMatchObject({ conflict: true, state: { water: { d: 99 } } });
    expect((await json(await GET())).state).toMatchObject({ water: { d: 99 } });
  });

  it("primera vez cuando la fila ya existe → 409 con los datos existentes", async () => {
    await put({ state: state({ water: { d: 1 } }), baseRevision: null });
    const res = await put({ state: state({ water: { d: 7 } }), baseRevision: null });
    expect(res.status).toBe(409);
    expect(await json(res)).toMatchObject({ conflict: true, state: { water: { d: 1 } } });
  });

  it("si la fila ya no existe, responde 409 sin estado para que el cliente la vuelva a crear", async () => {
    const res = await put({ state: state(), baseRevision: "2026-10-29T10:00:00.000Z" });
    expect(res.status).toBe(409);
    expect(await json(res)).toMatchObject({ conflict: true, state: null, updatedAt: null });
  });

  it("dos guardados simultáneos con la misma revisión: uno gana y el otro recibe el conflicto", async () => {
    const first = await json(await put({ state: state(), baseRevision: null }));
    await new Promise((r) => setTimeout(r, 5));
    const [x, y] = await Promise.all([put({ state: state({ water: { x: 1 } }), baseRevision: first.updatedAt }), put({ state: state({ water: { y: 1 } }), baseRevision: first.updatedAt })]);
    expect([x.status, y.status].sort()).toEqual([200, 409]);
  });

  it("un usuario no puede modificar los datos de otro, ni con la revisión correcta", async () => {
    const a = await json(await put({ state: state({ water: { d: 1 } }), baseRevision: null }));
    currentUser = "user_b";
    const res = await put({ state: state({ water: { d: 666 } }), baseRevision: a.updatedAt });
    expect(res.status).toBe(409);
    expect(rows.get("user_a")?.state).toMatchObject({ water: { d: 1 } });
    expect(rows.has("user_b")).toBe(false);
  });
});

describe("validaciones y compatibilidad", () => {
  it("rechaza una revisión con formato inválido", async () => {
    expect((await put({ state: state(), baseRevision: "no-es-una-fecha" })).status).toBe(400);
  });
  it("rechaza estados inválidos y versiones desconocidas", async () => {
    expect((await put({ state: [], baseRevision: null })).status).toBe(400);
    expect((await put({ state: { version: 99 }, baseRevision: null })).status).toBe(400);
  });
  it("exige sesión para guardar", async () => {
    currentUser = null;
    expect((await put({ state: state(), baseRevision: null })).status).toBe(401);
  });
  it("los clientes antiguos sin revisión siguen pudiendo guardar", async () => {
    const res = await put({ state: state({ water: { d: 3 } }) });
    expect(res.status).toBe(200);
    expect(typeof (await json(res)).updatedAt).toBe("string");
    expect(rows.get("user_a")?.state).toMatchObject({ water: { d: 3 } });
  });
});
