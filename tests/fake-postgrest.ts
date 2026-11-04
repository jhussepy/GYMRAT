import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";

/** Supabase simulado: reproduce la parte de PostgREST que usa la API (filtros eq., Prefer, 409 por duplicado). */
export type Row = { user_id: string; state: unknown; updated_at: string };
export const pgTime = (iso: string) => new Date(iso).toISOString().replace("Z", "+00:00");

export async function startFakePostgrest(): Promise<{ rows: Map<string, Row>; url: string; close: () => void; failDeletes: boolean }> {
  const rows = new Map<string, Row>();
  const handle: { failDeletes: boolean } = { failDeletes: false };
  const server: Server = createServer((req, res) => {
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
      if (req.method === "DELETE") {
        if (handle.failDeletes) return send(500, { message: "fallo simulado" });
        // Como PostgREST: sin filtro no se borra nada por seguridad en esta simulación.
        if (!url.searchParams.get("user_id")) return send(400, { message: "DELETE sin filtro" });
        for (const r of [...rows.values()].filter(matches)) rows.delete(r.user_id);
        return send(204, null);
      }
      return send(405, {});
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    rows,
    url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    close: () => server.close(),
    get failDeletes() {
      return handle.failDeletes;
    },
    set failDeletes(v: boolean) {
      handle.failDeletes = v;
    },
  };
}
