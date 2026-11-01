import { describe, expect, it } from "vitest";
import { deepEqual, mergeStates } from "@/lib/sync-merge";

type S = Record<string, unknown>;
const empty = (): S => ({ version: 9, water: {}, workoutLogs: {}, weights: [], bodyMeasurements: [], nutritionEntries: {}, shopping: {}, sessions: {}, sleepRecovery: {} });
const make = (over: S): S => ({ ...empty(), ...over });
const merge = (base: S | null, local: S, remote: S) => mergeStates<S>(base, local, remote);

describe("deepEqual", () => {
  it("ignora el orden de las claves, como hace jsonb", () => {
    expect(deepEqual({ a: 1, b: { c: 2, d: 3 } }, { b: { d: 3, c: 2 }, a: 1 })).toBe(true);
    expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
    expect(deepEqual([1, 2], [2, 1])).toBe(false);
  });
});

describe("cambios en un solo lado", () => {
  const base = make({ weights: [{ date: "2026-10-01", kg: 90 }] });
  it("si solo cambió la nube, se toma la nube", () => {
    const remote = make({ weights: [{ date: "2026-10-01", kg: 90 }, { date: "2026-10-08", kg: 89 }] });
    expect(merge(base, base, remote)).toEqual(remote);
  });
  it("si solo cambió este dispositivo, se conserva lo local", () => {
    const local = make({ weights: [{ date: "2026-10-01", kg: 90 }], water: { "2026-10-29": 500 } });
    expect(merge(base, local, base)).toEqual(local);
  });
  it("es idempotente: fusionar dos copias iguales no cambia nada", () => {
    const s = make({ water: { "2026-10-29": 750 } });
    expect(merge(base, s, s)).toEqual(s);
  });
});

describe("cambios en ambos dispositivos sobre cosas distintas", () => {
  it("conserva el peso de uno y la medida del otro", () => {
    const base = make({});
    const local = make({ weights: [{ date: "2026-10-29", kg: 88 }] });
    const remote = make({ bodyMeasurements: [{ date: "2026-10-29", weightKg: 88, waistCm: 90 }] });
    const out = merge(base, local, remote);
    expect(out.weights).toEqual([{ date: "2026-10-29", kg: 88 }]);
    expect(out.bodyMeasurements).toEqual([{ date: "2026-10-29", weightKg: 88, waistCm: 90 }]);
  });

  it("suma el agua de los dos dispositivos en lugar de pisarla", () => {
    const base = make({ water: { d: 500 } });
    const local = make({ water: { d: 750 } }); // +250
    const remote = make({ water: { d: 1000 } }); // +500
    expect((merge(base, local, remote).water as Record<string, number>).d).toBe(1250);
  });

  it("si el servidor ya tiene exactamente nuestro guardado (se perdió la respuesta), no se cuenta dos veces", () => {
    const base = make({ water: { d: 250 } });
    const ours = make({ water: { d: 500 } });
    expect((merge(base, ours, ours).water as Record<string, number>).d).toBe(500);
  });

  it("el agua nunca pasa de 6000 ni baja de 0", () => {
    const base = make({ water: { d: 5000 } });
    expect((merge(base, make({ water: { d: 5900 } }), make({ water: { d: 5800 } })).water as Record<string, number>).d).toBe(6000);
    const b2 = make({ water: { d: 200 } });
    expect((merge(b2, make({ water: { d: 0 } }), make({ water: { d: 0 } })).water as Record<string, number>).d).toBe(0);
    expect((merge(b2, make({ water: { d: 0 } }), make({ water: { d: 100 } })).water as Record<string, number>).d).toBe(0);
  });

  it("combina alimentos añadidos en distintos dispositivos el mismo día", () => {
    const base = make({ nutritionEntries: { d: [{ id: "a", date: "d", name: "Huevos", kcal: 150, protein: 12 }] } });
    const local = make({ nutritionEntries: { d: [...(base.nutritionEntries as S).d as unknown[], { id: "b", date: "d", name: "Arroz", kcal: 200, protein: 4 }] } });
    const remote = make({ nutritionEntries: { d: [...(base.nutritionEntries as S).d as unknown[], { id: "c", date: "d", name: "Pollo", kcal: 300, protein: 50 }] } });
    const ids = ((merge(base, local, remote).nutritionEntries as Record<string, { id: string }[]>).d).map((e) => e.id);
    expect(ids.sort()).toEqual(["a", "b", "c"]);
  });

  it("combina series distintas del mismo ejercicio", () => {
    const base = make({ workoutLogs: { d: { "lun-1": [{ kg: "60", reps: "10" }] } } });
    const local = make({ workoutLogs: { d: { "lun-1": [{ kg: "60", reps: "10" }, { kg: "62", reps: "8" }] } } });
    const remote = make({ workoutLogs: { d: { "lun-1": [{ kg: "60", reps: "10" }, { kg: "", reps: "" }, { kg: "64", reps: "6" }] } } });
    const sets = (merge(base, local, remote).workoutLogs as Record<string, Record<string, unknown[]>>).d["lun-1"];
    expect(sets[1]).toEqual({ kg: "62", reps: "8" });
    expect(sets[2]).toEqual({ kg: "64", reps: "6" });
  });

  it("une entrenos de días distintos", () => {
    const local = make({ workoutLogs: { "2026-10-28": { "lun-1": [{ kg: "50", reps: "10" }] } } });
    const remote = make({ workoutLogs: { "2026-10-29": { "mar-1": [{ kg: "40", reps: "12" }] } } });
    const out = merge(make({}), local, remote).workoutLogs as Record<string, unknown>;
    expect(Object.keys(out).sort()).toEqual(["2026-10-28", "2026-10-29"]);
  });
});

