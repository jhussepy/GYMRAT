"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { STORAGE_KEY } from "./config";
import type { ScheduleItem } from "./data";
import { buildSchedule, sanitizeProfile, type UserProfile } from "./profile";
import { EMPTY_META, isDirty, pullState, pushState, reconcileOnLoad, type Codec, type SyncMeta, type Transport } from "./sync-engine";
import { deepEqual, mergeStates } from "./sync-merge";
import { applyWater, MAX_WATER_ML, type WaterEntry } from "./water";

export interface SetLog {
  kg: string;
  reps: string;
}
export interface WeightEntry {
  date: string;
  kg: number;
}
export interface BodyMeasurementEntry {
  date: string;
  weightKg: number;
  waistCm?: number;
  bodyFatPercent?: number;
  skeletalMuscleKg?: number;
  visceralFatLevel?: number;
}
export interface NutritionEntry {
  id: string;
  date: string;
  name: string;
  kcal: number;
  protein: number;
}
export interface SessionMeta {
  /** Día marcado a mano como entrenado (sin series registradas). */
  manual?: boolean;
  /** Calorías reales (reloj o pulsera), si las conoces. */
  kcalReal?: number;
}
export interface SleepRecoveryEntry {
  sleepHours: number;
  quality: number;
  energy: number;
  fatigue: number;
}
export interface AppState {
  version: 10;
  /** ml de agua por fecha (YYYY-MM-DD) */
  /** Totales antiguos por día (anteriores al registro por vaso). */
  water: Record<string, number>;
  /** Agua registrada vaso por vaso: fecha → registros con identificador propio. */
  waterLog: Record<string, WaterEntry[]>;
  /** fecha → id de ejercicio → series registradas */
  workoutLogs: Record<string, Record<string, SetLog[]>>;
  weights: WeightEntry[];
  /** Mediciones corporales fechadas, independientes del pesaje semanal. */
  bodyMeasurements: BodyMeasurementEntry[];
  /** Alimentos realmente consumidos, agrupados por fecha. */
  nutritionEntries: Record<string, NutritionEntry[]>;
  shopping: Record<string, boolean>;
  /** fecha → marcas manuales y calorías reales */
  sessions: Record<string, SessionMeta>;
  /** fecha → sueño total (incluidas siestas) y valoración subjetiva */
  sleepRecovery: Record<string, SleepRecoveryEntry>;
  /** Datos personales y metas del usuario. Sin perfil, la app muestra el registro inicial. */
  profile?: UserProfile;
}

