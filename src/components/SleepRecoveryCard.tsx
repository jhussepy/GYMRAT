"use client";

import { useEffect, useMemo, useState } from "react";
import { Moon, Save } from "lucide-react";
import { useStore } from "@/lib/store";
import { todayISO } from "@/lib/time";
import { Card, SectionTitle } from "./ui";

const ratingOptions = [
  { value: "1", label: "1 · Muy bajo" },
  { value: "2", label: "2 · Bajo" },
  { value: "3", label: "3 · Normal" },
  { value: "4", label: "4 · Bueno" },
  { value: "5", label: "5 · Muy bueno" },
];

function dateOffset(date: string, offset: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

export function SleepRecoveryCard() {
  const today = todayISO();
  const { state, saveSleepRecovery } = useStore();
  const [date, setDate] = useState(today);
  const [hours, setHours] = useState("7");
  const [quality, setQuality] = useState("3");
  const [energy, setEnergy] = useState("3");
  const [fatigue, setFatigue] = useState("3");
  const [message, setMessage] = useState("");

  const saved = state.sleepRecovery[date];

  useEffect(() => {
    setHours(saved ? String(saved.sleepHours) : "");
    setQuality(saved ? String(saved.quality) : "3");
    setEnergy(saved ? String(saved.energy) : "3");
    setFatigue(saved ? String(saved.fatigue) : "3");
  }, [date, saved]);

  const lastSevenDays = useMemo(() => {
    const dates = Array.from({ length: 7 }, (_, i) => dateOffset(today, i - 6));
    const entries = dates.flatMap((d) => state.sleepRecovery[d] ? [{ date: d, ...state.sleepRecovery[d] }] : []);
    if (!entries.length) return null;
    const average = (key: "sleepHours" | "quality" | "energy" | "fatigue") =>
      entries.reduce((sum, entry) => sum + entry[key], 0) / entries.length;
    return {
      count: entries.length,
      sleepHours: average("sleepHours"),
      quality: average("quality"),
      energy: average("energy"),
      fatigue: average("fatigue"),
    };
  }, [state.sleepRecovery, today]);

  const save = () => {
    const parsedHours = Number(hours);
    if (!date || date > today) {
      setMessage("Selecciona una fecha válida, hasta hoy.");
      return;
    }
    if (!Number.isFinite(parsedHours) || parsedHours < 0 || parsedHours > 24) {
      setMessage("Introduce el total de sueño entre 0 y 24 horas.");
      return;
    }
    saveSleepRecovery(date, {
      sleepHours: parsedHours,
      quality: Number(quality),
      energy: Number(energy),
      fatigue: Number(fatigue),
    });
    setMessage(`Registro del ${date} guardado.`);
  };

  return (
    <Card>
      <SectionTitle
        title="Sueño y recuperación"
        hint="Registra el sueño total de las últimas 24 horas, incluidas las siestas, y cómo te encuentras. Son valoraciones subjetivas para ayudarte a detectar tendencias."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm text-muted">
          Fecha
          <input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} className="mt-1 block h-11 w-full rounded-xl border border-line bg-ink px-3 text-chalk" />
        </label>
        <label className="text-sm text-muted">
          Sueño total (horas)
          <input type="number" inputMode="decimal" min="0" max="24" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="Ej. 6.5" className="mt-1 block h-11 w-full rounded-xl border border-line bg-ink px-3 text-chalk tabular-nums" />
        </label>
        <RatingSelect label="Calidad del sueño" value={quality} onChange={setQuality} />
        <RatingSelect label="Energía al despertar" value={energy} onChange={setEnergy} />
        <RatingSelect label="Fatiga muscular" value={fatigue} onChange={setFatigue} />
      </div>
      <p className="mt-2 text-xs leading-5 text-muted">
        Escala de 1 a 5: calidad y energía van de muy bajas a muy buenas; fatiga va de muy baja a muy alta.
      </p>
      <button onClick={save} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-flame px-5 font-medium text-ink hover:brightness-110">
        <Save size={16} aria-hidden /> Guardar recuperación
      </button>
      <p className="mt-2 min-h-5 text-sm text-muted" role="status">{message}</p>

      <div className="mt-5 border-t border-line pt-5">
        <h3 className="flex items-center gap-2 font-display text-lg">
          <Moon size={18} className="text-dusk" aria-hidden /> Resumen de 7 días
        </h3>
        {!lastSevenDays ? (
          <p className="mt-2 rounded-xl border border-dashed border-line p-4 text-sm text-muted">
            Todavía no hay registros recientes. Guarda tus datos cada día para observar la tendencia.
          </p>
        ) : (
          <>
            <p className="mt-1 text-xs text-muted">Promedios de los días registrados: {lastSevenDays.count} de los últimos 7 días.</p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SummaryStat label="Sueño medio" value={`${lastSevenDays.sleepHours.toFixed(1)} h`} />
              <SummaryStat label="Calidad media" value={`${lastSevenDays.quality.toFixed(1)} / 5`} />
              <SummaryStat label="Energía media" value={`${lastSevenDays.energy.toFixed(1)} / 5`} />
              <SummaryStat label="Fatiga media" value={`${lastSevenDays.fatigue.toFixed(1)} / 5`} />
            </div>
          </>
        )}
      </div>
      <p className="mt-4 text-xs leading-5 text-muted">
        Como referencia general, muchos adultos necesitan 7–9 horas de sueño total al día. Si una noche fue corta o la fatiga es alta, considera reducir la intensidad y priorizar la recuperación; no uses una sola puntuación como diagnóstico.
      </p>
    </Card>
  );
}

function RatingSelect({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="text-sm text-muted">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 block h-11 w-full rounded-xl border border-line bg-ink px-3 text-chalk">
        {ratingOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line/70 bg-ink/15 p-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-display text-xl tabular-nums">{value}</p>
    </div>
  );
}