describe("eliminaciones", () => {
  const base = make({ weights: [{ date: "2026-10-01", kg: 90 }, { date: "2026-10-08", kg: 89 }] });
  it("una eliminación local se respeta si la nube no tocó ese dato", () => {
    const local = make({ weights: [{ date: "2026-10-08", kg: 89 }] });
    expect(merge(base, local, base).weights).toEqual([{ date: "2026-10-08", kg: 89 }]);
  });
  it("una eliminación en la nube se respeta si este dispositivo no la tocó", () => {
    const remote = make({ weights: [{ date: "2026-10-01", kg: 90 }] });
    expect(merge(base, base, remote).weights).toEqual([{ date: "2026-10-01", kg: 90 }]);
  });
  it("eliminar un dato y que el otro dispositivo añada otro conserva ambos efectos", () => {
    const local = make({ weights: [{ date: "2026-10-08", kg: 89 }] }); // borró el del 1
    const remote = make({ weights: [...(base.weights as unknown[]), { date: "2026-10-15", kg: 88 }] }); // añadió el del 15
    const dates = (merge(base, local, remote).weights as { date: string }[]).map((w) => w.date);
    expect(dates).toEqual(["2026-10-08", "2026-10-15"]);
  });
  it("si los dos eliminan lo mismo, queda eliminado", () => {
    const gone = make({ weights: [{ date: "2026-10-08", kg: 89 }] });
    expect(merge(base, gone, gone).weights).toEqual([{ date: "2026-10-08", kg: 89 }]);
  });
  it("al borrar una comida en un dispositivo y añadir otra en el otro, no reaparece la borrada", () => {
    const b = make({ nutritionEntries: { d: [{ id: "a", date: "d", name: "X", kcal: 1, protein: 0 }] } });
    const local = make({ nutritionEntries: {} });
    const remote = make({ nutritionEntries: { d: [{ id: "a", date: "d", name: "X", kcal: 1, protein: 0 }, { id: "b", date: "d", name: "Y", kcal: 2, protein: 0 }] } });
    const ids = ((merge(b, local, remote).nutritionEntries as Record<string, { id: string }[]>).d ?? []).map((e) => e.id);
    expect(ids).toEqual(["b"]);
  });
});

describe("conflictos reales", () => {
  it("si ambos editan el mismo peso, gana este dispositivo", () => {
    const base = make({ weights: [{ date: "d", kg: 90 }] });
    const out = merge(base, make({ weights: [{ date: "d", kg: 88 }] }), make({ weights: [{ date: "d", kg: 89 }] }));
    expect(out.weights).toEqual([{ date: "d", kg: 88 }]);
  });
  it("si uno edita y el otro elimina, se conserva la edición", () => {
    const base = make({ weights: [{ date: "d", kg: 90 }] });
    const out = merge(base, make({ weights: [{ date: "d", kg: 88 }] }), make({ weights: [] }));
    expect(out.weights).toEqual([{ date: "d", kg: 88 }]);
  });
  it("el perfil nunca mezcla campos de dos versiones", () => {
    const p = { name: "Ana", goal: "perder", kcalTarget: 1800, proteinTargetG: 100 };
    const base = make({ profile: p });
    const local = make({ profile: { ...p, goal: "ganar", kcalTarget: 2600 } });
    const remote = make({ profile: { ...p, name: "Ana María", proteinTargetG: 130 } });
    expect(merge(base, local, remote).profile).toEqual(local.profile);
  });
});

describe("sin referencia previa (primer dispositivo con datos locales antiguos)", () => {
  it("une los datos locales y los de la nube sin perder ninguno", () => {
    const local = make({ weights: [{ date: "2026-10-01", kg: 90 }], water: { a: 500 } });
    const remote = make({ weights: [{ date: "2026-10-08", kg: 89 }], water: { b: 250 } });
    const out = merge(null, local, remote);
    expect((out.weights as unknown[]).length).toBe(2);
    expect(out.water).toEqual({ a: 500, b: 250 });
  });
  it("sin referencia, el agua conserva el mayor valor en lugar de sumar (evita duplicar datos antiguos)", () => {
    const local = make({ water: { a: 500, b: 100 } });
    const remote = make({ water: { a: 750, c: 250 } });
    expect(merge(null, local, remote).water).toEqual({ a: 750, b: 100, c: 250 });
  });
  it("con referencia vacía conocida (la nube estaba vacía), el agua de dos dispositivos sí se suma", () => {
    const local = make({ water: { a: 500 } });
    const remote = make({ water: { a: 750 } });
    expect(merge(make({}), local, remote).water).toEqual({ a: 1250 });
  });
  it("si lo local está vacío, se obtiene exactamente la nube", () => {
    const remote = make({ weights: [{ date: "d", kg: 80 }], profile: { name: "Ana" } });
    expect(merge(null, make({}), remote)).toEqual(remote);
  });
});

describe("el orden de las claves no genera cambios falsos", () => {
  it("jsonb puede reordenar las claves y no debe contarse como cambio", () => {
    const base = make({ water: { a: 1, b: 2 } });
    const reordered = { ...base, water: { b: 2, a: 1 } };
    expect(merge(base, base, reordered)).toEqual(base);
  });
});
