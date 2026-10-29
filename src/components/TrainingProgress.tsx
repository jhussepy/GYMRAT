"use client";

import { useMemo, useState } from "react";
import { WORKOUTS, WORKOUT_FOCUS, type Exercise } from "@/lib/data";
import type { SetLog } from "@/lib/store";
import { Card, SectionTitle } from "./ui";

interface ExerciseOption {
  id: string;
  name: string;
  day: string;
  sets: number;
  type: Exercise["type"];
}

interface TrainingSession {
  date: string;
  setsCount: number;
  totalReps: number;
  volumeKg: number;
  maxKg: number;
  cardioMinutes: number;
}

interface WeekSummary {
  weekStart: string;
  sessions: number;
  strengthVolumeKg: number;
  cardioMinutes: number;
  sets: number;
}

const EXERCISE_OPTIONS: ExerciseOption[] = Object.entries(WORKOUTS).flatMap(([routine, exercises]) =>
  exercises.map((exercise) => ({
    id: exercise.id,
    name: exercise.name,
    // Se etiqueta por tipo de rutina (Empuje, Tirón…), no por día: cada usuario entrena en días distintos.
    day: WORKOUT_FOCUS[routine as keyof typeof WORKOUT_FOCUS] ?? routine,
    sets: exercise.sets,
    type: exercise.type,
  })),
);

const EXERCISE_BY_ID = new Map(EXERCISE_OPTIONS.map((exercise) => [exercise.id, exercise]));

