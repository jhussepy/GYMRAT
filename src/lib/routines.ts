import type { Exercise } from "./data";
import { WORKOUTS } from "./data";
import type { Weekday } from "./config";

/** Un ejercicio dentro de una rutina del usuario. El `id` es estable: el historial de series apunta a él. */
export interface RoutineExercise {
  id: string;
  name: string;
  type: "strength" | "cardio";
  sets: number;
  /** Repeticiones (fuerza) o duración (cardio), en texto libre: "8-10", "45 min". */
  reps: string;
  /** Alternativa para cuando la máquina está ocupada. */
  alt: string;
  /** Sustituto sin máquina ni equipo, para el modo "en casa". */
  home?: { name: string; reps: string };
}

/** Rutina de un día de entreno. */
export interface RoutineDay {
  /** Día de la semana en que se entrena. */
  day: Weekday;
  /** Nombre visible: "Empuje", "Tirón", "Pierna"… */
  focus: string;
  exercises: RoutineExercise[];
}

export type Routines = Record<string, RoutineDay>;

export const MAX_EXERCISES_PER_DAY = 12;
export const MAX_SETS = 10;
export const MAX_NAME = 60;

const isStrengthFromExercise = (e: Exercise): RoutineExercise => ({
  id: e.id,
  name: e.name,
  type: e.type,
  sets: e.sets,
  reps: e.reps,
  alt: e.alt,
});

/** Plantilla inicial: la rutina actual de GYMRAT, copiada para que el usuario la pueda cambiar. */
export function defaultRoutines(): Routines {
  const out: Routines = {};
  for (const [day, exercises] of Object.entries(WORKOUTS)) {
    out[day] = { day: day as Weekday, focus: DEFAULT_FOCUS[day as Weekday] ?? day, exercises: exercises.map(isStrengthFromExercise) };
  }
  return out;
}

const DEFAULT_FOCUS: Partial<Record<Weekday, string>> = {
  Lunes: "Empuje",
  Martes: "Tirón",
  Miércoles: "Pierna",
  Jueves: "Torso",
  Viernes: "Posterior",
  Sábado: "Cardio",
};

/** Id nuevo y único para un ejercicio añadido por el usuario. */
export function newExerciseId(day: string, existing: Iterable<string>): string {
  const taken = new Set(existing);
  for (let i = 1; i < 10000; i++) {
    const id = `u-${day.slice(0, 3).toLowerCase()}-${Date.now().toString(36)}-${i}`;
    if (!taken.has(id)) return id;
  }
  return `u-${Math.random().toString(36).slice(2, 12)}`;
}

/** Valida una rutina escrita a mano o recibida de la nube. Devuelve la rutina limpia o null. */
export function sanitizeRoutineDay(raw: unknown, day: Weekday): RoutineDay | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const focus = typeof r.focus === "string" ? r.focus.trim().slice(0, MAX_NAME) : "";
  if (!focus || !Array.isArray(r.exercises)) return null;
  const seen = new Set<string>();
  const exercises: RoutineExercise[] = [];
  for (const e of r.exercises.slice(0, MAX_EXERCISES_PER_DAY)) {
    const x = sanitizeExercise(e);
    if (!x || seen.has(x.id)) continue;
    seen.add(x.id);
    exercises.push(x);
  }
  return { day, focus, exercises };
}

export function sanitizeExercise(raw: unknown): RoutineExercise | null {
  if (typeof raw !== "object" || raw === null) return null;
  const e = raw as Record<string, unknown>;
  const id = typeof e.id === "string" && e.id.length > 0 && e.id.length <= 80 ? e.id : null;
  const name = typeof e.name === "string" ? e.name.trim().slice(0, MAX_NAME) : "";
  const type = e.type === "cardio" ? "cardio" : "strength";
  const sets = typeof e.sets === "number" && Number.isInteger(e.sets) ? Math.min(MAX_SETS, Math.max(1, e.sets)) : 1;
  const reps = typeof e.reps === "string" ? e.reps.trim().slice(0, 20) : "";
  const alt = typeof e.alt === "string" ? e.alt.trim().slice(0, 120) : "";
  if (!id || !name || !reps) return null;
  const out: RoutineExercise = { id, name, type, sets: type === "cardio" ? 1 : sets, reps, alt };
  if (typeof e.home === "object" && e.home !== null) {
    const h = e.home as Record<string, unknown>;
    const hName = typeof h.name === "string" ? h.name.trim().slice(0, MAX_NAME) : "";
    const hReps = typeof h.reps === "string" ? h.reps.trim().slice(0, 20) : "";
    if (hName && hReps) out.home = { name: hName, reps: hReps };
  }
  return out;
}

/** Ejercicio que se muestra según el modo: el sustituto en casa si existe, o el normal. */
export function exerciseFor(e: RoutineExercise, home: boolean): { name: string; reps: string } {
  if (home && e.home) return e.home;
  return { name: e.name, reps: e.reps };
}
