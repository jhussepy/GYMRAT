import { describe, expect, it } from "vitest";
import { parseSettings, remindersFor, shouldFire } from "@/lib/reminders";

const profile = { trainStart: "19:00", trainMinutes: 60, wake: "07:00", bed: "23:00" };
const at = (h: number, m = 0) => h * 60 + m;

describe("horas de los recordatorios", () => {
  const all = remindersFor(profile);
  const byId = (id: string) => all.find((r) => r.id === id)!;
  it("avisa del entreno media hora antes", () => {
    expect(byId("train").at).toBe(at(18, 30));
  });
  it("avisa de dormir media hora antes", () => {
    expect(byId("sleep").at).toBe(at(22, 30));
  });
  it("el pesaje va justo después de despertar", () => {
    expect(byId("weigh").at).toBe(at(7, 15));
  });
  it("el agua cae a mitad de la jornada despierto", () => {
    expect(byId("water").at).toBe(at(15, 0));
  });
  it("cada recordatorio tiene un destino dentro de la app", () => {
    for (const r of all) expect(r.url.startsWith("/panel")).toBe(true);
  });
  it("con un perfil de madrugada, las horas siguen dentro del día", () => {
    const night = remindersFor({ trainStart: "03:00", trainMinutes: 60, wake: "02:30", bed: "22:00" });
    for (const r of night) expect(r.at >= 0 && r.at < 1440).toBe(true);
  });
});

describe("cuándo suena", () => {
  const train = remindersFor(profile).find((r) => r.id === "train")!;
  const all = ["train", "water", "meal", "weigh", "sleep"] as const;
  it("suena dentro de la ventana de la hora prevista", () => {
    expect(shouldFire(train, at(18, 32), "Miércoles", undefined, "2026-11-04", [...all])).toBe(true);
  });
  it("no suena antes ni mucho después de la hora", () => {
    expect(shouldFire(train, at(18, 29), "Miércoles", undefined, "2026-11-04", [...all])).toBe(false);
    expect(shouldFire(train, at(18, 50), "Miércoles", undefined, "2026-11-04", [...all])).toBe(false);
  });
  it("una sola vez al día", () => {
    expect(shouldFire(train, at(18, 32), "Miércoles", "2026-11-04", "2026-11-04", [...all])).toBe(false);
  });
  it("si el usuario lo desactivó, no suena", () => {
    expect(shouldFire(train, at(18, 32), "Miércoles", undefined, "2026-11-04", ["water"])).toBe(false);
  });
  it("el pesaje solo suena los sábados", () => {
    const weigh = remindersFor(profile).find((r) => r.id === "weigh")!;
    expect(shouldFire(weigh, at(7, 16), "Miércoles", undefined, "2026-11-04", [...all])).toBe(false);
    expect(shouldFire(weigh, at(7, 16), "Sábado", undefined, "2026-11-07", [...all])).toBe(true);
  });
});

describe("ajustes guardados", () => {
  it("acepta solo recordatorios conocidos", () => {
    expect(parseSettings({ enabled: ["train", "inventado", "water"] })).toEqual({ enabled: ["train", "water"] });
  });
  it("una configuración inválida vale como ninguno activo", () => {
    expect(parseSettings(null)).toEqual({ enabled: [] });
    expect(parseSettings({ enabled: "train" })).toEqual({ enabled: [] });
  });
});
