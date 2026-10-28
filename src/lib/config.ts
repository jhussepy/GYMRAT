export const REST_PRESETS = [60, 90, 120] as const;
export const STORAGE_KEY = "coach_pro_v5";

export const WEEKDAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

/** Date.getDay() (0 = domingo) → día del plan, o null si es domingo. */
export function weekdayFromDate(d: Date): Weekday | null {
  const i = d.getDay();
  return i === 0 ? null : WEEKDAYS[i - 1];
}
