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
export interface AppState {
  version: 5;
  /** ml de agua por fecha (YYYY-MM-DD) */
  water: Record<string, number>;
  /** fecha → id de ejercicio → series registradas */
  workoutLogs: Record<string, Record<string, SetLog[]>>;
  weights: WeightEntry[];
  shopping: Record<string, boolean>;
}

const emptyState = (): AppState => ({ version: 5, water: {}, workoutLogs: {}, weights: [], shopping: {} });

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
  if (isRecord(raw.shopping)) {
    for (const [k, v] of Object.entries(raw.shopping)) if (typeof v === "boolean") base.shopping[k] = v;
  }
  return base;
}

interface StoreValue {
  state: AppState;
  ready: boolean;
  addWater: (date: string, ml: number) => void;
  setSetLog: (date: string, exerciseId: string, index: number, field: keyof SetLog, value: string) => void;
  saveWeight: (date: string, kg: number) => void;
  removeWeight: (date: string) => void;
  toggleShopping: (id: string) => void;
  exportJSON: () => string;
  importJSON: (text: string) => boolean;
  resetAll: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(emptyState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setState(sanitize(JSON.parse(raw)));
    } catch {
      /* datos corruptos: se empieza de cero */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* almacenamiento lleno o bloqueado */
    }
  }, [state, ready]);

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

  const removeWeight = useCallback((date: string) => {
    setState((s) => ({ ...s, weights: s.weights.filter((w) => w.date !== date) }));
  }, []);

  const toggleShopping = useCallback((id: string) => {
    setState((s) => ({ ...s, shopping: { ...s.shopping, [id]: !s.shopping[id] } }));
  }, []);

  const exportJSON = useCallback(() => JSON.stringify({ ...state, exportedAt: new Date().toISOString(), profile: PROFILE }, null, 2), [state]);

  const importJSON = useCallback((text: string) => {
    try {
      const parsed: unknown = JSON.parse(text);
      if (!isRecord(parsed) || parsed.version !== 5) return false;
      setState(sanitize(parsed));
      return true;
    } catch {
      return false;
    }
  }, []);

  const resetAll = useCallback(() => setState(emptyState()), []);

  const value = useMemo<StoreValue>(
    () => ({ state, ready, addWater, setSetLog, saveWeight, removeWeight, toggleShopping, exportJSON, importJSON, resetAll }),
    [state, ready, addWater, setSetLog, saveWeight, removeWeight, toggleShopping, exportJSON, importJSON, resetAll],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore debe usarse dentro de <StoreProvider>");
  return ctx;
}
