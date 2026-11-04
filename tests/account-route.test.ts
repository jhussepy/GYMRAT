// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { startFakePostgrest } from "./fake-postgrest";

let currentUser: string | null = "user_a";
const deleteUser = vi.fn(async (_id: string) => undefined);
vi.mock("@clerk/nextjs/server", () => ({
  auth: async () => ({ userId: currentUser }),
  clerkClient: async () => ({ users: { deleteUser: (id: string) => deleteUser(id) } }),
}));

let db: Awaited<ReturnType<typeof startFakePostgrest>>;
let DELETE: (req: Request) => Promise<Response>;

beforeAll(async () => {
  db = await startFakePostgrest();
  vi.stubEnv("SUPABASE_URL", db.url);
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "sb_secret_pruebas123");
  ({ DELETE } = await import("@/app/api/account/route"));
});
afterAll(() => {
  db.close();
  vi.unstubAllEnvs();
});
beforeEach(() => {
  db.rows.clear();
  db.failDeletes = false;
  currentUser = "user_a";
  deleteUser.mockReset();
  deleteUser.mockResolvedValue(undefined);
  db.rows.set("user_a", { user_id: "user_a", state: { version: 9 }, updated_at: "2026-10-29T10:00:00.000+00:00" });
  db.rows.set("user_b", { user_id: "user_b", state: { version: 9 }, updated_at: "2026-10-29T10:00:00.000+00:00" });
});

const del = (body: unknown) => DELETE(new Request("http://x/api/account", { method: "DELETE", body: JSON.stringify(body) }));
const json = async (r: Response) => (await r.json()) as Record<string, unknown>;

describe("eliminar cuenta", () => {
  it("borra los datos y la cuenta de quien lo pide, y nada de otros usuarios", async () => {
    const res = await del({ confirm: "ELIMINAR" });
    expect(res.status).toBe(200);
    expect(db.rows.has("user_a")).toBe(false);
    expect(db.rows.has("user_b")).toBe(true);
    expect(deleteUser).toHaveBeenCalledTimes(1);
    expect(deleteUser).toHaveBeenCalledWith("user_a");
  });

  it("primero borra los datos y después la cuenta", async () => {
    let dataGoneWhenAccountDeleted = false;
    deleteUser.mockImplementation(async () => {
      dataGoneWhenAccountDeleted = !db.rows.has("user_a");
    });
    await del({ confirm: "ELIMINAR" });
    expect(dataGoneWhenAccountDeleted).toBe(true);
  });

  it("exige la palabra de confirmación exacta", async () => {
    for (const body of [{}, { confirm: "eliminar" }, { confirm: "" }, { confirm: true }]) {
      expect((await del(body)).status).toBe(400);
    }
    expect((await DELETE(new Request("http://x/api/account", { method: "DELETE", body: "no es json" }))).status).toBe(400);
    expect(db.rows.has("user_a")).toBe(true);
    expect(deleteUser).not.toHaveBeenCalled();
  });

  it("exige sesión", async () => {
    currentUser = null;
    expect((await del({ confirm: "ELIMINAR" })).status).toBe(401);
    expect(deleteUser).not.toHaveBeenCalled();
    expect(db.rows.size).toBe(2);
  });

  it("si los datos no se pueden borrar, NO elimina la cuenta (no quedan datos huérfanos)", async () => {
    db.failDeletes = true;
    const res = await del({ confirm: "ELIMINAR" });
    expect(res.status).toBe(502);
    expect(deleteUser).not.toHaveBeenCalled();
    expect(db.rows.has("user_a")).toBe(true);
  });

  it("si la cuenta no se puede eliminar, lo informa y deja claro que los datos sí se borraron", async () => {
    deleteUser.mockRejectedValue(new Error("clerk caído"));
    const res = await del({ confirm: "ELIMINAR" });
    const body = await json(res);
    expect(res.status).toBe(502);
    expect(body.dataDeleted).toBe(true);
    expect(db.rows.has("user_a")).toBe(false);
    // Reintentar funciona: borrar datos ya borrados no falla y la cuenta se elimina.
    deleteUser.mockResolvedValue(undefined);
    expect((await del({ confirm: "ELIMINAR" })).status).toBe(200);
  });
});
