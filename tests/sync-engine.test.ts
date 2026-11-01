import { describe, expect, it } from "vitest";
import { EMPTY_META, SyncConflictError, isDirty, pullState, pushState, reconcileOnLoad, type Codec, type PutResult, type SyncMeta, type Transport } from "@/lib/sync-engine";
import { deepEqual } from "@/lib/sync-merge";

type S = { version: 9; water: Record<string, number>; weights: { date: string; kg: number }[]; shopping: Record<string, boolean> };
const empty = (): S => ({ version: 9, water: {}, weights: [], shopping: {} });
const codec: Codec<S> = {
  empty,
  sanitize: (raw) => ({ ...empty(), ...(raw as Partial<S>) }),
};

/** Servidor con las mismas reglas que la API real: guardado condicional por revisión. */
class FakeServer {
  state: S | null = null;
  revision: string | null = null;
  counter = 0;
  puts = 0;
  /** Para simular un servidor que siempre reporta conflicto. */
  alwaysConflict = false;
  /** Para simular que se cae la red. */
  down = false;

  transport(): Transport {
    return {
      get: async () => {
        if (this.down) throw new Error("sin conexión");
        return { state: this.state ? structuredClone(this.state) : null, updatedAt: this.revision };
      },
      put: async (state, baseRevision): Promise<PutResult> => {
        if (this.down) throw new Error("sin conexión");
        this.puts++;
        if (this.alwaysConflict || baseRevision !== this.revision) {
          return { conflict: true, state: this.state ? structuredClone(this.state) : null, updatedAt: this.revision };
        }
        this.state = structuredClone(state as S);
        this.revision = `r${++this.counter}`;
        return { ok: true, updatedAt: this.revision };
      },
    };
  }
}

/** Un dispositivo: su estado en pantalla y lo que recuerda de la última sincronización. */
class Device {
  state: S = empty();
  meta: SyncMeta = EMPTY_META;
  constructor(private server: FakeServer) {}
  async open() {
    const remote = await this.server.transport().get();
    const r = reconcileOnLoad(this.state, this.meta.base ? this.meta : null, remote, codec);
    this.state = r.state;
    this.meta = r.meta;
  }
  edit(fn: (s: S) => S) {
    this.state = fn(this.state);
  }
  async sync() {
    const r = await pushState(this.state, this.meta, this.server.transport(), codec);
    this.state = r.state;
    this.meta = r.meta;
  }
  async pull() {
    const r = await pullState(this.state, this.meta, this.server.transport(), codec);
    if (r) {
      this.state = r.state;
      this.meta = r.meta;
    }
    return r !== null;
  }
}

const addWater = (date: string, ml: number) => (s: S): S => ({ ...s, water: { ...s.water, [date]: (s.water[date] ?? 0) + ml } });
const addWeight = (date: string, kg: number) => (s: S): S => ({ ...s, weights: [...s.weights, { date, kg }].sort((a, b) => a.date.localeCompare(b.date)) });
const removeWeight = (date: string) => (s: S): S => ({ ...s, weights: s.weights.filter((w) => w.date !== date) });

describe("dos dispositivos", () => {
  it("el dispositivo con datos viejos ya no borra lo que guardó el otro", async () => {
    const server = new FakeServer();
    const pc = new Device(server);
    const phone = new Device(server);
    pc.edit(addWeight("2026-10-01", 90));
    await pc.sync();
    await phone.open(); // el celular abre con estos datos y se queda abierto

    pc.edit(addWeight("2026-10-08", 89)); // el PC registra un peso
    await pc.sync();

    phone.edit(addWater("2026-10-29", 250)); // el celular, con datos viejos, registra agua
    await phone.sync(); // antes esto borraba el peso del PC

    expect(server.state?.weights.map((w) => w.date)).toEqual(["2026-10-01", "2026-10-08"]);
    expect(server.state?.water["2026-10-29"]).toBe(250);
    expect(phone.state.weights).toHaveLength(2); // y el celular ya ve el peso del PC
  });

  it("los dos terminan con exactamente los mismos datos", async () => {
    const server = new FakeServer();
    const a = new Device(server);
    const b = new Device(server);
    a.edit(addWater("d", 500));
    await a.sync();
    await b.open();
    a.edit(addWeight("2026-10-10", 80));
    b.edit(addWater("d", 250));
    b.edit(addWeight("2026-10-11", 79));
    await a.sync();
    await b.sync();
    await a.pull();
    expect(deepEqual(a.state, b.state)).toBe(true);
    expect(deepEqual(a.state, server.state)).toBe(true);
    expect(a.state.water.d).toBe(750);
    expect(a.state.weights).toHaveLength(2);
  });

  it("las eliminaciones llegan al otro dispositivo", async () => {
    const server = new FakeServer();
    const a = new Device(server);
    const b = new Device(server);
    a.edit(addWeight("2026-10-01", 90));
    a.edit(addWeight("2026-10-08", 89));
    await a.sync();
    await b.open();
    a.edit(removeWeight("2026-10-01"));
    await a.sync();
    expect(await b.pull()).toBe(true);
    expect(b.state.weights.map((w) => w.date)).toEqual(["2026-10-08"]);
  });

  it("borrar en un dispositivo no revive datos al sincronizar el otro", async () => {
    const server = new FakeServer();
    const a = new Device(server);
    const b = new Device(server);
    a.edit(addWeight("2026-10-01", 90));
    await a.sync();
    await b.open();
    a.edit(removeWeight("2026-10-01"));
    await a.sync();
    b.edit(addWater("d", 250)); // b aún tiene el peso viejo, pero no lo tocó
    await b.sync();
    expect(server.state?.weights).toEqual([]);
    expect(server.state?.water.d).toBe(250);
  });
});