const emptyState = (): AppState => ({ version: 10, water: {}, waterLog: {}, workoutLogs: {}, weights: [], bodyMeasurements: [], nutritionEntries: {}, shopping: {}, sessions: {}, sleepRecovery: {} });

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Valida datos externos (localStorage o archivo importado) y descarta lo que no encaje. */
function sanitize(raw: unknown): AppState {
  const base = emptyState();
  if (!isRecord(raw)) return base;
  if (isRecord(raw.waterLog)) {
    for (const [date, entries] of Object.entries(raw.waterLog)) {
      if (!Array.isArray(entries)) continue;
      const seen = new Set<string>();
      const clean: WaterEntry[] = [];
      for (const e of entries.slice(0, 200)) {
        if (!isRecord(e) || typeof e.id !== "string" || e.id.length === 0 || e.id.length > 80 || seen.has(e.id)) continue;
        if (typeof e.ml !== "number" || !Number.isFinite(e.ml) || e.ml < 1 || e.ml > MAX_WATER_ML) continue;
        seen.add(e.id);
        clean.push({ id: e.id, ml: Math.round(e.ml) });
      }
      if (clean.length) base.waterLog[date] = clean;
    }
  }
  if (isRecord(raw.water)) {
    for (const [k, v] of Object.entries(raw.water)) if (typeof v === "number" && Number.isFinite(v)) base.water[k] = v;
  }
  if (isRecord(raw.workoutLogs)) {
    for (const [date, day] of Object.entries(raw.workoutLogs)) {
      if (!isRecord(day)) continue;
      base.workoutLogs[date] = {};
      for (const [ex, sets] of Object.entries(day)) {
        if (!Array.isArray(sets)) continue;
        base.workoutLogs[date][ex] = sets
          .filter(isRecord)
          .map((x) => ({ kg: typeof x.kg === "string" ? x.kg : "", reps: typeof x.reps === "string" ? x.reps : "" }));
      }
    }
  }
  if (Array.isArray(raw.weights)) {
    base.weights = raw.weights
      .filter(isRecord)
      .filter((w) => typeof w.date === "string" && typeof w.kg === "number" && Number.isFinite(w.kg))
      .map((w) => ({ date: w.date as string, kg: w.kg as number }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
  if (Array.isArray(raw.bodyMeasurements)) {
    base.bodyMeasurements = raw.bodyMeasurements
      .filter(isRecord)
      .filter((m) => typeof m.date === "string" && typeof m.weightKg === "number" && Number.isFinite(m.weightKg))
      .map((m) => {
        const entry: BodyMeasurementEntry = { date: m.date as string, weightKg: m.weightKg as number };
        if (typeof m.waistCm === "number" && Number.isFinite(m.waistCm) && m.waistCm > 0) entry.waistCm = m.waistCm;
        if (typeof m.bodyFatPercent === "number" && Number.isFinite(m.bodyFatPercent) && m.bodyFatPercent > 0 && m.bodyFatPercent < 75) entry.bodyFatPercent = m.bodyFatPercent;
        if (typeof m.skeletalMuscleKg === "number" && Number.isFinite(m.skeletalMuscleKg) && m.skeletalMuscleKg > 0) entry.skeletalMuscleKg = m.skeletalMuscleKg;
        if (typeof m.visceralFatLevel === "number" && Number.isFinite(m.visceralFatLevel) && m.visceralFatLevel >= 0) entry.visceralFatLevel = m.visceralFatLevel;
        return entry;
      })
      .sort((a, b) => a.date.localeCompare(b.date));
  }
  if (isRecord(raw.nutritionEntries)) {
    for (const [date, entries] of Object.entries(raw.nutritionEntries)) {
      if (!Array.isArray(entries)) continue;
      base.nutritionEntries[date] = entries
        .filter(isRecord)
        .filter((e) => typeof e.id === "string" && typeof e.name === "string" && e.name.trim().length > 0
          && typeof e.kcal === "number" && Number.isFinite(e.kcal) && e.kcal >= 0
          && typeof e.protein === "number" && Number.isFinite(e.protein) && e.protein >= 0)
        .map((e) => ({
          id: e.id as string,
          date,
          name: (e.name as string).trim().slice(0, 100),
          kcal: Math.round(e.kcal as number),
          protein: Math.round((e.protein as number) * 10) / 10,
        }));
    }
  }
  if (isRecord(raw.shopping)) {
    for (const [k, v] of Object.entries(raw.shopping)) if (typeof v === "boolean") base.shopping[k] = v;
  }
  if (isRecord(raw.sessions)) {
    for (const [date, v] of Object.entries(raw.sessions)) {
      if (!isRecord(v)) continue;
      const meta: SessionMeta = {};
      if (v.manual === true) meta.manual = true;
      if (typeof v.kcalReal === "number" && Number.isFinite(v.kcalReal) && v.kcalReal > 0) meta.kcalReal = Math.round(v.kcalReal);
      if (meta.manual || meta.kcalReal) base.sessions[date] = meta;
    }
  }
  if (isRecord(raw.sleepRecovery)) {
    for (const [date, value] of Object.entries(raw.sleepRecovery)) {
      if (!isRecord(value)) continue;
      const sleepHours = value.sleepHours;
      const quality = value.quality;
      const energy = value.energy;
      const fatigue = value.fatigue;
      if (typeof sleepHours !== "number" || !Number.isFinite(sleepHours) || sleepHours < 0 || sleepHours > 24) continue;
      if (![quality, energy, fatigue].every((n) => typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 5)) continue;
      base.sleepRecovery[date] = { sleepHours, quality: quality as number, energy: energy as number, fatigue: fatigue as number };
    }
  }
  const profile = sanitizeProfile(raw.profile);
  if (profile) base.profile = profile;
  return base;
}

export type CloudSyncStatus = "loading" | "local-only" | "saving" | "synced" | "error";

interface StoreValue {
  /** Identificador de la cuenta con la que se abrió la app. */
  userId: string;
  state: AppState;
  ready: boolean;
  cloudSyncStatus: CloudSyncStatus;
  cloudSyncMessage: string | null;
  addWater: (date: string, ml: number) => void;
  setSetLog: (date: string, exerciseId: string, index: number, field: keyof SetLog, value: string) => void;
  saveWeight: (date: string, kg: number) => void;
  saveBodyMeasurement: (entry: BodyMeasurementEntry) => void;
  removeBodyMeasurement: (date: string) => void;
  removeWeight: (date: string) => void;
  toggleShopping: (id: string) => void;
  addNutritionEntry: (entry: NutritionEntry) => void;
  removeNutritionEntry: (date: string, id: string) => void;
  /** Actualiza las marcas de un día. kcalReal null borra el valor. */
  setSession: (date: string, patch: { manual?: boolean; kcalReal?: number | null }) => void;
  saveSleepRecovery: (date: string, entry: SleepRecoveryEntry) => void;
  saveProfile: (profile: UserProfile) => void;
  exportJSON: () => string;
  importJSON: (text: string) => boolean;
  resetAll: () => void;
  /** Borra todos tus datos de la nube y de este dispositivo, incluido el perfil. La cuenta de acceso se conserva. */
  eraseAllData: () => Promise<void>;
}

const StoreContext = createContext<StoreValue | null>(null);

const codec: Codec<AppState> = { sanitize, empty: emptyState };
const SYNC_SUFFIX = ":sync";

function readLocalState(key: string): AppState {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? sanitize(JSON.parse(raw)) : emptyState();
  } catch {
    // Una copia local dañada se ignora sin afectar a otros usuarios.
    return emptyState();
  }
}

function readSyncMeta(key: string): SyncMeta | null {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(key + SYNC_SUFFIX) ?? "null");
    if (isRecord(parsed) && (parsed.revision === null || typeof parsed.revision === "string")) return { revision: parsed.revision as string | null, base: parsed.base ?? null };
  } catch {
    /* sin referencia previa */
  }
  return null;
}

