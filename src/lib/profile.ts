import { WEEKDAYS, type Weekday } from "./config";
import type { Category, ScheduleItem } from "./data";
import { toMin } from "./time";

/* ───────── Tipos ───────── */
export type Sex = "hombre" | "mujer";
export type Goal = "perder" | "mantener" | "ganar";
export type ActivityLevel = "sedentario" | "ligero" | "moderado" | "alto";

export interface UserProfile {
  /** Opcional, solo para saludarte. */
  name: string;
  sex: Sex;
  birthYear: number;
  heightCm: number;
  /** Peso al empezar: es el punto de partida de tu progreso. */
  startWeightKg: number;
  goalWeightKg: number;
  goal: Goal;
  activity: ActivityLevel;
  trainingDays: Weekday[];
  wake: string;
  bed: string;
  workStart: string | null;
  workEnd: string | null;
  trainStart: string;
  trainMinutes: number;
  caffeineCutoff: string;
  kcalTarget: number;
  proteinTargetG: number;
  waterGoalMl: number;
  modules: { trading: boolean };
  createdAt: string;
}

export const MIN_ADULT_AGE = 18;
export const MAX_AGE = 90;
export const TRAIN_DURATIONS = [45, 60, 75, 90, 120] as const;

export const GOAL_OPTIONS: readonly { id: Goal; label: string; hint: string }[] = [
  { id: "perder", label: "Perder grasa", hint: "Déficit moderado de calorías" },
  { id: "mantener", label: "Mantener mi peso", hint: "Calorías de mantenimiento" },
  { id: "ganar", label: "Ganar músculo", hint: "Ligero superávit de calorías" },
];

export const ACTIVITY_OPTIONS: readonly { id: ActivityLevel; label: string; hint: string; factor: number }[] = [
  { id: "sedentario", label: "Sedentario", hint: "Trabajo sentado, poco movimiento fuera del gimnasio", factor: 1.2 },
  { id: "ligero", label: "Ligero", hint: "De pie o caminando parte del día", factor: 1.3 },
  { id: "moderado", label: "Moderado", hint: "Mucho movimiento durante el día", factor: 1.4 },
  { id: "alto", label: "Alto", hint: "Trabajo físico exigente", factor: 1.5 },
];

/* ───────── Utilidades ───────── */
export const ageFrom = (birthYear: number, now: Date = new Date()): number => now.getFullYear() - birthYear;
export const bmiOf = (kg: number, cm: number): number => kg / (cm / 100) ** 2;
export const isTime = (s: string): boolean => /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
const roundTo = (n: number, step: number) => Math.round(n / step) * step;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