describe("cambios sin conexión", () => {
  it("se conservan y se fusionan al reconectar", async () => {
    const server = new FakeServer();
    const phone = new Device(server);
    const pc = new Device(server);
    phone.edit(addWeight("2026-10-01", 90));
    await phone.sync();
    await pc.open();

    server.down = true;
    phone.edit(addWater("d", 500));
    await expect(phone.sync()).rejects.toThrow("sin conexión");
    expect(phone.state.water.d).toBe(500); // el cambio sigue en el dispositivo
    server.down = false;

    pc.edit(addWeight("2026-10-08", 89));
    await pc.sync();

    // El celular vuelve a abrirse: trae lo del PC sin perder lo suyo.
    const remote = await server.transport().get();
    const r = reconcileOnLoad(phone.state, phone.meta, remote, codec);
    expect(r.state.water.d).toBe(500);
    expect(r.state.weights).toHaveLength(2);
    phone.state = r.state;
    phone.meta = r.meta;
    await phone.sync();
    expect(server.state?.water.d).toBe(500);
    expect(server.state?.weights).toHaveLength(2);
  });

  it("un dispositivo con datos locales antiguos y sin referencia no pierde nada", async () => {
    const server = new FakeServer();
    server.state = { ...empty(), weights: [{ date: "2026-10-08", kg: 89 }] };
    server.revision = "r9";
    const old = new Device(server);
    old.state = { ...empty(), weights: [{ date: "2026-10-01", kg: 90 }], water: { d: 300 } };
    await old.open();
    expect(old.state.weights.map((w) => w.date)).toEqual(["2026-10-01", "2026-10-08"]);
    expect(old.state.water.d).toBe(300);
  });
});

describe("primera conexión tras actualizar la app", () => {
  it("un dispositivo con agua antigua no duplica el agua que ya está en la nube", async () => {
    const server = new FakeServer();
    server.state = { ...empty(), water: { d: 750 } };
    server.revision = "r5";
    const old = new Device(server);
    old.state = { ...empty(), water: { d: 500 } };
    await old.open();
    expect(old.state.water.d).toBe(750);
  });
  it("un dispositivo idéntico a la nube no cambia nada", async () => {
    const server = new FakeServer();
    server.state = { ...empty(), water: { d: 750 }, weights: [{ date: "2026-10-01", kg: 90 }] };
    server.revision = "r5";
    const same = new Device(server);
    same.state = structuredClone(server.state);
    await same.open();
    expect(same.state).toEqual(server.state);
    expect(isDirty(same.state, same.meta, codec)).toBe(false);
  });
});

describe("casos límite", () => {
  it("dos dispositivos nuevos que guardan a la vez: el segundo fusiona en lugar de pisar", async () => {
    const server = new FakeServer();
    const a = new Device(server);
    const b = new Device(server);
    a.edit(addWater("a", 100));
    b.edit(addWater("b", 200));
    await a.sync();
    await b.sync(); // revisión null, pero la fila ya existe → conflicto → fusión
    expect(server.state?.water).toEqual({ a: 100, b: 200 });
  });

  it("si la fila desapareció de la nube, se vuelve a crear", async () => {
    const server = new FakeServer();
    const a = new Device(server);
    a.edit(addWater("d", 100));
    await a.sync();
    server.state = null;
    server.revision = null;
    a.edit(addWater("d", 50));
    await a.sync();
    expect((server.state as S | null)?.water.d).toBe(150);
  });

  it("si el servidor siempre reporta conflicto, falla con un error claro y no se pierde nada local", async () => {
    const server = new FakeServer();
    const a = new Device(server);
    a.edit(addWater("d", 100));
    await a.sync();
    server.alwaysConflict = true;
    a.edit(addWater("d", 50));
    await expect(a.sync()).rejects.toBeInstanceOf(SyncConflictError);
    expect(a.state.water.d).toBe(150);
  });

  it("sin cambios no hace ninguna petición de guardado", async () => {
    const server = new FakeServer();
    const a = new Device(server);
    a.edit(addWater("d", 100));
    await a.sync();
    const before = server.puts;
    await a.sync();
    expect(server.puts).toBe(before);
    expect(isDirty(a.state, a.meta, codec)).toBe(false);
  });

  it("traer cambios sin novedades no modifica nada", async () => {
    const server = new FakeServer();
    const a = new Device(server);
    a.edit(addWater("d", 100));
    await a.sync();
    expect(await a.pull()).toBe(false);
  });

  it("la reordenación de claves que hace la base de datos no cuenta como cambio", async () => {
    const server = new FakeServer();
    const a = new Device(server);
    a.edit((s) => ({ ...s, water: { b: 2, a: 1 } }));
    await a.sync();
    server.state = { ...server.state!, water: { a: 1, b: 2 } };
    expect(isDirty(a.state, a.meta, codec)).toBe(false);
  });
});
