import { FOOD_CATALOG, nutritionForGrams, type FoodCatalogItem } from "./food-catalog";

/** Una porción del menú: un alimento en gramos, con sus calorías y proteína ya calculadas. */
export interface PlannedItem {
  foodId: string;
  label: string;
  grams: number;
  kcal: number;
  protein: number;
}

/** Una comida del día planificado. */
export interface PlannedMeal {
  name: string;
  items: PlannedItem[];
  kcal: number;
  protein: number;
}

export interface DayMenu {
  meals: PlannedMeal[];
  kcal: number;
  protein: number;
  /** Diferencia con la meta de calorías (positivo = sobra, negativo = falta). */
  kcalDelta: number;
  proteinDelta: number;
}

/** Reglas de cada comida: qué clase de alimento lleva y qué parte de las calorías ocupa. */
const MEAL_SHAPE: { name: string; share: number; protein: string[]; carb: string[]; extra?: string[] }[] = [
  { name: "Desayuno", share: 0.25, protein: ["egg-boiled", "plain-yogurt"], carb: ["oats-dry"], extra: ["banana"] },
  { name: "Almuerzo", share: 0.35, protein: ["chicken-cooked", "turkey-cooked", "white-fish", "lean-beef"], carb: ["rice-cooked", "quinoa-cooked", "potato-boiled"], extra: ["broccoli"] },
  { name: "Merienda", share: 0.1, protein: ["tuna-water", "whey-powder"], carb: [], extra: ["almonds"] },
  { name: "Cena", share: 0.3, protein: ["white-fish", "chicken-cooked", "turkey-cooked", "egg-boiled"], carb: ["sweet-potato", "potato-boiled"], extra: ["broccoli"] },
];

const byId = (id: string): FoodCatalogItem | undefined => FOOD_CATALOG.find((f) => f.id === id);

/** Alimento energético que se añade cuando el día necesita más calorías y no hay carbohidrato que crezca. */
// Alimentos energéticos con poca proteína: así un día con más calorías no se pasa de proteína.
const ENERGY_ADDONS = ["rice-cooked", "sweet-potato", "avocado", "oats-dry", "almonds"];
function energyAddOn(meals: PlannedMeal[], delta: number): { meal: PlannedMeal; item: PlannedItem } | null {
  const meal = [...meals].sort((a, b) => a.kcal - b.kcal)[0];
  for (const id of ENERGY_ADDONS) {
    if (meal.items.some((i) => i.foodId === id)) continue;
    const f = byId(id);
    if (!f) continue;
    const grams = Math.min(200, Math.max(20, Math.round((delta / f.kcalPer100g) * 100 / 5) * 5));
    const it = item(id, grams);
    if (it) return { meal, item: it };
  }
  return null;
}

/** Gramos que dan `targetKcal` de un alimento, sin pasar de un máximo razonable de porción. */
function gramsForKcal(food: FoodCatalogItem, targetKcal: number, maxGrams: number): number {
  if (food.kcalPer100g <= 0) return 0;
  const grams = (targetKcal / food.kcalPer100g) * 100;
  return Math.round(Math.min(maxGrams, Math.max(0, grams)) / 5) * 5;
}

/** Gramos de proteína: calcula la cantidad que aporta `targetProtein` de un alimento. */
function gramsForProtein(food: FoodCatalogItem, targetProtein: number, maxGrams: number): number {
  if (food.proteinPer100g <= 0) return 0;
  const grams = (targetProtein / food.proteinPer100g) * 100;
  return Math.round(Math.min(maxGrams, Math.max(0, grams)) / 5) * 5;
}

function item(id: string, grams: number): PlannedItem | null {
  const food = byId(id);
  if (!food || grams <= 0) return null;
  const n = nutritionForGrams(food, grams);
  return { foodId: id, label: food.label, grams, kcal: n.kcal, protein: n.protein };
}

/**
 * Arma un día completo que se acerca a la meta de calorías y proteína.
 * Reparte las calorías por comida, pone la proteína en la fuente principal de cada una y completa con carbohidrato y verdura.
 * Cualquier diferencia que quede se muestra en lugar de esconderse.
 */
