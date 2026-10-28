"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { weekdayFromDate } from "@/lib/config";
import { planFor } from "@/lib/plan";
import { useProfile, useStore } from "@/lib/store";
import { addDays, computeSummary, parseISO, sessionStats, STRENGTH_MET, type SessionStats } from "@/lib/training";
import { todayISO } from "@/lib/time";
import { Card, ProgressBar, SectionTitle } from "./ui";

const DOW = ["L", "M", "X", "J", "V", "S", "D"];
const DOW_FULL = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

const fmt = (n: number) => n.toLocaleString("es");
const longDate = (date: string) => parseISO(date).toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" });

export function TrainingCalendar() {
  const { state, setSession } = useStore();
  const profile = useProfile();
  const [today, setToday] = useState("");
  const [view, setView] = useState<{ y: number; m: number } | null>(null);
  const [selected, setSelected] = useState("");

  useEffect(() => {
    const t = todayISO();
    const d = parseISO(t);
    setToday(t);
    setView({ y: d.getFullYear(), m: d.getMonth() });
    setSelected(t);
  }, []);

  const summary = useMemo(() => (today ? computeSummary(state, today) : null), [state, today]);

  const month = useMemo(() => {
    if (!view) return null;
    const count = new Date(view.y, view.m + 1, 0).getDate();
    const lead = (new Date(view.y, view.m, 1).getDay() + 6) % 7;
    const days: SessionStats[] = [];
    for (let i = 1; i <= count; i++) days.push(sessionStats(todayISO(new Date(view.y, view.m, i)), state));
    return {
      lead,
      days,
      trained: days.filter((d) => d.trained).length,
      kcal: days.reduce((n, d) => n + d.kcal, 0),
      label: new Date(view.y, view.m, 1).toLocaleDateString("es", { month: "long", year: "numeric" }),
    };
  }, [view, state]);

  if (!today || !view || !summary || !month) {
    return (
      <Card>
        <SectionTitle title="Constancia" />
        <p className="text-sm text-muted">Cargando tu calendario…</p>
      </Card>
    );
  }

  const shift = (delta: number) => {
    const d = new Date(view.y, view.m + delta, 1);
    setView({ y: d.getFullYear(), m: d.getMonth() });
  };

  const sel = sessionStats(selected, state);
  const isFuture = selected > today;
  const plan = planFor(profile.trainingDays, weekdayFromDate(parseISO(selected)));
  const focus = plan ? plan.focus : "Descanso";

  return (
    <Card>
      <SectionTitle title="Constancia" hint="Tus días de entreno salen de las series que registras en Rutina. También puedes marcar un día a mano." />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Racha actual" value={`${summary.currentStreak} ${summary.currentStreak === 1 ? "día" : "días"}`} />
        <Stat label="Mejor racha" value={`${summary.bestStreak} ${summary.bestStreak === 1 ? "día" : "días"}`} />
        <Stat label="Esta semana" value={`${summary.weekDone} de ${summary.weekPlanned}`} />
        <Stat label="Kcal esta semana" value={fmt(summary.weekKcal)} />
      </div>
      <div className="mt-3">
        <ProgressBar value={summary.weekDone} max={summary.weekPlanned} label="Días entrenados esta semana" />
      </div>
      <p className="mt-2 text-xs text-muted">El domingo es descanso y no rompe la racha.</p>

      <div className="mt-6 flex items-center justify-between">
        <button onClick={() => shift(-1)} aria-label="Mes anterior" className="flex h-11 w-11 items-center justify-center rounded-sm border border-line text-muted transition-colors duration-200 hover:text-chalk">
          <ChevronLeft size={20} aria-hidden />
        </button>
        <div className="text-center">
          <h3 className="text-lg capitalize">{month.label}</h3>
          <p className="text-xs text-muted">
            {month.trained} {month.trained === 1 ? "día entrenado" : "días entrenados"} · {fmt(month.kcal)} kcal
          </p>
        </div>
        <button onClick={() => shift(1)} aria-label="Mes siguiente" className="flex h-11 w-11 items-center justify-center rounded-sm border border-line text-muted transition-colors duration-200 hover:text-chalk">
          <ChevronRight size={20} aria-hidden />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs text-muted" aria-hidden>
        {DOW.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1" role="group" aria-label={`Calendario de ${month.label}`}>
        {Array.from({ length: month.lead }, (_, i) => (
          <span key={`b${i}`} />
        ))}
        {month.days.map((st, i) => {
          const day = i + 1;
          const dow = (month.lead + i) % 7;
          const future = st.date > today;
          const isToday = st.date === today;
          const isSel = st.date === selected;
          const base = st.trained ? "bg-flame text-ink font-medium" : dow === 6 ? "bg-transparent text-muted" : "bg-raised text-chalk";
          return (
            <button
              key={st.date}
              onClick={() => setSelected(st.date)}
              aria-pressed={isSel}
              aria-current={isToday ? "date" : undefined}
              aria-label={`${day} de ${month.label}, ${DOW_FULL[dow]}${st.trained ? `, entrenado, ${st.kcal} kcal` : dow === 6 ? ", descanso" : ""}`}
              className={`relative flex h-11 items-center justify-center rounded-sm border text-sm transition-colors duration-200 ${base} ${isSel ? "border-chalk" : "border-transparent"} ${isToday ? "ring-2 ring-amber ring-offset-1 ring-offset-panel" : ""} ${future ? "opacity-50" : ""}`}
            >
              {day}
              {st.trained && <Check size={11} className="absolute right-1 top-1" aria-hidden />}
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-sm border border-line p-4">
        <p className="text-sm capitalize text-muted">{longDate(selected)}</p>
        <h3 className="mt-1 text-xl">{focus}</h3>

        {isFuture ? (
          <p className="mt-3 text-sm text-muted">Este día todavía no llega.</p>
        ) : (
          <>
            <p className="mt-2 text-sm">
              {sel.trained ? (sel.auto ? "Entrenado: detectado por tus series registradas." : sel.manual ? "Entrenado: marcado a mano." : "Con calorías reales anotadas.") : "Sin entreno registrado."}
            </p>

            {sel.trained && (
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <Detail label="Series hechas" value={sel.auto ? String(sel.setsDone) : "—"} />
                <Detail label="Volumen" value={sel.auto && sel.volumeKg > 0 ? `${fmt(sel.volumeKg)} kg` : "—"} />
                <Detail label="Duración est." value={sel.minutes > 0 ? `${sel.minutes} min` : "—"} />
                <Detail label={sel.kcalReal ? "Kcal reales" : "Kcal estimadas"} value={fmt(sel.kcal)} />
              </dl>
            )}

            <div className="mt-4 flex flex-wrap items-end gap-3">
              <label className="text-sm text-muted">
                Calorías reales (reloj), opcional
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={5000}
                  value={sel.kcalReal ?? ""}
                  onChange={(e) => setSession(selected, { kcalReal: e.target.value === "" ? null : Number(e.target.value) })}
                  placeholder={sel.trained && sel.kcalEstimated > 0 ? `${sel.kcalEstimated} est.` : "kcal"}
                  className="mt-1 block h-11 w-36 rounded-sm border border-line bg-ink px-3 text-chalk tabular-nums placeholder:text-muted/70 focus:border-flame"
                />
              </label>
              {!sel.auto && (
                <button onClick={() => setSession(selected, { manual: !sel.manual })} className="min-h-[44px] rounded-sm border border-line px-4 text-sm transition-colors duration-200 hover:bg-raised">
                  {sel.manual ? "Quitar marca de entrenado" : "Marcar como entrenado"}
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <p className="mt-4 text-xs text-muted">
        Las calorías son una estimación (fuerza {STRENGTH_MET} MET, cardio 6 MET, con tu último peso) y pueden variar ±20 a 30 %. Si usas reloj o pulsera, escribe el dato real y se usará ese.
      </p>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-line p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl tabular-nums">{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 font-display text-lg tabular-nums">{value}</dd>
    </div>
  );
}
