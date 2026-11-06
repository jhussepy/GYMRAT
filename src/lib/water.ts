export const MAX_WATER_ML = 6000;

/** Un vaso (o botella) registrado. Cada uno tiene su propio identificador: así dos dispositivos que suman lo mismo son dos registros distintos. */
export interface WaterEntry {
  id: string;
  ml: number;
}

export interface WaterState {
  /** Totales antiguos por día (anteriores al registro por vaso). Siguen contando. */
  water: Record<string, number>;
  waterLog: Record<string, WaterEntry[]>;
}

export function newId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  } catch {
    /* contexto no seguro: se usa el respaldo */
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Agua del día: los totales antiguos más cada vaso registrado, entre 0 y el máximo diario. */
export function waterTotal(state: WaterState, date: string): number {
  const legacy = state.water[date] ?? 0;
  const logged = (state.waterLog[date] ?? []).reduce((sum, entry) => sum + entry.ml, 0);
  return Math.min(MAX_WATER_ML, Math.max(0, legacy + logged));
}

/**
 * Suma o resta agua. Sumar crea un registro nuevo. Restar quita primero los registros más recientes
 * (y recorta el último si hace falta) y, si aún falta, descuenta del total antiguo.
 */
export function applyWater(state: WaterState, date: string, ml: number): WaterState {
  const total = waterTotal(state, date);
  const log = [...(state.waterLog[date] ?? [])];
  let legacy = state.water[date] ?? 0;

  if (ml > 0) {
    const add = Math.min(ml, MAX_WATER_ML - total);
    if (add <= 0) return state;
    log.push({ id: newId(), ml: add });
  } else if (ml < 0) {
    let remaining = Math.min(-ml, total);
    while (remaining > 0 && log.length > 0) {
      const last = log[log.length - 1];
      if (last.ml <= remaining) {
        remaining -= last.ml;
        log.pop();
      } else {
        log[log.length - 1] = { ...last, ml: last.ml - remaining };
        remaining = 0;
      }
    }
    if (remaining > 0) legacy = Math.max(0, legacy - remaining);
  } else {
    return state;
  }

  const waterLog = { ...state.waterLog };
  if (log.length) waterLog[date] = log;
  else delete waterLog[date];
  const water = { ...state.water };
  if (legacy > 0) water[date] = legacy;
  else delete water[date];
  return { water, waterLog };
}
