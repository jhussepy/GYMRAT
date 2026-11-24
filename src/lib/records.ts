/** Una serie registrada: peso (kg) y repeticiones, como texto tal como la escribió la persona. */
export interface LoggedSet {
  kg: string;
  reps: string;
}

/** Historial por fecha: fecha → ejercicio → series. */
export type WorkoutHistory = Record<string, Record<string, LoggedSet[]>>;

export interface Record1RM {
  /** Mayor peso levantado con al menos una repetición. */
  maxKg: number;
  /** Fecha en que se registró ese peso. */
  maxKgDate: string;
  /** Mejor cantidad de repeticiones con el mismo peso o más, y su fecha. */
  bestRepsAtMaxKg: { reps: number; date: string } | null;
  /** Mayor volumen de una sola serie (kg × reps). */
  bestVolumeSet: { volume: number; kg: number; reps: number; date: string } | null;
}

const num = (v: string): number => {
  const n = parseFloat(v.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/** Estimación de una repetición máxima (Epley). Útil para comparar series de distintas repeticiones. */
export function estimatedOneRepMax(kg: number, reps: number): number {
  if (reps <= 0) return 0;
  if (reps === 1) return kg;
  return kg * (1 + reps / 30);
}

/**
 * Récords de un ejercicio a partir de todo el historial. Solo cuentan series con peso y repeticiones
 * positivas. Un empate se queda con la fecha más antigua (el primer día que se logró).
 */
export function recordsFor(exerciseId: string, history: WorkoutHistory): Record1RM | null {
  let maxKg = 0;
  let maxKgDate = "";
  let bestReps: { reps: number; date: string } | null = null;
  let bestVolume: Record1RM["bestVolumeSet"] = null;

  const dates = Object.keys(history).sort();
  for (const date of dates) {
    const sets = history[date]?.[exerciseId] ?? [];
    for (const s of sets) {
      const kg = num(s.kg);
      const reps = Math.round(num(s.reps));
      if (kg <= 0 || reps <= 0) continue;
      if (kg > maxKg) {
        maxKg = kg;
        maxKgDate = date;
      }
      const volume = Math.round(kg * reps * 10) / 10;
      if (!bestVolume || volume > bestVolume.volume) bestVolume = { volume, kg, reps, date };
    }
  }
  if (maxKg === 0) return null;

  // Mejores repeticiones con el peso récord (o más).
  for (const date of dates) {
    for (const s of history[date]?.[exerciseId] ?? []) {
      const kg = num(s.kg);
      const reps = Math.round(num(s.reps));
      if (kg < maxKg || reps <= 0) continue;
      if (!bestReps || reps > bestReps.reps) bestReps = { reps, date };
    }
  }

  return { maxKg, maxKgDate, bestRepsAtMaxKg: bestReps, bestVolumeSet: bestVolume };
}

/**
 * ¿Esta serie supera un récord ya conocido? Se compara contra el historial ANTERIOR a la serie,
 * así que una serie nunca se celebra contra sí misma.
 */
export function isNewRecord(kgText: string, repsText: string, previous: Record1RM | null): { kg: boolean; reps: boolean } {
  const kg = num(kgText);
  const reps = Math.round(num(repsText));
  if (!previous || kg <= 0 || reps <= 0) return { kg: false, reps: false };
  return {
    kg: kg > previous.maxKg,
    reps: kg >= previous.maxKg && (previous.bestRepsAtMaxKg === null || reps > previous.bestRepsAtMaxKg.reps),
  };
}

/** Historial sin la fecha de hoy: base para decidir si una serie de hoy es récord. */
export function historyBefore(history: WorkoutHistory, date: string): WorkoutHistory {
  const out: WorkoutHistory = {};
  for (const [d, day] of Object.entries(history)) if (d < date) out[d] = day;
  return out;
}
