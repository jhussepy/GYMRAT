import { weekdayFromDate } from "./config";
import { WORKOUTS, type Exercise } from "./data";
import { DEFAULT_TRAINING_DAYS, planFor } from "./plan";
import type { AppState, WeightEntry } from "./store";
import { todayISO } from "./time";

/** MET de fuerza (valor prudente entre esfuerzo moderado y vigoroso del Compendio de Actividad Física). */
export const STRENGTH_MET = 4.5;
const CARDIO_MET: Record<string, number> = { "sab-1": 6, "sab-2": 6, "sab-3": 3 };
const DEFAULT_CARDIO_MET = 5;
const REST_DAY_MET = 3.5;
/** Una serie de trabajo (~45 s) más su descanso (~90 s). */
const MINUTES_PER_SET = 2.25;
const WARMUP_MIN = 8;

const EXERCISES = new Map<string, Exercise>(Object.values(WORKOUTS).flat().map((e) => [e.id, e]));

const num = (v: string | undefined): number => {
  const n = parseFloat((v ?? "").replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

export function parseISO(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: string, n: number): string {
  const d = parseISO(date);
  d.setDate(d.getDate() + n);
  return todayISO(d);
}

const isSunday = (date: string) => parseISO(date).getDay() === 0;

/** Peso más reciente hasta esa fecha (o tu peso inicial). Sin perfil se usa 70 kg como referencia. */
export function weightOn(date: string, weights: WeightEntry[], startKg = 70): number {
  let w = startKg;
  for (const e of weights) {
    if (e.date <= date) w = e.kg;
    else break;
  }
  return w;
}

export interface SessionStats {
  date: string;
  trained: boolean;
  /** Detectado por las series registradas. */
  auto: boolean;
  manual: boolean;
  setsDone: number;
  volumeKg: number;
  minutes: number;
  kcalEstimated: number;
  kcalReal?: number;
  /** Calorías que cuentan: las reales si las escribiste, si no la estimación. */
  kcal: number;
}

export function sessionStats(date: string, state: AppState): SessionStats {
  const log = state.workoutLogs[date] ?? {};
  const meta = state.sessions[date];
  const weight = weightOn(date, state.weights, state.profile?.startWeightKg);

  let setsDone = 0;
  let volumeKg = 0;
  let cardioMin = 0;
  let cardioKcal = 0;
  for (const [id, sets] of Object.entries(log)) {
    const ex = EXERCISES.get(id);
    if (!ex) continue;
    if (ex.type === "cardio") {
      const min = num(sets[0]?.reps);
      if (min > 0) {
        cardioMin += min;
        cardioKcal += ((CARDIO_MET[id] ?? DEFAULT_CARDIO_MET) * weight * min) / 60;
      }
    } else {
      for (const s of sets.slice(0, ex.sets)) {
        const reps = num(s.reps);
        if (reps > 0) {
          setsDone++;
          volumeKg += reps * num(s.kg);
        }
      }
    }
  }

  const auto = setsDone > 0 || cardioMin > 0;
  const manual = !!meta?.manual;
  const kcalReal = meta?.kcalReal;
  const trained = auto || manual || !!kcalReal;

  let minutes = 0;
  let kcalEstimated = 0;
  if (auto) {
    const strengthMin = setsDone > 0 ? setsDone * MINUTES_PER_SET + WARMUP_MIN : 0;
    minutes = strengthMin + cardioMin;
    kcalEstimated = (STRENGTH_MET * weight * strengthMin) / 60 + cardioKcal;
  } else if (manual) {
    // Sin series registradas: se asume la sesión completa del plan de ese día.
    const plan = planFor(state.profile?.trainingDays ?? DEFAULT_TRAINING_DAYS, weekdayFromDate(parseISO(date)));
    if (plan) {
      for (const ex of plan.exercises) {
        if (ex.type === "cardio") {
          const min = parseInt(ex.reps, 10) || 0;
          minutes += min;
          kcalEstimated += ((CARDIO_MET[ex.id] ?? DEFAULT_CARDIO_MET) * weight * min) / 60;
        } else {
          const min = ex.sets * MINUTES_PER_SET;
          minutes += min;
          kcalEstimated += (STRENGTH_MET * weight * min) / 60;
        }
      }
      if (plan.routine !== "Sábado") {
        minutes += WARMUP_MIN;
        kcalEstimated += (STRENGTH_MET * weight * WARMUP_MIN) / 60;
      }
    } else {
      minutes = 45;
      kcalEstimated = (REST_DAY_MET * weight * 45) / 60;
    }
  }

  const est = Math.round(kcalEstimated);
  return { date, trained, auto, manual, setsDone, volumeKg: Math.round(volumeKg), minutes: Math.round(minutes), kcalEstimated: est, kcalReal, kcal: trained ? (kcalReal ?? est) : 0 };
}

export function trainedDates(state: AppState): string[] {
  const keys = new Set([...Object.keys(state.workoutLogs), ...Object.keys(state.sessions)]);
  return [...keys].filter((d) => sessionStats(d, state).trained).sort();
}

export interface Summary {
  currentStreak: number;
  bestStreak: number;
  weekDone: number;
  weekPlanned: number;
  weekKcal: number;
}

/** Lunes de la semana de `date`. */
export function mondayOf(date: string): string {
  const dow = (parseISO(date).getDay() + 6) % 7;
  return addDays(date, -dow);
}

/**
 * Las rachas cuentan días de entreno (lunes a sábado). El domingo es descanso y no rompe la racha.
 * Si hoy todavía no entrenas, la racha sigue viva hasta que termine el día.
 */
export function computeSummary(state: AppState, today: string): Summary {
  const dates = trainedDates(state);
  const set = new Set(dates);

  let currentStreak = 0;
  if (dates.length > 0) {
    const first = dates[0];
    let d = set.has(today) ? today : addDays(today, -1);
    while (d >= first) {
      if (!isSunday(d)) {
        if (set.has(d)) currentStreak++;
        else break;
      }
      d = addDays(d, -1);
    }
  }

  let bestStreak = 0;
  if (dates.length > 0) {
    let run = 0;
    for (let d = dates[0]; d <= today; d = addDays(d, 1)) {
      if (isSunday(d)) continue;
      if (set.has(d)) {
        run++;
        bestStreak = Math.max(bestStreak, run);
      } else run = 0;
    }
  }

  const monday = mondayOf(today);
  let weekDone = 0;
  let weekKcal = 0;
  for (let i = 0; i < 7; i++) {
    const d = addDays(monday, i);
    const st = sessionStats(d, state);
    if (st.trained) {
      if (i < 6) weekDone++;
      weekKcal += st.kcal;
    }
  }
  return { currentStreak, bestStreak, weekDone, weekPlanned: 6, weekKcal };
}
