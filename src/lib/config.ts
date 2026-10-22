/** Única fuente de verdad de tus metas. Cambia aquí y toda la app se actualiza. */
export const PROFILE = {
  heightCm: 164,
  startWeightKg: 99,
  /** Último peso confirmado en la bioimpedancia del 22/10/2026. */
  currentWeightKg: 97.7,
  /** Primera meta de salud: reducir aproximadamente el 5 % del peso actual. */
  firstMilestoneKg: 92.8,
  /** Meta de largo plazo existente; revisar al alcanzar cada etapa. */
  goalWeightKg: 78,
  kcalTarget: 1950,
  proteinTargetG: 160,
  waterGoalMl: 3500,
  /** Hora límite de cafeína y hora de despertar (HH:MM) */
  caffeineCutoff: "08:00",
  wake: "02:30",
} as const;

/** Punto de partida personal. La bioimpedancia es una estimación, no un diagnóstico. */
export const BODY_BASELINE = {
  date: "2026-10-22",
  age: 27,
  weightKg: 97.7,
  heightCm: 164,
  bmi: 36.3,
  bodyFatPercent: 37.7,
  fatMassKg: 36.8,
  fatFreeMassKg: 55.4,
  skeletalMuscleKg: 36,
  visceralFatLevel: 16,
  waistCm: null,
  trainingDaysPerWeek: 5,
  sleepHoursLabel: "Menos de 6 h",
  exerciseSymptoms: "Ninguno referido",
} as const;

export const REST_PRESETS = [60, 90, 120] as const;
export const STORAGE_KEY = "coach_pro_v5";

export const WEEKDAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

/** Date.getDay() (0 = domingo) → día del plan, o null si es domingo. */
export function weekdayFromDate(d: Date): Weekday | null {
  const i = d.getDay();
  return i === 0 ? null : WEEKDAYS[i - 1];
}
