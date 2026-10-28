"use client";

import { useMemo, useState } from "react";
import { Activity, Trash2 } from "lucide-react";
import { useProfile, useStore, type BodyMeasurementEntry } from "@/lib/store";
import { todayISO } from "@/lib/time";
import { Card, SectionTitle } from "./ui";

function optionalNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

function formatDelta(value: number | undefined, baseline: number): string {
  if (value === undefined) return "Sin dato";
  const delta = value - baseline;
  if (Math.abs(delta) < 0.05) return "Sin cambio";
  return `${delta > 0 ? "+" : "−"}${Math.abs(delta).toFixed(1)}`;
}

export function BodyMetricsTab() {
  const { state, saveBodyMeasurement, removeBodyMeasurement } = useStore();
  const profile = useProfile();
  const [date, setDate] = useState(todayISO());
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [fat, setFat] = useState("");
  const [muscle, setMuscle] = useState("");
  const [visceral, setVisceral] = useState("");
  const [message, setMessage] = useState("");

  const entries = state.bodyMeasurements;
  // Línea base: tu primera medición registrada; si no hay, el peso con el que empezaste.
  const first = entries.length ? entries[0] : undefined;
  const baselineWeight = first?.weightKg ?? profile.startWeightKg;
  const latest = entries.length ? entries[entries.length - 1] : undefined;
  const previous = entries.length > 1 ? entries[entries.length - 2] : undefined;
  const sorted = useMemo(() => [...entries].reverse(), [entries]);

  const save = () => {
    const weightKg = optionalNumber(weight);
    const waistCm = optionalNumber(waist);
    const bodyFatPercent = optionalNumber(fat);
    const skeletalMuscleKg = optionalNumber(muscle);
    const visceralFatLevel = optionalNumber(visceral);
    if (!date || date > todayISO()) {
      setMessage("Selecciona una fecha válida, no futura.");
      return;
    }
    if (weightKg === undefined || weightKg < 30 || weightKg > 300) {
      setMessage("El peso es obligatorio y debe estar entre 30 y 300 kg.");
      return;
    }
    if (waist.trim() && (waistCm === undefined || waistCm < 30 || waistCm > 250)) {
      setMessage("La cintura debe estar entre 30 y 250 cm.");
      return;
    }
    if (fat.trim() && (bodyFatPercent === undefined || bodyFatPercent <= 0 || bodyFatPercent >= 75)) {
      setMessage("El porcentaje de grasa debe ser mayor que 0 y menor que 75.");
      return;
    }
    if (muscle.trim() && (skeletalMuscleKg === undefined || skeletalMuscleKg <= 0 || skeletalMuscleKg > weightKg)) {
      setMessage("Revisa el valor de masa muscular.");
      return;
    }
    if (visceral.trim() && (visceralFatLevel === undefined || visceralFatLevel < 0 || visceralFatLevel > 100)) {
      setMessage("Revisa el índice de grasa visceral.");
      return;
    }
    const entry: BodyMeasurementEntry = { date, weightKg };
    if (waistCm !== undefined) entry.waistCm = Math.round(waistCm * 10) / 10;
    if (bodyFatPercent !== undefined) entry.bodyFatPercent = Math.round(bodyFatPercent * 10) / 10;
    if (skeletalMuscleKg !== undefined) entry.skeletalMuscleKg = Math.round(skeletalMuscleKg * 10) / 10;
    if (visceralFatLevel !== undefined) entry.visceralFatLevel = Math.round(visceralFatLevel * 10) / 10;
    saveBodyMeasurement(entry);
    setMessage(`Medición del ${date} guardada. Si ya existía esa fecha, se actualizó.`);
    setWaist("");
    setFat("");
    setMuscle("");
    setVisceral("");
  };

  return (
    <div className="space-y-6">
      <Card>
        <SectionTitle title="Historial de composición corporal" hint="Registra mediciones nuevas tomadas en condiciones parecidas. Los campos que no tengas pueden quedar vacíos." />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Metric label="Peso inicial" value={`${baselineWeight.toFixed(1)} kg`} />
          <Metric label="Grasa inicial estimada" value={first?.bodyFatPercent !== undefined ? `${first.bodyFatPercent.toFixed(1)} %` : "Sin dato"} />
          <Metric label="Músculo esquelético inicial" value={first?.skeletalMuscleKg !== undefined ? `${first.skeletalMuscleKg.toFixed(1)} kg` : "Sin dato"} />
        </div>
        <p className="mt-3 text-xs leading-5 text-muted">La línea base es tu primera medición registrada. Si aún no tienes ninguna, se usa el peso con el que empezaste. Los valores de composición son estimaciones del equipo, no diagnósticos.</p>
      </Card>

      <Card>
        <SectionTitle title="Registrar medición" hint="El peso es obligatorio. Cintura y composición corporal son opcionales." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Fecha">
            <input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} className="mt-1 block min-h-11 w-full rounded-xl border border-line bg-ink px-3 py-2 text-chalk tabular-nums" />
          </Field>
          <Field label="Peso (kg) *">
            <input type="number" min="30" max="300" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="70.0" className="field-input" />
          </Field>
          <Field label="Cintura (cm)">
            <input type="number" min="30" max="250" step="0.1" value={waist} onChange={(e) => setWaist(e.target.value)} placeholder="Pendiente" className="field-input" />
          </Field>
          <Field label="Grasa corporal (%)">
            <input type="number" min="0.1" max="74.9" step="0.1" value={fat} onChange={(e) => setFat(e.target.value)} placeholder="Solo si tienes medición" className="field-input" />
          </Field>
          <Field label="Músculo esquelético (kg)">
            <input type="number" min="0.1" step="0.1" value={muscle} onChange={(e) => setMuscle(e.target.value)} placeholder="Solo si tienes medición" className="field-input" />
          </Field>
          <Field label="Índice de grasa visceral">
            <input type="number" min="0" max="100" step="1" value={visceral} onChange={(e) => setVisceral(e.target.value)} placeholder="Según el equipo" className="field-input" />
          </Field>
        </div>
        <button onClick={save} className="mt-4 min-h-11 rounded-xl bg-flame px-5 font-semibold text-ink hover:brightness-110">Guardar medición</button>
        <p className="mt-2 min-h-5 text-sm text-muted" role="status">{message}</p>
      </Card>

      <Card>
        <SectionTitle title="Última medición frente a la línea base" hint="Las diferencias aparecen solo cuando existe un dato comparable." />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Peso" value={latest ? `${latest.weightKg.toFixed(1)} kg` : "Sin registro"} detail={latest ? `${formatDelta(latest.weightKg - baselineWeight, 0)} kg frente al inicio` : "Registra tu primera medición"} />
          <Metric label="Cintura" value={latest?.waistCm !== undefined ? `${latest.waistCm.toFixed(1)} cm` : "Sin registro"} detail={latest?.waistCm !== undefined ? "Compara con futuras mediciones" : "Pendiente de medir"} />
          <Metric label="Grasa corporal" value={latest?.bodyFatPercent !== undefined ? `${latest.bodyFatPercent.toFixed(1)} %` : "Sin registro"} detail={latest?.bodyFatPercent !== undefined ? `${formatDelta(latest.bodyFatPercent, first?.bodyFatPercent ?? latest.bodyFatPercent)} puntos porcentuales vs. inicio` : "Solo con medición disponible"} />
          <Metric label="Músculo esquelético" value={latest?.skeletalMuscleKg !== undefined ? `${latest.skeletalMuscleKg.toFixed(1)} kg` : "Sin registro"} detail={latest?.skeletalMuscleKg !== undefined ? `${formatDelta(latest.skeletalMuscleKg, first?.skeletalMuscleKg ?? latest.skeletalMuscleKg)} kg vs. inicio` : "Solo con medición disponible"} />
        </div>
        {previous && latest && (
          <p className="mt-3 text-sm text-muted">Entre las dos últimas fechas registradas: peso {formatDelta(latest.weightKg - previous.weightKg, 0)} kg.</p>
        )}
      </Card>

      <Card>
        <SectionTitle title="Mediciones guardadas" hint="Se conserva una entrada por fecha. Puedes borrar una entrada incorrecta sin eliminar los demás datos de la app." />
        {sorted.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line p-6 text-center">
            <Activity className="mx-auto text-muted" size={26} aria-hidden />
            <p className="mt-2 font-medium">Todavía no hay mediciones nuevas</p>
            <p className="mt-1 text-sm text-muted">La bioimpedancia inicial queda conservada como referencia.</p>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {sorted.map((entry) => (
              <li key={entry.date} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-medium tabular-nums">{entry.date} · {entry.weightKg.toFixed(1)} kg</p>
                  <p className="mt-1 text-xs text-muted">
                    {entry.waistCm !== undefined ? `Cintura ${entry.waistCm.toFixed(1)} cm` : "Cintura —"}
                    {" · "}{entry.bodyFatPercent !== undefined ? `Grasa ${entry.bodyFatPercent.toFixed(1)} %` : "Grasa —"}
                    {" · "}{entry.skeletalMuscleKg !== undefined ? `Músculo ${entry.skeletalMuscleKg.toFixed(1)} kg` : "Músculo —"}
                    {" · "}{entry.visceralFatLevel !== undefined ? `Visceral ${entry.visceralFatLevel}` : "Visceral —"}
                  </p>
                </div>
                <button onClick={() => { removeBodyMeasurement(entry.date); setMessage(`Medición del ${entry.date} eliminada.`); }} aria-label={`Eliminar medición del ${entry.date}`} className="flex h-11 w-11 items-center justify-center rounded-xl text-muted hover:bg-raised hover:text-rose">
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm text-muted">{label}{children}</label>;
}

function Metric({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-xl border border-line/70 bg-ink/15 p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl tabular-nums">{value}</p>
      {detail && <p className="mt-1 text-xs leading-5 text-muted">{detail}</p>}
    </div>
  );
}
