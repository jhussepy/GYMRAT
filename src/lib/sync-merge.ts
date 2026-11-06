/**
 * Fusión de 3 vías entre dos versiones del estado de un usuario.
 *
 *   base   = último estado que este dispositivo sincronizó con la nube
 *   local  = lo que hay ahora en este dispositivo
 *   remote = lo que hay ahora en la nube (otro dispositivo pudo cambiarlo)
 *
 * Reglas:
 *  - Si solo cambió un lado, se respeta ese cambio (incluidas las eliminaciones).
 *  - Si cambiaron los dos lados y tocaron cosas distintas, se conservan ambos cambios.
 *  - Si los dos editaron exactamente el mismo dato, gana este dispositivo (`local`).
 *  - El agua es un contador: los incrementos de ambos dispositivos se suman.
 *  - El perfil se trata como una unidad: nunca mezcla campos de dos versiones.
 */

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Igualdad profunda que ignora el orden de las claves (jsonb de Postgres las reordena). */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((v, i) => deepEqual(v, b[i]));
  if (isObj(a) && isObj(b)) {
    const keysA = Object.keys(a).filter((k) => a[k] !== undefined);
    const keysB = Object.keys(b).filter((k) => b[k] !== undefined);
    return keysA.length === keysB.length && keysA.every((k) => k in b && deepEqual(a[k], b[k]));
  }
  return false;
}

/** Rutas que se comportan como una unidad: si ambos lados cambiaron, gana `local` completo. */
const ATOMIC = new Set(["profile"]);

/** Listas de objetos identificados por una clave: se fusionan elemento por elemento. */
function listKey(path: string[]): string | null {
  const p = path.join(".");
  if (p === "weights" || p === "bodyMeasurements") return "date";
  if (/^nutritionEntries\.[^.]+$/.test(p) || /^waterLog\.[^.]+$/.test(p)) return "id";
  return null;
}

/** Series de un ejercicio (workoutLogs.<fecha>.<ejercicio>): se fusionan por posición. */
const isSetList = (path: string[]) => path.length === 3 && path[0] === "workoutLogs";

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

function mergeKeyedList(path: string[], key: string, base: unknown, local: unknown[], remote: unknown[]): unknown[] {
  const index = (list: unknown): Map<string, unknown> => {
    const map = new Map<string, unknown>();
    if (Array.isArray(list)) for (const item of list) if (isObj(item) && item[key] !== undefined) map.set(String(item[key]), item);
    return map;
  };
  const B = index(base);
  const L = index(local);
  const R = index(remote);
  const order = [...L.keys(), ...[...R.keys()].filter((k) => !L.has(k))];
  const out: unknown[] = [];
  for (const k of order) {
    const merged = merge3([...path, k], B.get(k), L.get(k), R.get(k));
    if (merged !== undefined) out.push(merged);
  }
  return out;
}

function mergeSetList(path: string[], base: unknown, local: unknown[], remote: unknown[]): unknown[] {
  const b = Array.isArray(base) ? base : [];
  const length = Math.max(local.length, remote.length, b.length);
  const out: unknown[] = [];
  for (let i = 0; i < length; i++) {
    const merged = merge3([...path, String(i)], b[i], local[i], remote[i]);
    out.push(merged === undefined ? { kg: "", reps: "" } : merged);
  }
  // Elimina huecos vacíos al final que solo existían como relleno.
  while (out.length > 0 && deepEqual(out[out.length - 1], { kg: "", reps: "" }) && local.length < out.length && remote.length < out.length) out.pop();
  return out;
}

function merge3(path: string[], base: unknown, local: unknown, remote: unknown): unknown {
  // Si ambos lados ya son idénticos se da por hecho que es el mismo cambio. Esto evita contar dos veces
  // un guardado cuya respuesta se perdió, o los datos de quien abre la app sin referencia previa.
  // El agua nueva se guarda vaso por vaso (cada uno con su identificador), así que dos vasos iguales
  // en dos dispositivos son dos registros distintos y no se confunden con un reenvío. Solo los totales
  // antiguos (`water`) siguen siendo un contador.
  if (deepEqual(local, remote)) return local;
  if (deepEqual(local, base)) return remote;
  if (deepEqual(remote, base)) return local;

  // Contador de agua: se suman los incrementos de cada dispositivo.
  if (path[0] === "water" && path.length === 2 && isNum(local) && isNum(remote)) {
    const origin = isNum(base) ? base : 0;
    return Math.min(6000, Math.max(0, origin + (local - origin) + (remote - origin)));
  }

  if (ATOMIC.has(path.join("."))) return local;

  if (isObj(local) && isObj(remote)) {
    const b = isObj(base) ? base : {};
    const out: Record<string, unknown> = {};
    const keys = new Set([...Object.keys(b), ...Object.keys(local), ...Object.keys(remote)]);
    for (const k of keys) {
      const merged = merge3([...path, k], b[k], local[k], remote[k]);
      if (merged !== undefined) out[k] = merged;
    }
    return out;
  }

  // Una lista eliminada por completo (la app borra la fecha al quitar su último elemento) cuenta como lista vacía.
  const asList = (v: unknown) => (Array.isArray(v) ? v : v === undefined ? [] : null);
  const listLocal = asList(local);
  const listRemote = asList(remote);
  if (listLocal && listRemote) {
    const key = listKey(path);
    if (key) {
      const merged = mergeKeyedList(path, key, base, listLocal, listRemote);
      return merged.length === 0 && (path[0] === "nutritionEntries" || path[0] === "waterLog") ? undefined : merged;
    }
    if (isSetList(path)) {
      const merged = mergeSetList(path, base, listLocal, listRemote);
      return merged.length === 0 ? undefined : merged;
    }
  }

  // Conflicto real sobre el mismo dato: gana este dispositivo.
  return local;
}

/**
 * Fusiona dos versiones divergentes. El resultado debe pasar por `sanitize` antes de usarse.
 * `base` null significa "se desconoce la referencia" (por ejemplo, la primera vez que un dispositivo
 * con datos anteriores se conecta): como no se sabe cuánto sumó cada lado, el agua conserva el mayor valor.
 */
export function mergeStates<T>(base: T | null, local: T, remote: T): T {
  const merged = merge3([], base ?? {}, local, remote);
  if (base === null && isObj(merged) && isObj(local) && isObj(remote)) {
    const l = isObj(local.water) ? local.water : {};
    const r = isObj(remote.water) ? remote.water : {};
    const water: Record<string, number> = {};
    for (const key of new Set([...Object.keys(l), ...Object.keys(r)])) {
      const values = [l[key], r[key]].filter(isNum);
      if (values.length) water[key] = Math.max(...values);
    }
    merged.water = water;
  }
  return merged as T;
}
