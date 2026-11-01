import { deepEqual, mergeStates } from "./sync-merge";

/** Lo que este dispositivo recuerda de la última sincronización con la nube. */
export interface SyncMeta {
  /** Revisión del servidor (null si la nube todavía no tiene datos de este usuario). */
  revision: string | null;
  /** Estado que había en la nube en esa revisión: es la referencia para fusionar. */
  base: unknown | null;
}

export interface Remote {
  state: unknown | null;
  updatedAt: string | null;
}

export type PutResult = { ok: true; updatedAt: string | null } | { conflict: true; state: unknown | null; updatedAt: string | null };

export interface Transport {
  get(): Promise<Remote>;
  /** Guarda `state` solo si la nube sigue en `baseRevision`; si no, devuelve el conflicto. */
  put(state: unknown, baseRevision: string | null): Promise<PutResult>;
}

export interface Codec<S> {
  sanitize(raw: unknown): S;
  empty(): S;
}

export const EMPTY_META: SyncMeta = { revision: null, base: null };

export class SyncConflictError extends Error {
  constructor() {
    super("Los datos cambiaron en otro dispositivo mientras se guardaba. Se reintentará en unos segundos.");
    this.name = "SyncConflictError";
  }
}

/** ¿Hay cambios locales que la nube todavía no tiene? */
export function isDirty<S>(state: S, meta: SyncMeta, codec: Codec<S>): boolean {
  return !deepEqual(state, meta.base ?? codec.empty());
}

/**
 * Primera conexión: junta lo que había guardado en este dispositivo con lo que hay en la nube.
 * Nunca descarta cambios hechos sin conexión.
 */
export function reconcileOnLoad<S>(local: S, localMeta: SyncMeta | null, remote: Remote, codec: Codec<S>): { state: S; meta: SyncMeta } {
  if (remote.state == null) return { state: local, meta: { revision: null, base: null } };
  const remoteState = codec.sanitize(remote.state);
  // Sin referencia guardada (primera conexión de un dispositivo con datos anteriores) la base es desconocida;
  // si la referencia existe pero está vacía, es que la nube no tenía datos cuando este dispositivo se conectó.
  const baseline = localMeta === null ? null : localMeta.base != null ? codec.sanitize(localMeta.base) : codec.empty();
  const state = codec.sanitize(mergeStates(baseline, local, remoteState));
  return { state, meta: { revision: remote.updatedAt, base: remoteState } };
}

/**
 * Sube los cambios locales. Si otro dispositivo guardó antes, fusiona y reintenta.
 * Devuelve el estado final (puede incluir cambios del otro dispositivo) y la nueva referencia.
 */
export async function pushState<S>(state: S, meta: SyncMeta, transport: Transport, codec: Codec<S>, maxAttempts = 4): Promise<{ state: S; meta: SyncMeta }> {
  let current = state;
  let m = meta;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (!isDirty(current, m, codec)) return { state: current, meta: m };
    const result = await transport.put(current, m.revision);
    if ("ok" in result) return { state: current, meta: { revision: result.updatedAt, base: current } };
    if (result.state == null) {
      // La fila ya no existe en la nube: se vuelve a crear con lo que tenemos.
      m = { revision: null, base: null };
      continue;
    }
    const remoteState = codec.sanitize(result.state);
    current = codec.sanitize(mergeStates(m.base != null ? codec.sanitize(m.base) : codec.empty(), current, remoteState));
    m = { revision: result.updatedAt, base: remoteState };
  }
  throw new SyncConflictError();
}

/**
 * Trae los cambios que otro dispositivo guardó. Devuelve null si no hay nada nuevo.
 * Si hay cambios locales sin subir, los fusiona; si no, adopta la versión de la nube.
 */
export async function pullState<S>(state: S, meta: SyncMeta, transport: Transport, codec: Codec<S>): Promise<{ state: S; meta: SyncMeta } | null> {
  const remote = await transport.get();
  if (remote.state == null || remote.updatedAt === meta.revision) return null;
  const remoteState = codec.sanitize(remote.state);
  const next = isDirty(state, meta, codec) ? codec.sanitize(mergeStates(meta.base != null ? codec.sanitize(meta.base) : codec.empty(), state, remoteState)) : remoteState;
  return { state: next, meta: { revision: remote.updatedAt, base: remoteState } };
}
