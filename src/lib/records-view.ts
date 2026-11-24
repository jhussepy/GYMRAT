import type { RoutineDay, Routines } from "./routines";
import { WORKOUTS } from "./data";
import { recordsFor, type WorkoutHistory } from "./records";

export interface RecordRow {
  exerciseId: string;
  name: string;
  maxKg: number;
  maxKgDate: string;
  bestRepsAtMaxKg: { reps: number; date: string } | null;
}

/** Nombre de cada ejercicio: el de la rutina del usuario si lo editó, o el de la plantilla. */
function nameIndex(routines: Routines | undefined): Map<string, string> {
  const names = new Map<string, string>();
  for (const exercises of Object.values(WORKOUTS)) for (const e of exercises) names.set(e.id, e.name);
  for (const day of Object.values(routines ?? {}) as RoutineDay[]) for (const e of day.exercises) names.set(e.id, e.name);
  return names;
}

/** Récords de todos los ejercicios que tienen historial, ordenados por nombre. Solo fuerza (no cardio). */
export function recordsOverview(history: WorkoutHistory, routines: Routines | undefined): RecordRow[] {
  const names = nameIndex(routines);
  const ids = new Set<string>();
  for (const day of Object.values(history)) for (const id of Object.keys(day)) ids.add(id);
  const rows: RecordRow[] = [];
  for (const id of ids) {
    const r = recordsFor(id, history);
    if (!r) continue;
    rows.push({ exerciseId: id, name: names.get(id) ?? id, maxKg: r.maxKg, maxKgDate: r.maxKgDate, bestRepsAtMaxKg: r.bestRepsAtMaxKg });
  }
  return rows.sort((a, b) => a.name.localeCompare(b.name, "es"));
}
