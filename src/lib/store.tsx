"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { PROFILE, STORAGE_KEY } from "./config";

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
  version: 8;
  /** ml de agua por fecha (YYYY-MM-DD) */
  water: Record<string, number>;
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
}

const emptyState = (): AppState => ({ version: 8, water: {}, workoutLogs: {}, weights: [], bodyMeasurements: [], nutritionEntries: {}, shopping: {}, sessions: {}, sleepRecovery: {} });

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** Valida datos externos (localStorage o archivo importado) y descarta lo que no encaje. */
function sanitize(raw: unknown): AppState {
  const base = emptyState();
  if (!isRecord(raw)) return base;
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
  return base;
}

export type CloudSyncStatus = "loading" | "local-only" | "saving" | "synced" | "error";

interface StoreValue {
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
  exportJSON: () => string;
  importJSON: (text: string) => boolean;
  resetAll: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children, userId }: { children: ReactNode; userId: string }) {
  const [state, setState] = useState<AppState>(emptyState);
  const [ready, setReady] = useState(false);
  const [storageKey, setStorageKey] = useState<string | null>(null);
  const [cloudReady, setCloudReady] = useState(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>("loading");
  const [cloudSyncMessage, setCloudSyncMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const userStorageKey = `${STORAGE_KEY}:${userId}`;

    async function loadUserState() {
      let cloudState: unknown = null;
      let cloudReadSucceeded = false;
      let readFailure = "No se pudo verificar la sincronización en la nube.";
      try {
        const response = await fetch("/api/user-state", { cache: "no-store" });
        if (response.ok) {
          const result = await response.json() as { userId?: string; state?: unknown };
          // Never accept a response for an identity other than the verified session.
          if (result.userId === userId) {
            cloudState = result.state ?? null;
            cloudReadSucceeded = true;
          } else {
            readFailure = "La respuesta de la nube no coincide con la cuenta actual. Los datos permanecen solo en este dispositivo.";
          }
        } else {
          const result = await response.json().catch(() => null) as { error?: string } | null;
          readFailure = result?.error || `No se pudo leer la nube (HTTP ${response.status}). Los cambios locales siguen disponibles.`;
        }
      } catch {
        readFailure = "No hay conexión con la nube. Los cambios se conservan en este dispositivo.";
      }

      let nextState = emptyState();
      if (cloudState && typeof cloudState === "object" && !Array.isArray(cloudState)) {
        nextState = sanitize(cloudState);
      } else {
        try {
          const raw = window.localStorage.getItem(userStorageKey);
          if (raw) nextState = sanitize(JSON.parse(raw));
        } catch {
          // A corrupt local snapshot is ignored without affecting another user's data.
        }
      }

      if (!active) return;
      setState(nextState);
      setStorageKey(userStorageKey);
      setCloudReady(cloudReadSucceeded);
      setCloudSyncStatus(cloudReadSucceeded ? "synced" : "local-only");
      setCloudSyncMessage(cloudReadSucceeded ? null : readFailure);
      setReady(true);
    }

    setReady(false);
    setStorageKey(null);
    setCloudReady(false);
    setCloudSyncStatus("loading");
    setCloudSyncMessage(null);
    void loadUserState();
    return () => { active = false; };
  }, [userId]);

  useEffect(() => {
    if (!ready || !storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      /* almacenamiento lleno o bloqueado */
    }

    // Never overwrite cloud data unless the initial cloud read succeeded.
    if (!cloudReady) return;
    const controller = new AbortController();
    const saveTimer = window.setTimeout(async () => {
      setCloudSyncStatus("saving");
      setCloudSyncMessage(null);
      try {
        const response = await fetch("/api/user-state", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state }),
          signal: controller.signal,
        });
        if (!response.ok) {
          const result = await response.json().catch(() => null) as { error?: string } | null;
          throw new Error(result?.error || `Error de sincronización (HTTP ${response.status}).`);
        }
        setCloudSyncStatus("synced");
        setCloudSyncMessage(null);
      } catch (error) {
        if (controller.signal.aborted) return;
        setCloudSyncStatus("error");
        setCloudSyncMessage(error instanceof Error ? error.message : "No se pudieron guardar los cambios en la nube. La copia local se conserva.");
      }
    }, 700);
    return () => {
      window.clearTimeout(saveTimer);
      controller.abort();
    };
  }, [state, ready, storageKey, cloudReady]);

  const addWater = useCallback((date: string, ml: number) => {
    setState((s) => {
      const next = Math.min(6000, Math.max(0, (s.water[date] ?? 0) + ml));
      return { ...s, water: { ...s.water, [date]: next } };
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

  const exportJSON = useCallback(() => JSON.stringify({ ...state, exportedAt: new Date().toISOString(), profile: PROFILE }, null, 2), [state]);

  const importJSON = useCallback((text: string) => {
    try {
      const parsed: unknown = JSON.parse(text);
      if (!isRecord(parsed) || ![5, 6, 7, 8].includes(parsed.version as number)) return false;
      setState(sanitize(parsed));
      return true;
    } catch {
      return false;
    }
  }, []);

  const resetAll = useCallback(() => setState(emptyState()), []);

  const value = useMemo<StoreValue>(
    () => ({ state, ready, cloudSyncStatus, cloudSyncMessage, addWater, setSetLog, saveWeight, saveBodyMeasurement, removeBodyMeasurement, removeWeight, toggleShopping, addNutritionEntry, removeNutritionEntry, setSession, saveSleepRecovery, exportJSON, importJSON, resetAll }),
    [state, ready, cloudSyncStatus, cloudSyncMessage, addWater, setSetLog, saveWeight, saveBodyMeasurement, removeBodyMeasurement, removeWeight, toggleShopping, addNutritionEntry, removeNutritionEntry, setSession, saveSleepRecovery, exportJSON, importJSON, resetAll],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore debe usarse dentro de <StoreProvider>");
  return ctx;
}
