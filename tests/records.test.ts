import { describe, expect, it } from "vitest";
import { estimatedOneRepMax, historyBefore, isNewRecord, recordsFor, type WorkoutHistory } from "@/lib/records";

const h: WorkoutHistory = {
  "2026-10-01": { "lun-1": [{ kg: "60", reps: "10" }, { kg: "60", reps: "8" }] },
  "2026-10-08": { "lun-1": [{ kg: "62", reps: "8" }] },
  "2026-10-15": { "lun-1": [{ kg: "62", reps: "10" }, { kg: "", reps: "" }] },
};

describe("récords de un ejercicio", () => {
  const r = recordsFor("lun-1", h)!;
  it("el peso máximo y su fecha", () => {
    expect(r.maxKg).toBe(62);
    expect(r.maxKgDate).toBe("2026-10-08");
  });
  it("las mejores repeticiones con el peso récord", () => {
    expect(r.bestRepsAtMaxKg).toEqual({ reps: 10, date: "2026-10-15" });
  });
  it("la mejor serie por volumen", () => {
    expect(r.bestVolumeSet).toMatchObject({ volume: 620, kg: 62, reps: 10, date: "2026-10-15" });
  });
  it("un ejercicio sin historial no tiene récords", () => {
    expect(recordsFor("mar-1", h)).toBeNull();
  });
  it("las series vacías o en cero no cuentan", () => {
    expect(recordsFor("lun-1", { d: { "lun-1": [{ kg: "", reps: "" }, { kg: "0", reps: "5" }] } })).toBeNull();
  });
  it("acepta coma decimal", () => {
    expect(recordsFor("x", { d: { x: [{ kg: "22,5", reps: "8" }] } })?.maxKg).toBe(22.5);
  });
  it("un empate de peso queda con la fecha más antigua", () => {
    const tie: WorkoutHistory = { "2026-10-01": { x: [{ kg: "50", reps: "5" }] }, "2026-10-09": { x: [{ kg: "50", reps: "5" }] } };
    expect(recordsFor("x", tie)?.maxKgDate).toBe("2026-10-01");
  });
});

describe("una serie nueva supera un récord", () => {
  const prev = recordsFor("lun-1", h);
  it("más peso que el récord es récord de peso", () => {
    expect(isNewRecord("64", "5", prev)).toEqual({ kg: true, reps: false });
  });
  it("mismo peso con más repeticiones es récord de repeticiones", () => {
    expect(isNewRecord("62", "12", prev)).toEqual({ kg: false, reps: true });
  });
  it("menos peso o igual número de repeticiones no es récord", () => {
    expect(isNewRecord("60", "20", prev)).toEqual({ kg: false, reps: false });
    expect(isNewRecord("62", "10", prev)).toEqual({ kg: false, reps: false });
  });
  it("sin historial no hay récord que superar", () => {
    expect(isNewRecord("50", "10", null)).toEqual({ kg: false, reps: false });
  });
  it("una serie vacía nunca es récord", () => {
    expect(isNewRecord("", "", prev)).toEqual({ kg: false, reps: false });
  });
});

describe("la serie de hoy no se compara consigo misma", () => {
  it("el historial anterior excluye el día de hoy", () => {
    const before = historyBefore(h, "2026-10-15");
    expect(Object.keys(before).sort()).toEqual(["2026-10-01", "2026-10-08"]);
  });
  it("una serie de hoy que iguala el récord de hoy no se marca como nueva", () => {
    const today = "2026-10-15";
    const prev = recordsFor("lun-1", historyBefore(h, today));
    expect(isNewRecord("62", "10", prev).kg).toBe(false);
  });
});

describe("estimación de 1RM", () => {
  it("con una repetición es el mismo peso", () => {
    expect(estimatedOneRepMax(100, 1)).toBe(100);
  });
  it("más repeticiones dan una estimación mayor que el peso", () => {
    expect(estimatedOneRepMax(60, 10)).toBeGreaterThan(60);
  });
  it("sin repeticiones no hay estimación", () => {
    expect(estimatedOneRepMax(60, 0)).toBe(0);
  });
});
