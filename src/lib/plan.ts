import { WEEKDAYS, type Weekday } from "./config";
import { WORKOUTS, WORKOUT_FOCUS, type Exercise } from "./data";

/** Rutinas (identificadas por su día original) que se usan según cuántos días entrenas por semana. */
const SPLITS: Record<number, readonly Weekday[]> = {
  2: ["Miércoles", "Jueves"], // pierna + torso
  3: ["Lunes", "Martes", "Miércoles"], // empuje, tirón, pierna
  4: ["Lunes", "Martes", "Miércoles", "Jueves"],
  5: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"],
  6: WEEKDAYS,
};

export interface DayPlan {
  /** Día de la semana en que entrenas. */
  day: Weekday;
  /** Rutina que corresponde (su id de ejercicio no cambia). */
  routine: Weekday;
  focus: string;
  exercises: Exercise[];
}

export const DEFAULT_TRAINING_DAYS: readonly Weekday[] = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

export function trainingPlan(days: readonly Weekday[]): DayPlan[] {
  const sorted = WEEKDAYS.filter((d) => days.includes(d));
  const split = SPLITS[Math.min(6, Math.max(2, sorted.length))];
  return sorted.map((day, i) => {
    const routine = split[i % split.length];
    return { day, routine, focus: WORKOUT_FOCUS[routine], exercises: WORKOUTS[routine] };
  });
}

export function planFor(days: readonly Weekday[], day: Weekday | null): DayPlan | null {
  if (!day) return null;
  return trainingPlan(days).find((p) => p.day === day) ?? null;
}