export function parseNum(s: string): number {
  const n = parseFloat(s.replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

export function fmtTime(minuteOfDay: number): string {
  const m = ((Math.round(minuteOfDay) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

export const addMinutes = (hhmm: string, minutes: number): string => fmtTime(toMin(hhmm) + minutes);

/** Cafeína: 8 h antes de dormir, y nunca antes de una hora después de despertar. */
export function defaultCaffeineCutoff(wake: string, bed: string): string {
  const w = toMin(wake);
  const bedOff = (toMin(bed) - w + 1440) % 1440;
  const cutoffOff = clamp(bedOff - 480, 60, Math.max(60, bedOff - 60));
  return fmtTime(w + cutoffOff);
}

export const sleepMinutesOf = (wake: string, bed: string): number => (toMin(wake) - toMin(bed) + 1440) % 1440;

/* ───────── Metas calculadas ───────── */
export interface TargetInput {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  goalWeightKg: number;
  goal: Goal;
  activity: ActivityLevel;
  trainingDaysCount: number;
}

export interface Targets {
  bmr: number;
  tdee: number;
  kcalTarget: number;
  proteinTargetG: number;
  waterGoalMl: number;
  /** Se aplicó el mínimo de seguridad de calorías. */
  floorApplied: boolean;
}

/** Mifflin-St Jeor × actividad diaria + energía del entrenamiento. Es una estimación (±10 %). */
export function computeTargets(i: TargetInput): Targets {
  const bmr = 10 * i.weightKg + 6.25 * i.heightCm - 5 * i.age + (i.sex === "hombre" ? 5 : -161);
  const lifestyle = ACTIVITY_OPTIONS.find((a) => a.id === i.activity)?.factor ?? 1.2;
  const tdee = bmr * lifestyle + (i.trainingDaysCount * 350) / 7;
  const floor = i.sex === "hombre" ? 1500 : 1200;

  let kcal = tdee;
  if (i.goal === "perder") kcal = tdee * 0.8;
  else if (i.goal === "ganar") kcal = tdee * 1.1;
  const floorApplied = kcal < floor;
  const kcalTarget = roundTo(Math.max(kcal, floor), 50);

  const protein = i.goal === "perder" ? 1.6 * i.goalWeightKg : i.goal === "ganar" ? 1.8 * i.weightKg : 1.4 * i.weightKg;
  const proteinTargetG = roundTo(clamp(protein, 70, 220), 5);
  const waterGoalMl = roundTo(clamp(35 * i.weightKg, 2000, 4500), 250);

  return { bmr: Math.round(bmr), tdee: Math.round(tdee), kcalTarget, proteinTargetG, waterGoalMl, floorApplied };
}

/* ───────── Validación (devuelve lista de errores en español) ───────── */
export function validateBody(d: { sex: string; birthYear: string; heightCm: string; weightKg: string }, now: Date = new Date()): string[] {
  const errors: string[] = [];
  if (d.sex !== "hombre" && d.sex !== "mujer") errors.push("Elige tu sexo: se usa solo para estimar tus calorías.");
  const year = parseNum(d.birthYear);
  if (!Number.isInteger(year) || year < now.getFullYear() - 100 || year > now.getFullYear()) errors.push("Escribe tu año de nacimiento (por ejemplo, 1995).");
  else if (ageFrom(year, now) < MIN_ADULT_AGE) errors.push("GYMRAT calcula metas de calorías solo para personas de 18 años o más. Si eres menor, consulta con un profesional de la salud o con tu entrenador.");
  else if (ageFrom(year, now) > MAX_AGE) errors.push("Revisa tu año de nacimiento.");
  const h = parseNum(d.heightCm);
  if (!(h >= 120 && h <= 230)) errors.push("La altura debe estar entre 120 y 230 cm.");
  const w = parseNum(d.weightKg);
  if (!(w >= 35 && w <= 300)) errors.push("El peso debe estar entre 35 y 300 kg.");
  return errors;
}

export function validateGoal(d: { goal: Goal; weightKg: string; heightCm: string; goalWeightKg: string; trainingDays: readonly Weekday[] }): string[] {
  const errors: string[] = [];
  const w = parseNum(d.weightKg);
  const h = parseNum(d.heightCm);
  if (d.goal === "perder" && w >= 35 && h >= 120 && bmiOf(w, h) < 21) {
    errors.push("Con tu peso y altura actuales no recomendamos un déficit de calorías. Elige «Mantener mi peso» o «Ganar músculo», o consulta con un profesional si quieres bajar de peso.");
    return errors;
  }
  if (d.goal !== "mantener") {
    const g = parseNum(d.goalWeightKg);
    if (!(g >= 35 && g <= 300)) errors.push("Escribe tu peso meta (entre 35 y 300 kg).");
    else {
      if (d.goal === "perder" && !(g < w - 0.4)) errors.push("Para perder grasa, tu peso meta debe ser menor que tu peso actual.");
      if (d.goal === "ganar" && !(g > w + 0.4)) errors.push("Para ganar músculo, tu peso meta debe ser mayor que tu peso actual.");
      if (h >= 120) {
        const bmi = bmiOf(g, h);
        if (bmi < 18.5) errors.push("Esa meta queda por debajo de un peso saludable (IMC menor de 18.5). Elige una meta más alta.");
        else if (d.goal === "perder" && bmi < 20) errors.push("Esa meta queda muy cerca del límite inferior de un peso saludable. Elige una meta algo más alta.");
        else if (bmi > 40) errors.push("Esa meta queda en un IMC muy alto. Elige una meta intermedia; podrás ajustarla después.");
      }
    }
  }
  if (d.trainingDays.length < 2) errors.push("Elige al menos 2 días de entrenamiento por semana.");
  return errors;
}

export function validateDay(d: { wake: string; bed: string; hasWork: boolean; workStart: string; workEnd: string; trainStart: string; trainMinutes: number; caffeineCutoff: string }): string[] {
  const errors: string[] = [];
  if (![d.wake, d.bed, d.trainStart, d.caffeineCutoff].every(isTime)) return ["Completa todas las horas."];
  const wake = toMin(d.wake);
  const off = (t: string) => (toMin(t) - wake + 1440) % 1440;
  const sleep = sleepMinutesOf(d.wake, d.bed);
  if (sleep < 240 || sleep > 840) errors.push("Entre tu hora de dormir y de despertar debe haber de 4 a 14 horas de sueño.");
  const bedOff = off(d.bed);
  if (d.hasWork) {
    if (!isTime(d.workStart) || !isTime(d.workEnd)) errors.push("Completa el inicio y el fin de tu trabajo o estudio.");
    else {
      const s = off(d.workStart);
      const e = off(d.workEnd);
      if (!(e > s)) errors.push("Tu horario de trabajo no puede cruzar tu hora de despertar.");
      else if (e > bedOff) errors.push("Tu trabajo o estudio debe terminar antes de tu hora de dormir.");
    }
  }
  const ts = off(d.trainStart);
  if (ts < 30 || ts + d.trainMinutes > bedOff - 30) errors.push("El entrenamiento debe empezar al menos 30 min después de despertar y terminar 30 min antes de dormir.");
  const c = off(d.caffeineCutoff);
  if (c < 30 || c > bedOff) errors.push("El límite de cafeína debe estar entre tu hora de despertar y tu hora de dormir.");
  return errors;
}

export function validateTargets(d: { kcalTarget: number; proteinTargetG: number; waterGoalMl: number }): string[] {
  const errors: string[] = [];
  if (!(d.kcalTarget >= 1200 && d.kcalTarget <= 6000)) errors.push("Las calorías deben estar entre 1,200 y 6,000 al día.");
  if (!(d.proteinTargetG >= 40 && d.proteinTargetG <= 400)) errors.push("La proteína debe estar entre 40 y 400 g al día.");
  if (!(d.waterGoalMl >= 1000 && d.waterGoalMl <= 6000)) errors.push("El agua debe estar entre 1,000 y 6,000 ml al día.");
  return errors;
}

/* ───────── Horario del día generado desde el perfil ───────── */
type CellId = "free" | "work" | "breakfast" | "lunch" | "dinner" | "train" | "sleep" | "wake";

const CELLS: Record<CellId, { activity: string; category: Category; description: string }> = {
  free: { activity: "Tiempo libre", category: "Libre", description: "Recuperación, familia, estudio o lo que elijas." },
  work: { activity: "Trabajo o estudio", category: "Trabajo", description: "Bloque de concentración. Hidrátate y muévete cada hora." },
  breakfast: { activity: "Desayuno", category: "Nutrición", description: "Proteína y carbohidrato para empezar el día." },
  lunch: { activity: "Almuerzo", category: "Nutrición", description: "Proteína magra, carbohidrato y verduras." },
  dinner: { activity: "Cena", category: "Nutrición", description: "Cena proteica y ligera, sin comer muy cerca de dormir." },
  train: { activity: "Entrenamiento", category: "Gym", description: "Si hoy toca entrenar, sigue la rutina de la pestaña Rutina y usa el cronómetro entre series." },
  sleep: { activity: "Sueño", category: "Sueño", description: "Luz baja, sin pantallas brillantes y la habitación fresca." },
  wake: { activity: "Despertar y aseo", category: "Rutina", description: "Agua, luz natural y unos minutos para arrancar." },
};

export function buildSchedule(p: Pick<UserProfile, "wake" | "bed" | "workStart" | "workEnd" | "trainStart" | "trainMinutes">): ScheduleItem[] {
  const wake = toMin(p.wake);
  const off = (t: string) => (toMin(t) - wake + 1440) % 1440;
  const bedOff = off(p.bed) || 1440;
  const grid: CellId[] = new Array<CellId>(1440).fill("free");
  const paint = (start: number, dur: number, id: CellId) => {
    for (let m = Math.max(0, start); m < Math.min(1440, start + dur); m++) grid[m] = id;
  };

  if (p.workStart && p.workEnd) {
    const s = off(p.workStart);
    const e = off(p.workEnd);
    if (e > s) paint(s, Math.min(e, bedOff) - s, "work");
  }

  const trainS = off(p.trainStart);
  const trainE = trainS + p.trainMinutes;
  const taken: Array<[number, number]> = [[trainS, trainE]];
  const free = (s: number, d: number) => s >= 60 && s + d <= bedOff - 15 && taken.every(([a, b]) => s >= b || s + d <= a);
  const place = (pref: number, dur: number): number | null => {
    for (const c of [pref, trainE + 15, trainS - dur - 45]) {
      if (free(c, dur)) {
        taken.push([c, c + dur]);
        return c;
      }
    }
    return null;
  };

  paint(30, 30, "breakfast");
  const lunchPref = off("13:00");
  const lunchAt = place(lunchPref >= 60 && lunchPref <= bedOff - 150 ? lunchPref : Math.round(bedOff * 0.45), 45);
  if (lunchAt !== null) paint(lunchAt, 45, "lunch");
  const dinnerAt = place(bedOff - 150, 45);
  if (dinnerAt !== null) paint(dinnerAt, 45, "dinner");

  paint(trainS, p.trainMinutes, "train");
  paint(bedOff, 1440 - bedOff, "sleep");
  paint(0, 30, "wake");

  const items: ScheduleItem[] = [];
  let runStart = 0;
  for (let m = 1; m <= 1440; m++) {
    if (m === 1440 || grid[m] !== grid[runStart]) {
      const cell = CELLS[grid[runStart]];
      items.push({ start: fmtTime(wake + runStart), end: fmtTime(wake + m), activity: cell.activity, category: cell.category, description: cell.description });
      runStart = m;
    }
  }
  return items;
}

/* ───────── Validación de datos guardados o importados ───────── */
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Devuelve el perfil si todos sus campos son válidos; si no, undefined (se pedirá de nuevo). */
export function sanitizeProfile(raw: unknown, now: Date = new Date()): UserProfile | undefined {
  if (!isRecord(raw)) return undefined;
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : NaN);

  const sex = raw.sex === "hombre" || raw.sex === "mujer" ? raw.sex : undefined;
  const goal = raw.goal === "perder" || raw.goal === "mantener" || raw.goal === "ganar" ? raw.goal : undefined;
  const activity = ACTIVITY_OPTIONS.find((a) => a.id === raw.activity)?.id;
  const days = Array.isArray(raw.trainingDays) ? WEEKDAYS.filter((d) => (raw.trainingDays as unknown[]).includes(d)) : [];
  if (!sex || !goal || !activity) return undefined;

  const modules = isRecord(raw.modules) ? raw.modules : {};
  const workStart = str(raw.workStart);
  const workEnd = str(raw.workEnd);
  const hasWork = isTime(workStart) && isTime(workEnd);
  const profile: UserProfile = {
    name: str(raw.name).trim().slice(0, 40),
    sex,
    birthYear: num(raw.birthYear),
    heightCm: num(raw.heightCm),
    startWeightKg: num(raw.startWeightKg),
    goalWeightKg: num(raw.goalWeightKg),
    goal,
    activity,
    trainingDays: days,
    wake: str(raw.wake),
    bed: str(raw.bed),
    workStart: hasWork ? workStart : null,
    workEnd: hasWork ? workEnd : null,
    trainStart: str(raw.trainStart),
    trainMinutes: num(raw.trainMinutes),
    caffeineCutoff: str(raw.caffeineCutoff),
    kcalTarget: num(raw.kcalTarget),
    proteinTargetG: num(raw.proteinTargetG),
    waterGoalMl: num(raw.waterGoalMl),
    modules: { trading: modules.trading === true },
    createdAt: str(raw.createdAt) || now.toISOString().slice(0, 10),
  };

  const problems = [
    ...validateBody({ sex: profile.sex, birthYear: String(profile.birthYear), heightCm: String(profile.heightCm), weightKg: String(profile.startWeightKg) }, now),
    ...validateGoal({ goal: profile.goal, weightKg: String(profile.startWeightKg), heightCm: String(profile.heightCm), goalWeightKg: String(profile.goalWeightKg), trainingDays: profile.trainingDays }),
    ...validateDay({ wake: profile.wake, bed: profile.bed, hasWork, workStart, workEnd, trainStart: profile.trainStart, trainMinutes: profile.trainMinutes, caffeineCutoff: profile.caffeineCutoff }),
    ...validateTargets(profile),
  ];
  if (!(TRAIN_DURATIONS as readonly number[]).includes(profile.trainMinutes)) problems.push("duración");
  return problems.length ? undefined : profile;
}
