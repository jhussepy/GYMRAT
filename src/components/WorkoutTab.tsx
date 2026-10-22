"use client";

import { useEffect, useMemo, useState } from "react";
import { Timer } from "lucide-react";
import { WEEKDAYS, weekdayFromDate, type Weekday } from "@/lib/config";
import { WORKOUTS, WORKOUT_FOCUS, type Exercise } from "@/lib/data";
import { useStore, type SetLog } from "@/lib/store";
import { todayISO } from "@/lib/time";
import { Card, DayPicker, ProgressBar } from "./ui";
import { useRestTimer } from "./RestTimer";

const inputCls = "h-11 w-full rounded-sm border border-line bg-ink px-2 text-center tabular-nums placeholder:text-muted/70 focus:border-flame";

export function WorkoutTab() {
  const { state, setSetLog } = useStore();
  const { startRest } = useRestTimer();
  const [day, setDay] = useState<Weekday>("Lunes");
  const [today, setToday] = useState("");

  useEffect(() => {
    const d = new Date();
    setToday(todayISO(d));
    const w = weekdayFromDate(d);
    if (w) setDay(w);
  }, []);

  const exercises = WORKOUTS[day];
  const todayLog = state.workoutLogs[today] ?? {};

  /** Última sesión previa con datos para ese ejercicio. */
  const previous = useMemo(() => {
    const dates = Object.keys(state.workoutLogs).filter((d) => d < today).sort().reverse();
    return (id: string): SetLog[] | undefined => {
      for (const d of dates) {
        const sets = state.workoutLogs[d]?.[id];
        if (sets?.some((s) => s.kg || s.reps)) return sets;
      }
      return undefined;
    };
  }, [state.workoutLogs, today]);

  const totalSets = exercises.reduce((n, e) => n + e.sets, 0);
  const doneSets = exercises.reduce((n, e) => n + (todayLog[e.id] ?? []).slice(0, e.sets).filter((s) => s.reps.trim() !== "").length, 0);

  return (
    <div className="space-y-6">
      <Card>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl">Smart Fit · {day}</h2>
            <p className="text-sm text-muted">{WORKOUT_FOCUS[day]} · 19:00 a 21:00</p>
          </div>
          <div className="w-full max-w-[220px] text-right text-sm text-muted">
            <p className="mb-1.5 tabular-nums">
              {doneSets} de {totalSets} {day === "Sábado" ? "bloques" : "series"} hechas
            </p>
            <ProgressBar value={doneSets} max={totalSets} label="Progreso de la sesión" />
          </div>
        </div>
        <DayPicker days={WEEKDAYS} value={day} onChange={setDay} labels={WORKOUT_FOCUS} />
        {day !== "Sábado" && (
          <p className="mt-4 rounded-sm bg-raised p-3 text-sm text-muted">
            Antes de empezar, 5 a 8 min de calentamiento y una serie ligera del primer ejercicio. Termina cada serie con 1 o 2 repeticiones en reserva. Si ya superaste el rango de repeticiones con buena técnica, sube el peso la próxima vez.
          </p>
        )}
      </Card>

      <div className="space-y-4">
        {exercises.map((ex, i) => (
          <ExerciseCard key={ex.id} ex={ex} index={i} logs={todayLog[ex.id] ?? []} prev={previous(ex.id)} disabled={!today} onChange={(idx, field, value) => setSetLog(today, ex.id, idx, field, value)} onRest={() => startRest(90)} />
        ))}
      </div>
    </div>
  );
}

function ExerciseCard({ ex, index, logs, prev, disabled, onChange, onRest }: { ex: Exercise; index: number; logs: SetLog[]; prev?: SetLog[]; disabled: boolean; onChange: (i: number, f: keyof SetLog, v: string) => void; onRest: () => void }) {
  const cardio = ex.type === "cardio";
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm text-muted">
            Ejercicio {index + 1} · {cardio ? ex.reps : `${ex.sets} series de ${ex.reps}`}
          </p>
          <h3 className="font-medium">{ex.name}</h3>
          <p className="mt-0.5 text-sm text-muted">En hora punta: {ex.alt}</p>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {Array.from({ length: ex.sets }, (_, i) => {
          const log = logs[i] ?? { kg: "", reps: "" };
          const p = prev?.[i];
          return (
            <div key={i} className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-2">
              <span className="w-14 text-sm text-muted">{cardio ? "Hecho" : `Serie ${i + 1}`}</span>
              {cardio ? (
                <input type="number" inputMode="numeric" min={0} aria-label={`Minutos de ${ex.name}`} placeholder={p?.reps || "min"} value={log.reps} disabled={disabled} onChange={(e) => onChange(i, "reps", e.target.value)} className={`${inputCls} col-span-2`} />
              ) : (
                <>
                  <input type="number" inputMode="decimal" min={0} step="0.5" aria-label={`Peso en kg, serie ${i + 1} de ${ex.name}`} placeholder={p?.kg ? `${p.kg} kg` : "kg"} value={log.kg} disabled={disabled} onChange={(e) => onChange(i, "kg", e.target.value)} className={inputCls} />
                  <input type="number" inputMode="numeric" min={0} aria-label={`Repeticiones, serie ${i + 1} de ${ex.name}`} placeholder={p?.reps ? `${p.reps} reps` : "reps"} value={log.reps} disabled={disabled} onChange={(e) => onChange(i, "reps", e.target.value)} className={inputCls} />
                </>
              )}
              <button onClick={onRest} aria-label="Iniciar descanso de 90 segundos" className="flex h-11 w-11 items-center justify-center rounded-sm border border-line text-muted transition-colors duration-200 hover:bg-raised hover:text-chalk">
                <Timer size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
