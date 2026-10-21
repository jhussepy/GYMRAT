import { MEALS, TAPERS, type Macro, type Meal } from "./data";
import type { Weekday } from "./config";

export type WeekdayWithTaper = keyof typeof TAPERS;

export function isTaperDay(day: Weekday): day is WeekdayWithTaper {
  return day in TAPERS;
}

/** Comidas del día con el táper correspondiente ya sustituido. */
export function mealsForDay(day: WeekdayWithTaper): Meal[] {
  const taper = TAPERS[day];
  return MEALS.map((m) =>
    m.taper
      ? { ...m, name: `${m.name}: ${taper.title}`, food: taper.description, kcal: taper.kcal, protein: taper.protein }
      : m,
  );
}

export function totals(meals: Macro[]): Macro {
  return meals.reduce((acc, m) => ({ kcal: acc.kcal + m.kcal, protein: acc.protein + m.protein }), { kcal: 0, protein: 0 });
}
