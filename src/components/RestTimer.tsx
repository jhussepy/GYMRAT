"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Pause, Play, RotateCcw, X } from "lucide-react";
import { REST_PRESETS } from "@/lib/config";
import { pad2 } from "@/lib/time";

interface TimerApi {
  /** Abre el cronómetro y arranca la cuenta atrás. */
  startRest: (seconds: number) => void;
  /** Abre el cronómetro sin arrancar. */
  showTimer: () => void;
}

const TimerContext = createContext<TimerApi | null>(null);

export function useRestTimer(): TimerApi {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error("useRestTimer debe usarse dentro de <RestTimerProvider>");
  return ctx;
}

function signalDone() {
  try {
    navigator.vibrate?.([220, 120, 220]);
  } catch {
    /* sin vibración */
  }
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
    osc.onended = () => void ctx.close();
  } catch {
    /* sin audio */
  }
}

export function RestTimerProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [total, setTotal] = useState(90);
  const [remaining, setRemaining] = useState(90);
  const [running, setRunning] = useState(false);
  const endAt = useRef(0);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((endAt.current - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        setRunning(false);
        signalDone();
      }
    }, 250);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const startRest = useCallback((seconds: number) => {
    setTotal(seconds);
    setRemaining(seconds);
    endAt.current = Date.now() + seconds * 1000;
    setRunning(true);
    setOpen(true);
  }, []);

  const showTimer = useCallback(() => setOpen(true), []);

  const resume = () => {
    if (remaining <= 0) return startRest(total);
    endAt.current = Date.now() + remaining * 1000;
    setRunning(true);
  };
  const pause = () => setRunning(false);
  const reset = () => {
    setRunning(false);
    setRemaining(total);
  };
  function close() {
    setRunning(false);
    setOpen(false);
  }

  const api = useMemo<TimerApi>(() => ({ startRest, showTimer }), [startRest, showTimer]);
  const done = remaining === 0;
  const frac = total > 0 ? remaining / total : 0;
  const R = 54;
  const C = 2 * Math.PI * R;

  return (
    <TimerContext.Provider value={api}>
      {children}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/80 p-4 sm:items-center" role="dialog" aria-modal="true" aria-label="Cronómetro de descanso">
          <div className="w-full max-w-sm rounded-xl border border-line bg-panel p-6 text-center">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-display text-lg">Descanso entre series</h2>
              <button onClick={close} aria-label="Cerrar cronómetro" className="flex h-11 w-11 items-center justify-center rounded-sm text-muted hover:bg-raised hover:text-chalk">
                <X size={18} />
              </button>
            </div>
            <div className="relative mx-auto my-4 h-44 w-44">
              <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true">
                <circle cx="60" cy="60" r={R} fill="none" stroke="#51495A" strokeWidth="8" />
                <circle cx="60" cy="60" r={R} fill="none" stroke={done ? "#F5B14C" : "#F76A50"} strokeWidth="8" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - frac)} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-display text-4xl tabular-nums" aria-live="polite">
                {done ? "A serie" : `${pad2(Math.floor(remaining / 60))}:${pad2(remaining % 60)}`}
              </div>
            </div>
            <div className="mb-4 flex justify-center gap-2">
              {REST_PRESETS.map((p) => (
                <button key={p} onClick={() => startRest(p)} className={`min-h-[44px] rounded-sm border px-4 text-sm ${total === p ? "border-flame text-flame" : "border-line text-muted hover:text-chalk"}`}>
                  {p} s
                </button>
              ))}
            </div>
            <div className="flex justify-center gap-2">
              {running ? (
                <button onClick={pause} className="flex min-h-[44px] items-center gap-2 rounded-sm bg-raised px-4 text-sm hover:bg-line">
                  <Pause size={16} /> Pausar
                </button>
              ) : (
                <button onClick={resume} className="flex min-h-[44px] items-center gap-2 rounded-sm bg-flame px-4 text-sm font-medium text-ink hover:brightness-110">
                  <Play size={16} /> {done ? "Repetir" : "Continuar"}
                </button>
              )}
              <button onClick={reset} className="flex min-h-[44px] items-center gap-2 rounded-sm bg-raised px-4 text-sm hover:bg-line">
                <RotateCcw size={16} /> Reiniciar
              </button>
            </div>
          </div>
        </div>
      )}
    </TimerContext.Provider>
  );
}