function positiveNumber(value: string | undefined): number {
  const parsed = Number.parseFloat((value ?? "").replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function isValidCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() === month - 1
    && parsed.getUTCDate() === day;
}

function displayDate(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function weekStartFor(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const mondayOffset = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - mondayOffset);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function signed(value: number, unit: string): string {
  if (value === 0) return `0 ${unit}`;
  return `${value > 0 ? "+" : "−"}${Math.abs(value).toLocaleString("es-ES", { maximumFractionDigits: 1 })} ${unit}`;
}

export function TrainingProgress({ logs, today }: {
  logs: Record<string, Record<string, SetLog[]>>;
  today: string;
}) {
  const [exerciseId, setExerciseId] = useState(EXERCISE_OPTIONS[0]?.id ?? "");
  const selected = EXERCISE_OPTIONS.find((exercise) => exercise.id === exerciseId) ?? EXERCISE_OPTIONS[0];

  const weeklySummary = useMemo(() => {
    const weeks = new Map<string, WeekSummary>();
    for (const [date, dayLogs] of Object.entries(logs)) {
      if (!isValidCalendarDate(date) || date > today) continue;
      let hasRecordedData = false;
      let strengthVolumeKg = 0;
      let cardioMinutes = 0;
      let sets = 0;

      for (const [id, rawSets] of Object.entries(dayLogs)) {
        const exercise = EXERCISE_BY_ID.get(id);
        if (!exercise || !Array.isArray(rawSets)) continue;
        const recorded = rawSets.slice(0, exercise.sets);
        if (exercise.type === "cardio") {
          const minutes = positiveNumber(recorded[0]?.reps);
          if (minutes > 0) {
            cardioMinutes += minutes;
            hasRecordedData = true;
          }
          continue;
        }

        for (const set of recorded) {
          const kg = positiveNumber(set?.kg);
          const reps = positiveNumber(set?.reps);
          if (kg > 0 || reps > 0) {
            sets += 1;
            hasRecordedData = true;
          }
          if (kg > 0 && reps > 0) strengthVolumeKg += kg * reps;
        }
      }

      if (!hasRecordedData) continue;
      const weekStart = weekStartFor(date);
      const current = weeks.get(weekStart) ?? {
        weekStart,
        sessions: 0,
        strengthVolumeKg: 0,
        cardioMinutes: 0,
        sets: 0,
      };
      current.sessions += 1;
      current.strengthVolumeKg += strengthVolumeKg;
      current.cardioMinutes += cardioMinutes;
      current.sets += sets;
      weeks.set(weekStart, current);
    }

    return [...weeks.values()].sort((a, b) => b.weekStart.localeCompare(a.weekStart)).slice(0, 4);
  }, [logs, today]);

  const history = useMemo(() => {
    if (!selected) return [] as TrainingSession[];
    return Object.entries(logs)
      .filter(([date]) => isValidCalendarDate(date) && date <= today)
      .map(([date, day]) => {
        const sets = (day[selected.id] ?? []).slice(0, selected.sets);
        if (selected.type === "cardio") {
          const minutes = positiveNumber(sets[0]?.reps);
          if (minutes <= 0) return null;
          return {
            date,
            setsCount: 1,
            totalReps: 0,
            volumeKg: 0,
            maxKg: 0,
            cardioMinutes: minutes,
          };
        }

        const values = sets.map((set) => ({
          kg: positiveNumber(set.kg),
          reps: positiveNumber(set.reps),
        }));
        const completedSets = values.filter((set) => set.kg > 0 || set.reps > 0);
        if (!completedSets.length) return null;

        return {
          date,
          setsCount: completedSets.length,
          totalReps: values.reduce((sum, set) => sum + set.reps, 0),
          volumeKg: values.reduce((sum, set) => sum + (set.kg > 0 && set.reps > 0 ? set.kg * set.reps : 0), 0),
          maxKg: Math.max(0, ...values.map((set) => set.kg)),
          cardioMinutes: 0,
        };
      })
      .filter((session): session is TrainingSession => session !== null)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 6);
  }, [logs, selected, today]);

  const latest = history[0];
  const previous = history[1];
  const comparison = !latest || !previous
    ? null
    : selected?.type === "cardio"
      ? { label: "Duración frente a la sesión anterior", value: signed(latest.cardioMinutes - previous.cardioMinutes, "min") }
      : latest.volumeKg > 0 && previous.volumeKg > 0
        ? { label: "Volumen frente a la sesión anterior", value: signed(latest.volumeKg - previous.volumeKg, "kg·reps") }
        : latest.totalReps > 0 && previous.totalReps > 0
          ? { label: "Repeticiones frente a la sesión anterior", value: signed(latest.totalReps - previous.totalReps, "reps") }
          : null;

  return (
    <div className="space-y-4">
      <Card>
        <SectionTitle
          title="Tendencia semanal de entrenamiento"
          hint="Resumen de las últimas cuatro semanas con datos guardados. El volumen suma kg × repeticiones cuando ambos valores existen; no representa una medida de esfuerzo perfecta."
        />
        {weeklySummary.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line p-4 text-sm text-muted">
            Aún no hay entrenamientos registrados. Guarda peso y repeticiones, o los minutos de cardio, para ver tu tendencia semanal.
          </p>
        ) : (
          <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Tendencia semanal de entrenamiento">
            <table className="w-full min-w-[540px] text-left text-sm">
              <thead className="text-muted">
                <tr>
                  <th className="py-2 pr-3 font-normal">Semana desde</th>
                  <th className="py-2 pr-3 text-right font-normal">Días registrados</th>
                  <th className="py-2 pr-3 text-right font-normal">Series con datos</th>
                  <th className="py-2 pr-3 text-right font-normal">Volumen fuerza</th>
                  <th className="py-2 text-right font-normal">Cardio</th>
                </tr>
              </thead>
              <tbody>
                {weeklySummary.map((week) => (
                  <tr key={week.weekStart} className="border-t border-line">
                    <td className="py-2 pr-3 capitalize">{displayDate(week.weekStart)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{week.sessions}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{week.sets}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">{week.strengthVolumeKg > 0 ? Math.round(week.strengthVolumeKg).toLocaleString("es-ES") + " kg" : "—"}</td>
                    <td className="py-2 text-right tabular-nums">{week.cardioMinutes > 0 ? week.cardioMinutes + " min" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs leading-5 text-muted">
          Un día cuenta como registrado si contiene al menos una serie con datos o minutos de cardio. La semana actual puede estar incompleta; compárala con semanas de duración similar y prioriza técnica y recuperación sobre perseguir más volumen.
        </p>
      </Card>

      <Card>
        <SectionTitle
          title="Historial y progresión"
          hint="Consulta tus últimas seis sesiones registradas por ejercicio. Solo se muestran datos guardados; no se inventan marcas ni sesiones."
        />
        <label className="block max-w-2xl text-sm text-muted">
          Selecciona el ejercicio
          <select
            value={selected?.id ?? ""}
            onChange={(event) => setExerciseId(event.target.value)}
            className="mt-1 block h-11 w-full rounded-xl border border-line bg-ink/70 px-3 text-chalk"
          >
            {EXERCISE_OPTIONS.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>{exercise.day} · {exercise.name}</option>
            ))}
          </select>
        </label>

        {!latest ? (
          <p className="mt-4 rounded-xl border border-dashed border-line p-4 text-sm text-muted">
            Aún no hay sesiones guardadas para este ejercicio. Registra peso y repeticiones en Rutina y aquí podrás seguir tu progresión.
          </p>
        ) : (
          <>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-line/70 bg-ink/20 p-4">
                <p className="text-sm text-muted">Última sesión</p>
                <p className="mt-1 font-display text-xl capitalize">{displayDate(latest.date)}</p>
                <p className="mt-1 text-xs text-muted">{latest.setsCount} {selected?.type === "cardio" ? "bloque registrado" : "series con datos"}</p>
              </div>
              {selected?.type === "cardio" ? (
                <div className="rounded-xl border border-line/70 bg-ink/20 p-4">
                  <p className="text-sm text-muted">Última duración</p>
                  <p className="mt-1 font-display text-3xl tabular-nums">{latest.cardioMinutes} min</p>
                </div>
              ) : (
                <>
                  <div className="rounded-xl border border-line/70 bg-ink/20 p-4">
                    <p className="text-sm text-muted">Mayor carga registrada</p>
                    <p className="mt-1 font-display text-3xl tabular-nums">{latest.maxKg > 0 ? `${latest.maxKg.toLocaleString("es-ES")} kg` : "—"}</p>
                  </div>
                  <div className="rounded-xl border border-line/70 bg-ink/20 p-4">
                    <p className="text-sm text-muted">Volumen de la última sesión</p>
                    <p className="mt-1 font-display text-3xl tabular-nums">{latest.volumeKg > 0 ? Math.round(latest.volumeKg).toLocaleString("es-ES") : "—"}</p>
                    <p className="mt-1 text-xs text-muted">kg × repeticiones; solo series con ambos valores</p>
                  </div>
                </>
              )}
            </div>
            {comparison && (
              <p className="mt-3 rounded-xl bg-raised p-3 text-sm">
                <span className="text-muted">{comparison.label}: </span>
                <strong className="tabular-nums">{comparison.value}</strong>
              </p>
            )}

            <div className="mt-4 overflow-x-auto" tabIndex={0} role="region" aria-label="Historial del ejercicio">
              <table className="w-full min-w-[500px] text-left text-sm">
                <thead className="text-muted">
                  <tr>
                    <th className="py-2 pr-3 font-normal">Fecha</th>
                    <th className="py-2 pr-3 text-right font-normal">{selected?.type === "cardio" ? "Duración" : "Series"}</th>
                    {selected?.type === "strength" && (
                      <>
                        <th className="py-2 pr-3 text-right font-normal">Repeticiones</th>
                        <th className="py-2 pr-3 text-right font-normal">Carga máx.</th>
                        <th className="py-2 text-right font-normal">Volumen</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {history.map((session) => (
                    <tr key={session.date} className="border-t border-line">
                      <td className="py-2 pr-3 capitalize">{displayDate(session.date)}</td>
                      {selected?.type === "cardio" ? (
                        <td className="py-2 pr-3 text-right tabular-nums">{session.cardioMinutes} min</td>
                      ) : (
                        <>
                          <td className="py-2 pr-3 text-right tabular-nums">{session.setsCount}</td>
                          <td className="py-2 pr-3 text-right tabular-nums">{session.totalReps || "—"}</td>
                          <td className="py-2 pr-3 text-right tabular-nums">{session.maxKg > 0 ? `${session.maxKg.toLocaleString("es-ES")} kg` : "—"}</td>
                          <td className="py-2 text-right tabular-nums">{session.volumeKg > 0 ? `${Math.round(session.volumeKg).toLocaleString("es-ES")} kg` : "—"}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
