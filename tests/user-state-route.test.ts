// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { startFakePostgrest } from "./fake-postgrest";

let currentUser: string | null = "user_a";
vi.mock("@clerk/nextjs/server", () => ({ auth: async () => ({ userId: currentUser }) }));

let db: Awaited<ReturnType<typeof startFakePostgrest>>;
let rows: Awaited<ReturnType<typeof startFakePostgrest>>["rows"];
let GET: () => Promise<Response>;
let PUT: (req: Request) => Promise<Response>;
let DELETE: () => Promise<Response>;

beforeAll(async () => {
  db = await startFakePostgrest();
  rows = db.rows;
  vi.stubEnv("SUPABASE_URL", db.url);
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "sb_secret_pruebas123");
  ({ GET, PUT, DELETE } = await import("@/app/api/user-state/route"));
});

afterAll(() => {
  db.close();
  vi.unstubAllEnvs();
});

beforeEach(() => {
  rows.clear();
  db.failDeletes = false;
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

describe("borrar los datos de la nube", () => {
  it("borra solo la fila de quien lo pide", async () => {
    await put({ state: state({ water: { d: 1 } }), baseRevision: null });
    currentUser = "user_b";
    await put({ state: state({ water: { d: 2 } }), baseRevision: null });
    const res = await DELETE();
    expect(res.status).toBe(200);
    expect(rows.has("user_b")).toBe(false);
    expect(rows.has("user_a")).toBe(true);
  });
  it("después de borrar, la nube queda vacía y se puede empezar de cero", async () => {
    await put({ state: state(), baseRevision: null });
    await DELETE();
    expect(await json(await GET())).toMatchObject({ state: null, updatedAt: null });
    expect((await put({ state: state(), baseRevision: null })).status).toBe(200);
  });
  it("es idempotente: borrar sin datos no falla", async () => {
    expect((await DELETE()).status).toBe(200);
  });
  it("exige sesión", async () => {
    currentUser = null;
    expect((await DELETE()).status).toBe(401);
  });
  it("si la base de datos falla, informa el error y no finge que borró", async () => {
    await put({ state: state(), baseRevision: null });
    db.failDeletes = true;
    expect((await DELETE()).status).toBe(502);
    expect(rows.has("user_a")).toBe(true);
  });
});
