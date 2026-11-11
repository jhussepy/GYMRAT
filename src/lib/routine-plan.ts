import { WEEKDAYS, type Weekday } from "./config";
import { defaultRoutines, type RoutineDay, type Routines } from "./routines";

export interface DayPlan {
  /** Día de la semana en que entrenas. */
  day: Weekday;
  /** Día de la rutina base que se usa (su id de ejercicios no cambia). */
  routine: Weekday;
  focus: string;
  exercises: RoutineDay["exercises"];
}

/**
 * Reparto de rutinas según cuántos días entrenas. Cada rutina base (Lunes…Sábado) se asigna a un día
 * de entreno en orden. El usuario puede cambiar la rutina de cada base en `routines`.
 */
const SPLITS: Record<number, readonly Weekday[]> = {
  2: ["Miércoles", "Jueves"],
  3: ["Lunes", "Martes", "Miércoles"],
  4: ["Lunes", "Martes", "Miércoles", "Jueves"],
  5: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"],
  6: WEEKDAYS,
};

export const DEFAULT_TRAINING_DAYS: readonly Weekday[] = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

/** Rutinas que el usuario no ha editado: la plantilla actual de GYMRAT. */
const BASE = defaultRoutines();

export function trainingPlan(days: readonly Weekday[], routines?: Routines | null): DayPlan[] {
  const sorted = WEEKDAYS.filter((d) => days.includes(d));
  const split = SPLITS[Math.min(6, Math.max(2, sorted.length))];
  return sorted.map((day, i) => {
    const routine = split[i % split.length];
    const source = routines?.[routine] ?? BASE[routine];
    return { day, routine, focus: source.focus, exercises: source.exercises };
  });
}

export function planFor(days: readonly Weekday[], day: Weekday | null, routines?: Routines | null): DayPlan | null {
  if (!day) return null;
  return trainingPlan(days, routines).find((p) => p.day === day) ?? null;
}