/** Quita de este navegador todo lo guardado de una cuenta (datos y referencia de sincronización). */
export function clearStoredUserData(userId: string) {
  try {
    const key = `${STORAGE_KEY}:${userId}`;
    window.localStorage.removeItem(key);
    window.localStorage.removeItem(key + SYNC_SUFFIX);
  } catch {
    /* almacenamiento bloqueado */
  }
}

function writeSyncMeta(key: string, meta: SyncMeta) {
  try {
    window.localStorage.setItem(key + SYNC_SUFFIX, JSON.stringify(meta));
  } catch {
    /* almacenamiento lleno o bloqueado */
  }
}

async function errorMessage(response: Response, fallback: string): Promise<string> {
  const result = (await response.json().catch(() => null)) as { error?: string } | null;
  return result?.error || fallback;
}

function createTransport(userId: string): Transport {
  return {
    async get() {
      const response = await fetch("/api/user-state", { cache: "no-store" });
      if (!response.ok) throw new Error(await errorMessage(response, `No se pudo leer la nube (HTTP ${response.status}). Los cambios locales siguen disponibles.`));
      const result = (await response.json()) as { userId?: string; state?: unknown; updatedAt?: string | null };
      // Nunca se acepta una respuesta de una identidad distinta a la sesión verificada.
      if (result.userId !== userId) throw new Error("La respuesta de la nube no coincide con la cuenta actual. Los datos permanecen solo en este dispositivo.");
      return { state: result.state ?? null, updatedAt: result.updatedAt ?? null };
    },
    async put(state, baseRevision) {
      const response = await fetch("/api/user-state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state, baseRevision }),
      });
      if (response.status === 409) {
        const result = (await response.json().catch(() => null)) as { state?: unknown; updatedAt?: string | null } | null;
        return { conflict: true as const, state: result?.state ?? null, updatedAt: result?.updatedAt ?? null };
      }
      if (!response.ok) throw new Error(await errorMessage(response, `Error de sincronización (HTTP ${response.status}).`));
      const result = (await response.json().catch(() => null)) as { updatedAt?: string | null } | null;
      return { ok: true as const, updatedAt: result?.updatedAt ?? null };
    },
  };
}

