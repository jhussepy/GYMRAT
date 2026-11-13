import { describe, expect, it } from "vitest";
import { planDay, shoppingList } from "@/lib/menu-planner";
import { FOOD_CATALOG } from "@/lib/food-catalog";

const valid = new Set(FOOD_CATALOG.map((f) => f.id));

describe("un día planificado", () => {
  const day = planDay(1800, 130);

  it("tiene las cuatro comidas en orden", () => {
    expect(day.meals.map((m) => m.name)).toEqual(["Desayuno", "Almuerzo", "Merienda", "Cena"]);
  });

  it("cuadra la meta de calorías (±3 %)", () => {
    expect(Math.abs(day.kcal - 1800) / 1800).toBeLessThan(0.03);
  });

  it("cuadra la meta de proteína (±5 %)", () => {
    expect(Math.abs(day.protein - 130) / 130).toBeLessThan(0.05);
  });

  it("solo usa alimentos del catálogo", () => {
    for (const m of day.meals) for (const i of m.items) expect(valid.has(i.foodId)).toBe(true);
  });

  it("las calorías de cada comida cuadran con sus porciones", () => {
    for (const m of day.meals) expect(m.kcal).toBe(m.items.reduce((n, i) => n + i.kcal, 0));
  });

  it("reporta la diferencia real, no la esconde", () => {
    expect(day.kcalDelta).toBe(1800 - day.kcal);
    expect(day.proteinDelta).toBe(Math.round((130 - day.protein) * 10) / 10);
  });

  it("no mete más de una porción gigante de ningún alimento", () => {
    for (const m of day.meals) for (const i of m.items) expect(i.grams).toBeLessThanOrEqual(250);
  });
});

describe("se adapta a cada meta", () => {
  it("una meta más alta da más calorías en total", () => {
    expect(planDay(2400, 150).kcal).toBeGreaterThan(planDay(1400, 120).kcal);
  });
  it("una meta de proteína más alta da más proteína", () => {
    expect(planDay(1800, 170).protein).toBeGreaterThan(planDay(1800, 90).protein);
  });
  it("cuadra calorías y proteína en las metas habituales (1200 a 2200 kcal)", () => {
    for (const [k, p] of [[1200, 70], [1400, 100], [1800, 180], [2200, 200]] as const) {
      const d = planDay(k, p);
      expect(Math.abs(d.kcal - k), `kcal ${k}`).toBeLessThanOrEqual(k * 0.03);
      expect(Math.abs(d.protein - p), `proteína ${p}`).toBeLessThanOrEqual(p * 0.05);
    }
  });

  it("en metas muy altas (3000 kcal) reporta la diferencia de proteína en lugar de esconderla", () => {
    const d = planDay(3000, 180);
    expect(Math.abs(d.kcal - 3000)).toBeLessThanOrEqual(90);
    // La diferencia que quede queda visible en `proteinDelta` para que la persona la vea.
    expect(d.proteinDelta).toBe(Math.round((180 - d.protein) * 10) / 10);
  });
  it("funciona con metas bajas sin valores negativos", () => {
    const low = planDay(1200, 70);
    for (const m of low.meals) {
      expect(m.kcal).toBeGreaterThanOrEqual(0);
      for (const i of m.items) expect(i.grams).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("lista de compras", () => {
  it("suma varios días y añade margen para desperdicio", () => {
    const d = planDay(1800, 130);
    const list = shoppingList([d, d, d, d, d]);
    const eggs = list.find((l) => l.foodId === "chicken-cooked");
    const single = d.meals.flatMap((m) => m.items).filter((i) => i.foodId === "chicken-cooked").reduce((n, i) => n + i.grams, 0);
    if (single > 0) expect(eggs!.grams).toBeGreaterThanOrEqual(single * 5);
  });
  it("las cantidades se redondean a 10 g", () => {
    for (const l of shoppingList([planDay(1800, 130)])) expect(l.grams % 10).toBe(0);
  });
  it("ordena de mayor a menor cantidad", () => {
    const list = shoppingList([planDay(1800, 130), planDay(1800, 130)]);
    for (let i = 1; i < list.length; i++) expect(list[i - 1].grams).toBeGreaterThanOrEqual(list[i].grams);
  });
  it("sin días no hay lista", () => {
    expect(shoppingList([])).toEqual([]);
  });
});