export function planDay(targetKcal: number, targetProtein: number): DayMenu {
  const meals: PlannedMeal[] = [];
  // Proteína por comida: reparto según el peso de cada comida en las calorías.
  for (const shape of MEAL_SHAPE) {
    const mealKcal = targetKcal * shape.share;
    const mealProtein = targetProtein * shape.share;
    const items: PlannedItem[] = [];

    const protId = shape.protein[0];
    const protFood = byId(protId);
    if (protFood) {
      const g = gramsForProtein(protFood, mealProtein, 250);
      const it = item(protId, g);
      if (it) items.push(it);
    }

    const carbId = shape.carb[0];
    const carbFood = carbId ? byId(carbId) : undefined;
    if (carbFood) {
      const used = items.reduce((n, i) => n + i.kcal, 0);
      const left = Math.max(0, mealKcal - used - 40); // deja 40 kcal para la verdura
      const it = item(carbId, gramsForKcal(carbFood, left, 250));
      if (it) items.push(it);
    }

    for (const extraId of shape.extra ?? []) {
      const it = item(extraId, extraId === "broccoli" ? 150 : extraId === "banana" ? 100 : 15);
      if (it) items.push(it);
    }

    meals.push({
      name: shape.name,
      items,
      kcal: items.reduce((n, i) => n + i.kcal, 0),
      protein: Math.round(items.reduce((n, i) => n + i.protein, 0) * 10) / 10,
    });
  }

  // Ajuste fino de proteína: se corrige en ambos sentidos hasta quedar a ±3 g de la meta.
  // Cada paso cambia la porción de un alimento proteico de una comida, dentro de sus límites.
  const MAX_PROTEIN_GRAMS = 300;
  const TOL = 3;
  const proteinNow = () => meals.reduce((n, m) => n + m.protein, 0);
  const proteinFoods = () =>
    meals.flatMap((m) => m.items.filter((i) => (byId(i.foodId)?.proteinPer100g ?? 0) > 0).map((i) => ({ meal: m, item: i })));
  let guard = 0;
  while (Math.abs(targetProtein - proteinNow()) > TOL && guard++ < 40) {
    const delta = targetProtein - proteinNow();
    const food = proteinFoods();
    if (food.length === 0) break;
    let moved = false;
    if (delta > 0) {
      // Falta proteína: sube la porción del alimento proteico más rico que aún pueda crecer.
      const pick = food
        .filter((c) => c.item.grams < MAX_PROTEIN_GRAMS)
        .sort((a, b) => byId(b.item.foodId)!.proteinPer100g - byId(a.item.foodId)!.proteinPer100g)[0];
      if (pick) {
        const f = byId(pick.item.foodId)!;
        const step = Math.max(5, Math.round((Math.min(delta, 15) / f.proteinPer100g) * 100 / 5) * 5);
        const next = item(f.id, Math.min(MAX_PROTEIN_GRAMS, pick.item.grams + step));
        if (next) { replace(pick.meal, pick.item, next); moved = true; }
      }
    } else {
      // Sobra proteína: baja la porción del alimento proteico más rico que aún tenga cantidad.
      const pick = food
        .filter((c) => c.item.grams > 5)
        .sort((a, b) => byId(b.item.foodId)!.proteinPer100g - byId(a.item.foodId)!.proteinPer100g)[0];
      if (pick) {
        const f = byId(pick.item.foodId)!;
        const step = Math.max(5, Math.round((Math.min(-delta, 15) / f.proteinPer100g) * 100 / 5) * 5);
        const next = item(f.id, Math.max(5, pick.item.grams - step));
        if (next) { replace(pick.meal, pick.item, next); moved = true; }
      }
    }
    if (!moved) break;
  }
  function replace(meal: PlannedMeal, old: PlannedItem, next: PlannedItem) {
    meal.items[meal.items.indexOf(old)] = next;
    meal.kcal = meal.items.reduce((n, i) => n + i.kcal, 0);
    meal.protein = Math.round(meal.items.reduce((n, i) => n + i.protein, 0) * 10) / 10;
  }

  // Ajuste de energía: los carbohidratos (que no cambian la proteína) cierran la diferencia de calorías.
  const CARB_MAX = 250; // mismo tope de porción que el resto de alimentos
  const kcalNow = () => meals.reduce((n, m) => n + m.kcal, 0);
  let guard2 = 0;
  while (Math.abs(targetKcal - kcalNow()) > 40 && guard2++ < 30) {
    const delta = targetKcal - kcalNow();
    // Solo se tocan alimentos que no son proteína principal: carbohidratos y grasas de la comida.
    const carbs = meals.flatMap((m) =>
      m.items
        .filter((i) => {
          const f = byId(i.foodId);
          return !!f && f.proteinPer100g < 10 && f.kcalPer100g >= 80;
        })
        .map((i) => ({ meal: m, item: i })),
    );
    // Si no hay carbohidrato que crezca, se añade un alimento energético a la comida que tenga hueco.
    const growable = carbs.filter((c) => (delta > 0 ? c.item.grams < CARB_MAX : c.item.grams > 5));
    if (growable.length === 0) {
      if (delta <= 0) break;
      const extra = energyAddOn(meals, delta);
      if (!extra) break;
      extra.meal.items.push(extra.item);
      extra.meal.kcal = extra.meal.items.reduce((n, i) => n + i.kcal, 0);
      extra.meal.protein = Math.round(extra.meal.items.reduce((n, i) => n + i.protein, 0) * 10) / 10;
      continue;
    }
    const pick = growable.sort((a, b) => byId(b.item.foodId)!.kcalPer100g - byId(a.item.foodId)!.kcalPer100g)[0];
    const f = byId(pick.item.foodId)!;
    const stepG = Math.max(5, Math.round((Math.min(Math.abs(delta), 80) / f.kcalPer100g) * 100 / 5) * 5);
    const newG = delta > 0 ? Math.min(CARB_MAX, pick.item.grams + stepG) : Math.max(5, pick.item.grams - stepG);
    if (newG === pick.item.grams) break;
    const next = item(f.id, newG);
    if (!next) break;
    replace(pick.meal, pick.item, next);
  }

  const kcal = meals.reduce((n, m) => n + m.kcal, 0);
  const protein = Math.round(meals.reduce((n, m) => n + m.protein, 0) * 10) / 10;
  return { meals, kcal, protein, kcalDelta: targetKcal - kcal, proteinDelta: Math.round((targetProtein - protein) * 10) / 10 };
}

/** Lista de compras: suma las porciones de varios días y devuelve gramos (o unidades) por alimento. */
export interface ShoppingLine {
  foodId: string;
  label: string;
  grams: number;
}

export function shoppingList(days: DayMenu[], wasteFactor = 1.1): ShoppingLine[] {
  const totals = new Map<string, number>();
  for (const day of days) {
    for (const meal of day.meals) {
      for (const it of meal.items) totals.set(it.foodId, (totals.get(it.foodId) ?? 0) + it.grams);
    }
  }
  return [...totals.entries()]
    .map(([foodId, grams]) => ({ foodId, label: byId(foodId)?.label ?? foodId, grams: Math.ceil((grams * wasteFactor) / 10) * 10 }))
    .sort((a, b) => b.grams - a.grams);
}