/** Mínimo entre actualizaciones automáticas al volver a la app (evita peticiones repetidas). */
const REFRESH_MIN_MS = 8000;
/** Tiempo de espera antes de reintentar un guardado que falló. */
const RETRY_AFTER_MS = 20000;

export function StoreProvider({ children, userId }: { children: ReactNode; userId: string }) {
  const [state, setState] = useState<AppState>(emptyState);
  const [ready, setReady] = useState(false);
  const [storageKey, setStorageKey] = useState<string | null>(null);
  const [cloudReady, setCloudReady] = useState(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>("loading");
  const [cloudSyncMessage, setCloudSyncMessage] = useState<string | null>(null);

  const transport = useMemo(() => createTransport(userId), [userId]);
  const stateRef = useRef(state);
  stateRef.current = state;
  const metaRef = useRef<SyncMeta>(EMPTY_META);
  const keyRef = useRef<string | null>(null);
  const cloudReadyRef = useRef(false);
  const inFlight = useRef(false);
  const queued = useRef(false);
  const lastRefresh = useRef(0);
  const pushRef = useRef<() => Promise<void>>(async () => {});
  const retryTimer = useRef<number | null>(null);
  const refreshRef = useRef<(force?: boolean) => Promise<void>>(async () => {});

  /**
   * Aplica un estado que llegó de la nube sin pisar lo que la persona editó mientras tanto:
   * si hubo ediciones durante la petición, se vuelven a fusionar sobre el estado recibido.
   */
  const applyIncoming = useCallback((snapshot: AppState, incoming: AppState) => {
    setState((current) => (deepEqual(current, snapshot) ? incoming : sanitize(mergeStates(snapshot, current, incoming))));
  }, []);

  useEffect(() => {
    let active = true;
    const key = `${STORAGE_KEY}:${userId}`;
    setReady(false);
    setStorageKey(null);
    setCloudReady(false);
    setCloudSyncStatus("loading");
    setCloudSyncMessage(null);
    metaRef.current = EMPTY_META;
    keyRef.current = null;
    cloudReadyRef.current = false;
    inFlight.current = false;
    queued.current = false;

    void (async () => {
      const local = readLocalState(key);
      const localMeta = readSyncMeta(key);
      try {
        const remote = await transport.get();
        if (!active) return;
        const result = reconcileOnLoad(local, localMeta, remote, codec);
        metaRef.current = result.meta;
        writeSyncMeta(key, result.meta);
        keyRef.current = key;
        cloudReadyRef.current = true;
        setState(result.state);
        setStorageKey(key);
        setCloudReady(true);
        setCloudSyncStatus("synced");
        setCloudSyncMessage(null);
      } catch (error) {
        if (!active) return;
        metaRef.current = localMeta ?? EMPTY_META;
        keyRef.current = key;
        cloudReadyRef.current = false;
        setState(local);
        setStorageKey(key);
        setCloudReady(false);
        setCloudSyncStatus("local-only");
        setCloudSyncMessage(error instanceof Error ? error.message : "No se pudo verificar la sincronización en la nube.");
      }
      if (active) setReady(true);
    })();
    return () => {
      active = false;
    };
  }, [userId, transport]);

  /** Sube los cambios locales; si otro dispositivo guardó antes, fusiona y reintenta. */
  const push = useCallback(async () => {
    const key = keyRef.current;
    if (!key || !cloudReadyRef.current) return;
    if (inFlight.current) {
      queued.current = true;
      return;
    }
    const snapshot = stateRef.current;
    if (!isDirty(snapshot, metaRef.current, codec)) {
      setCloudSyncStatus("synced");
      return;
    }
    inFlight.current = true;
    if (retryTimer.current !== null) {
      window.clearTimeout(retryTimer.current);
      retryTimer.current = null;
    }
    setCloudSyncStatus("saving");
    setCloudSyncMessage(null);
    try {
      const result = await pushState(snapshot, metaRef.current, transport, codec);
      metaRef.current = result.meta;
      writeSyncMeta(key, result.meta);
      if (!deepEqual(result.state, snapshot)) applyIncoming(snapshot, result.state);
      setCloudSyncStatus("synced");
    } catch (error) {
      setCloudSyncStatus("error");
      setCloudSyncMessage(error instanceof Error ? error.message : "No se pudieron guardar los cambios en la nube. La copia local se conserva.");
      // Un fallo de red es temporal: se reintenta solo, sin perder nada de lo local.
      if (retryTimer.current !== null) window.clearTimeout(retryTimer.current);
      retryTimer.current = window.setTimeout(() => void pushRef.current(), RETRY_AFTER_MS);
    } finally {
      inFlight.current = false;
      if (queued.current) {
        queued.current = false;
        void pushRef.current();
      }
    }
  }, [transport, applyIncoming]);
  pushRef.current = push;

  /** Trae lo que otro dispositivo guardó (y reconecta si la primera conexión había fallado). */
  const refresh = useCallback(
    async (force = false) => {
      const key = keyRef.current;
      if (!key || inFlight.current) return;
      const now = Date.now();
      if (!force && now - lastRefresh.current < REFRESH_MIN_MS) return;
      lastRefresh.current = now;
      inFlight.current = true;
      try {
        const snapshot = stateRef.current;
        if (!cloudReadyRef.current) {
          const remote = await transport.get();
          const result = reconcileOnLoad(snapshot, metaRef.current.base ? metaRef.current : readSyncMeta(key), remote, codec);
          metaRef.current = result.meta;
          writeSyncMeta(key, result.meta);
          cloudReadyRef.current = true;
          applyIncoming(snapshot, result.state);
          setCloudReady(true);
          setCloudSyncStatus("synced");
          setCloudSyncMessage(null);
        } else {
          const pulled = await pullState(snapshot, metaRef.current, transport, codec);
          if (pulled) {
            metaRef.current = pulled.meta;
            writeSyncMeta(key, pulled.meta);
            applyIncoming(snapshot, pulled.state);
          }
        }
      } catch {
        /* sin conexión: se reintenta al volver a la app o al recuperar internet */
      } finally {
        inFlight.current = false;
        queued.current = false;
        // Lo que se editó sin conexión se sube en cuanto vuelve la conexión.
        if (cloudReadyRef.current && isDirty(stateRef.current, metaRef.current, codec)) void pushRef.current();
      }
    },
    [transport, applyIncoming],
  );
  refreshRef.current = refresh;

  useEffect(() => {
    if (!ready || !storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      /* almacenamiento lleno o bloqueado */
    }
    // Nunca se sube nada si la conexión inicial con la nube no tuvo éxito.
    if (!cloudReady || !isDirty(state, metaRef.current, codec)) return;
    const timer = window.setTimeout(() => void pushRef.current(), 700);
    return () => window.clearTimeout(timer);
  }, [state, ready, storageKey, cloudReady]);

  useEffect(
    () => () => {
      if (retryTimer.current !== null) window.clearTimeout(retryTimer.current);
    },
    [],
  );

  // Al volver a la app o recuperar internet, se traen los cambios de otros dispositivos.
  useEffect(() => {
    if (!ready) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") void refreshRef.current();
    };
    const onOnline = () => void refreshRef.current(true);
    window.addEventListener("focus", onVisible);
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [ready]);

  const addWater = useCallback((date: string, ml: number) => {
    setState((s) => {
      const next = applyWater(s, date, ml);
      return next === s ? s : { ...s, water: next.water, waterLog: next.waterLog };
    });
  }, []);

  const setSetLog = useCallback((date: string, exerciseId: string, index: number, field: keyof SetLog, value: string) => {
    setState((s) => {
      const day = s.workoutLogs[date] ?? {};
      const sets = [...(day[exerciseId] ?? [])];
      while (sets.length <= index) sets.push({ kg: "", reps: "" });
      sets[index] = { ...sets[index], [field]: value };
      return { ...s, workoutLogs: { ...s.workoutLogs, [date]: { ...day, [exerciseId]: sets } } };
    });
  }, []);

  const saveWeight = useCallback((date: string, kg: number) => {
    setState((s) => {
      const rest = s.weights.filter((w) => w.date !== date);
      return { ...s, weights: [...rest, { date, kg }].sort((a, b) => a.date.localeCompare(b.date)) };
    });
  }, []);

  const saveBodyMeasurement = useCallback((entry: BodyMeasurementEntry) => {
    setState((s) => {
      const existing = s.bodyMeasurements.find((m) => m.date === entry.date);
      // Los campos opcionales ausentes no deben borrar mediciones guardadas.
      // Los valores que sí llegan en entry (incluido el peso) actualizan el registro.
      const merged: BodyMeasurementEntry = { ...existing, ...entry };
      const rest = s.bodyMeasurements.filter((m) => m.date !== entry.date);
      return { ...s, bodyMeasurements: [...rest, merged].sort((a, b) => a.date.localeCompare(b.date)) };
    });
  }, []);

  const removeBodyMeasurement = useCallback((date: string) => {
    setState((s) => ({ ...s, bodyMeasurements: s.bodyMeasurements.filter((m) => m.date !== date) }));
  }, []);

  const removeWeight = useCallback((date: string) => {
    setState((s) => ({ ...s, weights: s.weights.filter((w) => w.date !== date) }));
  }, []);

  const addNutritionEntry = useCallback((entry: NutritionEntry) => {
    setState((s) => ({
      ...s,
      nutritionEntries: {
        ...s.nutritionEntries,
        [entry.date]: [...(s.nutritionEntries[entry.date] ?? []), entry],
      },
    }));
  }, []);

  const removeNutritionEntry = useCallback((date: string, id: string) => {
    setState((s) => {
      const entries = (s.nutritionEntries[date] ?? []).filter((entry) => entry.id !== id);
      const nutritionEntries = { ...s.nutritionEntries };
      if (entries.length) nutritionEntries[date] = entries;
      else delete nutritionEntries[date];
      return { ...s, nutritionEntries };
    });
  }, []);

  const toggleShopping = useCallback((id: string) => {
    setState((s) => ({ ...s, shopping: { ...s.shopping, [id]: !s.shopping[id] } }));
  }, []);

  const setSession = useCallback((date: string, patch: { manual?: boolean; kcalReal?: number | null }) => {
    setState((s) => {
      const cur: SessionMeta = { ...s.sessions[date] };
      if (patch.manual !== undefined) {
        if (patch.manual) cur.manual = true;
        else delete cur.manual;
      }
      if (patch.kcalReal !== undefined) {
        if (patch.kcalReal && patch.kcalReal > 0) cur.kcalReal = Math.min(5000, Math.round(patch.kcalReal));
        else delete cur.kcalReal;
      }
      const sessions = { ...s.sessions };
      if (cur.manual || cur.kcalReal) sessions[date] = cur;
      else delete sessions[date];
      return { ...s, sessions };
    });
  }, []);

  const saveSleepRecovery = useCallback((date: string, entry: SleepRecoveryEntry) => {
    setState((s) => ({ ...s, sleepRecovery: { ...s.sleepRecovery, [date]: {
      sleepHours: Math.round(Math.min(24, Math.max(0, entry.sleepHours)) * 2) / 2,
      quality: Math.min(5, Math.max(1, Math.round(entry.quality))),
      energy: Math.min(5, Math.max(1, Math.round(entry.energy))),
      fatigue: Math.min(5, Math.max(1, Math.round(entry.fatigue))),
    } } }));
  }, []);

  const saveProfile = useCallback((profile: UserProfile) => {
    setState((s) => ({ ...s, profile }));
  }, []);

  const exportJSON = useCallback(() => JSON.stringify({ ...state, exportedAt: new Date().toISOString() }, null, 2), [state]);

  const importJSON = useCallback((text: string) => {
    try {
      const parsed: unknown = JSON.parse(text);
      if (!isRecord(parsed) || ![5, 6, 7, 8, 9, 10].includes(parsed.version as number)) return false;
      const incoming = sanitize(parsed);
      // Una copia antigua sin perfil no debe borrar el perfil actual.
      setState((current) => ({ ...incoming, profile: incoming.profile ?? current.profile }));
      return true;
    } catch {
      return false;
    }
  }, []);

  // Borrar todo conserva tu perfil: son tus ajustes de cuenta, no tus registros.
  const resetAll = useCallback(() => setState((s) => ({ ...emptyState(), profile: s.profile })), []);

  const eraseAllData = useCallback(async () => {
    const response = await fetch("/api/user-state", { method: "DELETE" });
    if (!response.ok) throw new Error(await errorMessage(response, "No se pudieron borrar tus datos de la nube. Inténtalo de nuevo."));
    if (retryTimer.current !== null) window.clearTimeout(retryTimer.current);
    clearStoredUserData(userId);
    metaRef.current = EMPTY_META;
    setState(emptyState());
    setCloudSyncStatus("synced");
    setCloudSyncMessage(null);
  }, [userId]);

  const value = useMemo<StoreValue>(
    () => ({ userId, state, ready, cloudSyncStatus, cloudSyncMessage, addWater, setSetLog, saveWeight, saveBodyMeasurement, removeBodyMeasurement, removeWeight, toggleShopping, addNutritionEntry, removeNutritionEntry, setSession, saveSleepRecovery, saveProfile, exportJSON, importJSON, resetAll, eraseAllData }),
    [userId, state, ready, cloudSyncStatus, cloudSyncMessage, addWater, setSetLog, saveWeight, saveBodyMeasurement, removeBodyMeasurement, removeWeight, toggleShopping, addNutritionEntry, removeNutritionEntry, setSession, saveSleepRecovery, saveProfile, exportJSON, importJSON, resetAll, eraseAllData],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore debe usarse dentro de <StoreProvider>");
  return ctx;
}

/** Perfil del usuario. Solo se usa dentro de la app, que no se muestra hasta completar el registro. */
export function useProfile(): UserProfile {
  const { state } = useStore();
  if (!state.profile) throw new Error("useProfile se usó antes de completar el registro.");
  return state.profile;
}

/** Horario del día generado a partir de la hora de despertar, dormir, trabajo y entreno del perfil. */
export function useSchedule(): ScheduleItem[] {
  const p = useProfile();
  return useMemo(
    () => buildSchedule({ wake: p.wake, bed: p.bed, workStart: p.workStart, workEnd: p.workEnd, trainStart: p.trainStart, trainMinutes: p.trainMinutes }),
    [p.wake, p.bed, p.workStart, p.workEnd, p.trainStart, p.trainMinutes],
  );
}
