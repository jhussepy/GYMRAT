import { describe, expect, it } from "vitest";
import { MAX_WATER_ML, applyWater, newId, waterTotal, type WaterState } from "@/lib/water";

const D = "2026-11-02";
const empty = (): WaterState => ({ water: {}, waterLog: {} });
const add = (s: WaterState, ml: number) => applyWater(s, D, ml);

describe("agua por vaso", () => {
  it("cada vaso es un registro con su propio identificador", () => {
    const s = add(add(empty(), 250), 250);
    expect(s.waterLog[D]).toHaveLength(2);
    expect(new Set(s.waterLog[D].map((e) => e.id)).size).toBe(2);
    expect(waterTotal(s, D)).toBe(500);
  });
  it("los identificadores no se repiten", () => {
    expect(new Set(Array.from({ length: 500 }, () => newId())).size).toBe(500);
  });
  it("los totales antiguos siguen contando junto a los vasos nuevos", () => {
    const s = add({ water: { [D]: 1000 }, waterLog: {} }, 250);
    expect(waterTotal(s, D)).toBe(1250);
    expect(s.water[D]).toBe(1000);
  });
  it("quitar descuenta primero los vasos más recientes", () => {
    let s = add(add(add(empty(), 250), 500), 250);
    s = add(s, -250);
    expect(s.waterLog[D].map((e) => e.ml)).toEqual([250, 500]);
    s = add(s, -250); // el vaso de 500 se recorta, no se elimina entero
    expect(s.waterLog[D].map((e) => e.ml)).toEqual([250, 250]);
  });
  it("quitar más de lo que hay sale a cero y deja sin fecha el día vacío", () => {
    const s = add(add(empty(), 250), -1000);
    expect(waterTotal(s, D)).toBe(0);
    expect(s.waterLog[D]).toBeUndefined();
  });
  it("si no quedan vasos, quitar descuenta del total antiguo", () => {
    expect(waterTotal(add({ water: { [D]: 750 }, waterLog: {} }, -250), D)).toBe(500);
    expect(add({ water: { [D]: 250 }, waterLog: {} }, -250).water[D]).toBeUndefined();
  });
  it("nunca pasa del máximo diario y no crea registros inútiles", () => {
    let s = empty();
    for (let i = 0; i < 30; i++) s = add(s, 500);
    expect(waterTotal(s, D)).toBe(MAX_WATER_ML);
    expect(add(s, 250)).toBe(s);
  });
  it("sumar 0 no hace nada", () => {
    const s = empty();
    expect(add(s, 0)).toBe(s);
  });
});
