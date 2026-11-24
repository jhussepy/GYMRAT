"use client";

import { useEffect, useMemo, useState } from "react";
import { Timer } from "lucide-react";
import { WEEKDAYS, weekdayFromDate, type Weekday } from "@/lib/config";
import type { Exercise } from "@/lib/data";
import { trainingPlan } from "@/lib/routine-plan";
import { exerciseFor, type RoutineDay, type RoutineExercise } from "@/lib/routines";
import { historyBefore, isNewRecord, recordsFor } from "@/lib/records";
import { RoutineEditor } from "./RoutineEditor";
import { addMinutes } from "@/lib/profile";
import { useProfile, useStore, type SetLog } from "@/lib/store";
import { todayISO } from "@/lib/time";
import { Card, DayPicker, ProgressBar } from "./ui";
import { useRestTimer } from "./RestTimer";
import { TrainingProgress } from "./TrainingProgress";

const inputCls = "h-11 w-full rounded-xl border border-line bg-ink/70 px-2 text-center tabular-nums placeholder:text-muted/70 focus:border-flame focus:bg-ink";

function positiveNumber(value: string | undefined): number {
  const parsed = Number.parseFloat((value ?? "").replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function progressionGuidance(ex: Exercise, previous: SetLog[] | undefined): string {
  if (ex.type === "cardio") {
    const minutes = positiveNumber(previous?.[0]?.reps);
    return minutes > 0
      ? `Última duración registrada: ${minutes} min. Mantén un ritmo sostenible; añade 2–5 min solo si terminas bien y te recuperas adecuadamente.`
      : "Todavía no hay una duración anterior registrada. Anota los minutos realizados para comparar las próximas sesiones.";
  }

  const target = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(ex.reps.trim());
  const lowerTarget = target ? Number(target[1]) : 0;
  const upperTarget = target ? Number(target[2] ?? target[1]) : 0;
  const completed = Array.from({ length: ex.sets }, (_, index) => {
    const set = previous?.[index];
    return { kg: positiveNumber(set?.kg), reps: positiveNumber(set?.reps) };
  });
  const completeSets = completed.filter((set) => set.kg > 0 && set.reps > 0);

  if (completeSets.length < ex.sets) {
    return "Registra el peso y las repeticiones de todas las series. Con el historial completo podrás ajustar la carga sin adivinar.";
  }

  if (target && completed.every((set) => set.reps >= upperTarget)) {
    return `Alcanzaste al menos ${upperTarget} repeticiones en todas las series. Si la técnica fue limpia y quedaron 1–2 repeticiones en reserva, prueba el siguiente incremento pequeño de peso (aprox. 2–5%).`;
  }

  if (target && completed.some((set) => set.reps < lowerTarget)) {
    return `Prioriza completar al menos ${lowerTarget} repeticiones con control. Mantén la carga; si la técnica se deteriora, redúcela un poco antes de volver a subir.`;
  }

  return target
    ? `Mantén la carga y trata de añadir 1 repetición en alguna serie hasta alcanzar ${upperTarget} en todas, sin perder técnica.`
    : "Usa la última sesión como referencia. Progresa de forma gradual solo cuando completes todas las series con buena técnica.";
}

export function WorkoutTab() {
  const { state, setSetLog, saveRoutine, setHomeMode } = useStore();
  const { startRest } = useRestTimer();
  const profile = useProfile();
  const appState = state;
  const [editing, setEditing] = useState(false);
  const plans = useMemo(() => trainingPlan(profile.trainingDays, appState.routines), [profile.trainingDays, appState.routines]);
  const homeMode = appState.homeMode === true;
  const [day, setDay] = useState<Weekday>(plans[0].day);
  const [today, setToday] = useState("");

  useEffect(() => {
    const d = new Date();
    setToday(todayISO(d));
    const w = weekdayFromDate(d);
    const days = plans.map((p) => p.day);
    if (w && days.includes(w)) setDay(w);
    else {
      // Hoy no entrenas: se muestra tu próxima rutina.
      const from = w ? WEEKDAYS.indexOf(w) : WEEKDAYS.length;
      setDay(days.find((x) => WEEKDAYS.indexOf(x) > from) ?? days[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const plan = plans.find((p) => p.day === day) ?? plans[0];
  const exercises = plan.exercises;
  const planDays = plans.map((p) => p.day);
  const planLabels = Object.fromEntries(plans.map((p) => [p.day, p.focus])) as Partial<Record<Weekday, string>>;
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

  // Récord de cada ejercicio hasta ayer: la serie de hoy se compara contra eso, nunca contra sí misma.
  const recordFor = useMemo(() => {
    const before = historyBefore(state.workoutLogs, today);
    return (id: string) => recordsFor(id, before);
  }, [state.workoutLogs, today]);

  const totalSets = exercises.reduce((n, e) => n + e.sets, 0);
  const doneSets = exercises.reduce((n, e) => n + (todayLog[e.id] ?? []).slice(0, e.sets).filter((s) => s.reps.trim() !== "").length, 0);

  const customized = !!appState.routines?.[plan.routine];
  const baseRoutine: RoutineDay = { day: plan.routine, focus: plan.focus, exercises: plan.exercises };

  if (editing) {
    return (
      <RoutineEditor
        base={plan.routine}
        current={baseRoutine}
        customized={customized}
        onSave={(r) => {
          saveRoutine(plan.routine, r);
          setEditing(false);
        }}
        onRestore={() => {
          saveRoutine(plan.routine, null);
          setEditing(false);
        }}
        onClose={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            role="switch"
            aria-checked={homeMode}
            onClick={() => setHomeMode(!homeMode)}
            className={`inline-flex min-h-11 items-center gap-3 rounded-xl border px-4 text-sm transition-colors duration-200 ${homeMode ? "border-flame bg-flame/10 text-chalk" : "border-line text-muted hover:text-chalk"}`}
          >
            <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${homeMode ? "bg-flame" : "bg-line"}`} aria-hidden>
              <span className={`inline-block h-5 w-5 rounded-full bg-white transition-transform ${homeMode ? "translate-x-5" : "translate-x-0.5"}`} />
            </span>
            Modo en casa
          </button>
          <button type="button" onClick={() => setEditing(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line px-4 text-sm transition-colors duration-200 hover:border-flame/50 hover:bg-raised">
            Editar rutina
          </button>
        </div>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl">Entrenamiento · {plan.day}</h2>
            <p className="text-sm text-muted">{plan.focus} · {profile.trainStart} a {addMinutes(profile.trainStart, profile.trainMinutes)}</p>
          </div>
          <div className="w-full max-w-[220px] text-right text-sm text-muted">
            <p className="mb-1.5 tabular-nums">
              {doneSets} de {totalSets} {plan.routine === "Sábado" ? "bloques" : "series"} hechas
            </p>
            <ProgressBar value={doneSets} max={totalSets} label="Progreso de la sesión" />
          </div>
        </div>
        <DayPicker days={planDays} value={plan.day} onChange={setDay} labels={planLabels} />
        {plan.routine !== "Sábado" && (
          <p className="mt-4 rounded-xl bg-raised p-3 text-sm text-muted">
            Antes de empezar, 5 a 8 min de calentamiento y una serie ligera del primer ejercicio. Termina cada serie con 1 o 2 repeticiones en reserva. Si ya superaste el rango de repeticiones con buena técnica, sube el peso la próxima vez.
          </p>
        )}
      </Card>

      <TrainingProgress logs={state.workoutLogs} today={today} />

      <div className="space-y-4">
        {exercises.map((ex, i) => (
          <ExerciseCard key={ex.id} ex={ex} home={homeMode} index={i} logs={todayLog[ex.id] ?? []} prev={previous(ex.id)} record={recordFor(ex.id)} disabled={!today} onChange={(idx, field, value) => setSetLog(today, ex.id, idx, field, value)} onRest={() => startRest(90)} />
        ))}
      </div>
    </div>
  );
}

function ExerciseCard({ ex, home, index, logs, prev, record, disabled, onChange, onRest }: { ex: RoutineExercise; home: boolean; index: number; logs: SetLog[]; prev?: SetLog[]; record: ReturnType<typeof recordsFor>; disabled: boolean; onChange: (i: number, f: keyof SetLog, v: string) => void; onRest: () => void }) {
  const cardio = ex.type === "cardio";
  const shown = exerciseFor(ex, home);
  const guidance = progressionGuidance(ex, prev);

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm text-muted">
            Ejercicio {index + 1} · {cardio ? shown.reps : `${ex.sets} series de ${shown.reps}`}
          </p>
          <h3 className="font-medium">{shown.name}</h3>
          {home && ex.home && <p className="mt-0.5 text-xs text-flame">Modo en casa · en máquina sería: {ex.name}</p>}
          <p className="mt-0.5 text-sm text-muted">En hora punta: {ex.alt}</p>
        </div>
      </div>
      <div className="mt-3 rounded-xl border border-flame/20 bg-flame/5 p-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-flame">Guía de progresión</p>
        <p className="mt-1 text-sm leading-5 text-muted">{guidance}</p>
      </div>
      <div className="mt-3 space-y-2">
        {Array.from({ length: ex.sets }, (_, i) => {
          const log = logs[i] ?? { kg: "", reps: "" };
          const p = prev?.[i];
          return (
            <div key={i} className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-2">
              <span className="w-14 text-sm text-muted">{cardio ? "Hecho" : `Serie ${i + 1}`}</span>
              {cardio ? (
                <input type="number" inputMode="numeric" min={0} aria-label={`Minutos de ${shown.name}`} placeholder={p?.reps || "min"} value={log.reps} disabled={disabled} onChange={(e) => onChange(i, "reps", e.target.value)} className={`${inputCls} col-span-2`} />
              ) : (
                <>
                  <input type="number" inputMode="decimal" min={0} step="0.5" aria-label={`Peso en kg, serie ${i + 1} de ${shown.name}`} placeholder={p?.kg ? `${p.kg} kg` : "kg"} value={log.kg} disabled={disabled} onChange={(e) => onChange(i, "kg", e.target.value)} className={inputCls} />
                  <input type="number" inputMode="numeric" min={0} aria-label={`Repeticiones, serie ${i + 1} de ${shown.name}`} placeholder={p?.reps ? `${p.reps} reps` : "reps"} value={log.reps} disabled={disabled} onChange={(e) => onChange(i, "reps", e.target.value)} className={inputCls} />
                </>
              )}
              {!cardio && log.kg && log.reps && (() => {
                const hit = isNewRecord(log.kg, log.reps, record);
                if (!hit.kg && !hit.reps) return <span aria-hidden className="w-5" />;
                return (
                  <span role="status" className="rounded-lg bg-amber/15 px-2 py-1 text-[11px] font-semibold text-amber" title="¡Récord personal!">
                    {hit.kg ? "Récord de peso" : "Récord de reps"}
                  </span>
                );
              })()}
              <button onClick={onRest} aria-label="Iniciar descanso de 90 segundos" className="flex h-11 w-11 items-center justify-center rounded-xl border border-line text-muted transition-colors duration-200 hover:bg-raised hover:text-chalk">
                <Timer size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
