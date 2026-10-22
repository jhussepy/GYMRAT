"use client";

import { useRef, useState } from "react";
import { Download, Moon, Scale, Target, Trash2, Upload } from "lucide-react";
import { BODY_BASELINE, PROFILE } from "@/lib/config";
import { useStore, type WeightEntry } from "@/lib/store";
import { todayISO } from "@/lib/time";
import { Card, ProgressBar, SectionTitle } from "./ui";
import { TrainingCalendar } from "./TrainingCalendar";
import { BodyMetricsTab } from "./BodyMetricsTab";
import { SleepRecoveryCard } from "./SleepRecoveryCard";

export function ProgressTab() {
  const { state, saveWeight, removeWeight, exportJSON, importJSON, resetAll } = useStore();
  const [date, setDate] = useState("");
  const [kg, setKg] = useState("");
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const weights = state.weights;
  const last = weights.length ? weights[weights.length - 1].kg : PROFILE.currentWeightKg;
  const lost = PROFILE.startWeightKg - last;
  const total = PROFILE.startWeightKg - PROFILE.goalWeightKg;
  const firstMilestoneProgress = Math.max(0, PROFILE.currentWeightKg - last);
  const firstMilestoneTotal = PROFILE.currentWeightKg - PROFILE.firstMilestoneKg;

  const submit = () => {
    const value = parseFloat(kg.replace(",", "."));
    const d = date || todayISO();
    if (!Number.isFinite(value) || value < 30 || value > 300) {
      setMsg("Escribe un peso entre 30 y 300 kg.");
      return;
    }
    saveWeight(d, Math.round(value * 10) / 10);
    setKg("");
    setMsg(`Peso del ${d} guardado.`);
  };

  const download = () => {
    const blob = new Blob([exportJSON()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `coach-pro-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMsg("Copia de seguridad descargada.");
  };

  const upload = async (file: File | undefined) => {
    if (!file) return;
    const ok = importJSON(await file.text());
    setMsg(ok ? "Datos importados." : "El archivo no es una copia válida de Coach Pro.");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      <Card>
        <SectionTitle title="Tu progreso" hint="Pésate en condiciones similares cada semana. Observa la tendencia, no un solo día." />
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Peso actual" value={`${last.toFixed(1)} kg`} />
          <Stat label="Cambio desde el inicio" value={`${lost > 0 ? "−" : lost < 0 ? "+" : ""}${Math.abs(lost).toFixed(1)} kg`} />
          <Stat label={`Distancia a ${PROFILE.goalWeightKg} kg`} value={`${Math.max(0, last - PROFILE.goalWeightKg).toFixed(1)} kg`} />
        </div>
        <div className="mt-4">
          <ProgressBar value={Math.max(0, lost)} max={total} label="Avance hacia la meta de largo plazo" />
          <p className="mt-1.5 text-sm text-muted tabular-nums">
            Inicio histórico: {PROFILE.startWeightKg} kg · meta de largo plazo: {PROFILE.goalWeightKg} kg
          </p>
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <SectionTitle title="Tu punto de partida físico" hint="Bioimpedancia del 22/10/2026 · Esta es tu línea base para el cambio físico." />
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber/40 bg-amber/10 px-3 py-1.5 text-xs font-medium text-amber">
            <Scale size={14} aria-hidden /> Línea base
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <BaselineStat label="Peso medido" value={`${BODY_BASELINE.weightKg.toFixed(1)} kg`} detail="22 oct 2026" />
          <BaselineStat label="Grasa corporal" value={`${BODY_BASELINE.bodyFatPercent.toFixed(1)} %`} detail={`${BODY_BASELINE.fatMassKg.toFixed(1)} kg de grasa estimada`} />
          <BaselineStat label="Masa libre de grasa" value={`${BODY_BASELINE.fatFreeMassKg.toFixed(1)} kg`} detail="Incluye músculo, agua, huesos y órganos" />
          <BaselineStat label="IMC" value={BODY_BASELINE.bmi.toFixed(1)} detail="Indicador de cribado, no diagnóstico" />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-line/70 bg-ink/20 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Target size={17} className="text-flame" aria-hidden /> Primera meta
            </div>
            <p className="mt-2 font-display text-3xl tabular-nums">{PROFILE.firstMilestoneKg.toFixed(1)} kg</p>
            <p className="mt-1 text-sm leading-5 text-muted">
              Aproximadamente un 5 % menos que tu peso de referencia: unos {(BODY_BASELINE.weightKg - PROFILE.firstMilestoneKg).toFixed(1)} kg por debajo del registro inicial. Después, revisamos cómo te sientes y cómo evoluciona tu composición corporal.
            </p>
            <div className="mt-4">
              <ProgressBar value={firstMilestoneProgress} max={firstMilestoneTotal} label="Avance hacia la primera meta" />
            </div>
          </div>

          <div className="rounded-xl border border-line/70 bg-ink/20 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Moon size={17} className="text-dusk" aria-hidden /> Recuperación: prioridad
            </div>
            <p className="mt-2 font-display text-2xl">{BODY_BASELINE.sleepHoursLabel}</p>
            <p className="mt-1 text-sm leading-5 text-muted">
              Tu registro indica {BODY_BASELINE.trainingDaysPerWeek} días de entrenamiento por semana y menos de 6 horas de sueño habitual. Antes de subir la intensidad, trabaja gradualmente hacia 7–9 horas totales de sueño al día, contando las siestas.
            </p>
            <p className="mt-3 text-xs leading-5 text-muted">
              Cintura: pendiente de medir · Síntomas durante el ejercicio: {BODY_BASELINE.exerciseSymptoms.toLowerCase()}.
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-line/70 p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <BaselineStat label="Grasa visceral (índice)" value={String(BODY_BASELINE.visceralFatLevel)} detail="Índice del equipo; no es una medición directa de grasa alrededor de los órganos" />
            <BaselineStat label="Músculo esquelético estimado" value={`≈${BODY_BASELINE.skeletalMuscleKg} kg`} detail="Úsalo para comparar mediciones tomadas en condiciones similares" />
            <BaselineStat label="Cintura" value="Pendiente" detail="Mídela a la altura del ombligo y registra el dato" />
          </div>
        </div>
        <p className="mt-4 text-xs leading-5 text-muted">
          La bioimpedancia estima la composición corporal y puede variar con la hidratación, las comidas y el ejercicio reciente. Usa estos datos como referencia, no como diagnóstico. El objetivo es reducir grasa progresivamente, conservar músculo y mejorar la recuperación.
        </p>
      </Card>

      <BodyMetricsTab />

      <SleepRecoveryCard />

      <TrainingCalendar />

      <Card>
        <SectionTitle title="Registrar pesaje" />
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm text-muted">
            Fecha
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={todayISO()} className="mt-1 block h-11 rounded-sm border border-line bg-ink px-3 text-chalk" />
          </label>
          <label className="text-sm text-muted">
            Peso (kg)
            <input type="number" inputMode="decimal" step="0.1" value={kg} onChange={(e) => setKg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="97.7" className="mt-1 block w-28 rounded-sm border border-line bg-ink px-3 py-2 text-chalk tabular-nums" />
          </label>
          <button onClick={submit} className="rounded-sm bg-flame px-5 min-h-[44px] font-medium text-ink hover:brightness-110">
            Guardar peso
          </button>
        </div>
        <p className="mt-2 min-h-5 text-sm text-muted" role="status">
          {msg}
        </p>
      </Card>

      <Card>
        <SectionTitle title="Evolución" />
        <WeightChart weights={weights} />
        {weights.length > 0 && (
          <ul className="mt-4 divide-y divide-line text-sm">
            {[...weights].reverse().map((w) => (
              <li key={w.date} className="flex items-center justify-between py-2">
                <span className="tabular-nums text-muted">{w.date}</span>
                <span className="tabular-nums">{w.kg.toFixed(1)} kg</span>
                <button onClick={() => removeWeight(w.date)} aria-label={`Borrar el pesaje del ${w.date}`} className="flex h-11 w-11 items-center justify-center rounded-sm text-muted hover:bg-raised hover:text-rose">
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <SectionTitle title="Copia de seguridad" hint="Tus datos viven solo en este navegador. Descarga una copia para no perderlos o para pasarlos a otro dispositivo." />
        <div className="flex flex-wrap gap-2">
          <button onClick={download} className="flex items-center gap-2 min-h-[44px] rounded-sm border border-line px-4 text-sm hover:bg-raised">
            <Download size={16} /> Descargar copia (JSON)
          </button>
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 min-h-[44px] rounded-sm border border-line px-4 text-sm hover:bg-raised">
            <Upload size={16} /> Importar copia
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => void upload(e.target.files?.[0])} />
          <button
            onClick={() => {
              if (window.confirm("Se borrarán agua, series, pesos, calendario y compras de este dispositivo. ¿Continuar?")) {
                resetAll();
                setMsg("Datos borrados.");
              }
            }}
            className="flex items-center gap-2 min-h-[44px] rounded-sm border border-rose/40 px-4 text-sm text-rose hover:bg-rose/10"
          >
            <Trash2 size={16} /> Borrar todo
          </button>
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-line p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 font-display text-3xl tabular-nums">{value}</p>
    </div>
  );
}

function BaselineStat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-xl border border-line/70 bg-ink/15 p-3.5">
      <p className="text-xs leading-5 text-muted">{label}</p>
      <p className="mt-1.5 font-display text-2xl tabular-nums">{value}</p>
      <p className="mt-1 text-xs leading-5 text-muted">{detail}</p>
    </div>
  );
}

function WeightChart({ weights }: { weights: WeightEntry[] }) {
  if (weights.length === 0) return <p className="text-sm text-muted">Aún no hay pesajes. Registra el primero arriba y aquí verás tu curva.</p>;

  const W = 600;
  const H = 220;
  const pad = { l: 40, r: 12, t: 12, b: 24 };
  const ys = weights.map((w) => w.kg);
  const min = Math.min(PROFILE.goalWeightKg, ...ys) - 1;
  const max = Math.max(PROFILE.startWeightKg, ...ys) + 1;
  const x = (i: number) => pad.l + (weights.length === 1 ? (W - pad.l - pad.r) / 2 : (i / (weights.length - 1)) * (W - pad.l - pad.r));
  const y = (v: number) => pad.t + ((max - v) / (max - min)) * (H - pad.t - pad.b);
  const path = weights.map((w, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(w.kg).toFixed(1)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Gráfico de tu peso en el tiempo">
      <line x1={pad.l} x2={W - pad.r} y1={y(PROFILE.goalWeightKg)} y2={y(PROFILE.goalWeightKg)} className="stroke-flame" strokeDasharray="5 5" />
      <text x={pad.l + 4} y={y(PROFILE.goalWeightKg) - 5} className="fill-flame" fontSize="11">
        Meta {PROFILE.goalWeightKg} kg
      </text>
      <line x1={pad.l} x2={W - pad.r} y1={y(PROFILE.startWeightKg)} y2={y(PROFILE.startWeightKg)} className="stroke-line" strokeDasharray="2 4" />
      <text x={pad.l + 4} y={y(PROFILE.startWeightKg) - 5} className="fill-muted" fontSize="11">
        Inicio {PROFILE.startWeightKg} kg
      </text>
      {weights.length > 1 && <path d={path} fill="none" className="stroke-amber" strokeWidth="2.5" strokeLinejoin="round" />}
      {weights.map((w, i) => (
        <circle key={w.date} cx={x(i)} cy={y(w.kg)} r="4" className="fill-amber">
          <title>{`${w.date}: ${w.kg.toFixed(1)} kg`}</title>
        </circle>
      ))}
      <text x={pad.l} y={H - 6} className="fill-muted" fontSize="11">
        {weights[0].date}
      </text>
      <text x={W - pad.r} y={H - 6} className="fill-muted" fontSize="11" textAnchor="end">
        {weights[weights.length - 1].date}
      </text>
    </svg>
  );
}
