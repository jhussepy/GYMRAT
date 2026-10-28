"use client";

import { useRef, useState } from "react";
import { Download, Moon, Pencil, Scale, Target, Trash2, Upload } from "lucide-react";
import { ACTIVITY_OPTIONS, GOAL_OPTIONS, ageFrom, bmiOf, sleepMinutesOf, type UserProfile } from "@/lib/profile";
import { useProfile, useStore, type WeightEntry } from "@/lib/store";
import { formatDuration } from "@/lib/time";
import { todayISO } from "@/lib/time";
import { Card, ProgressBar, SectionTitle } from "./ui";
import { TrainingCalendar } from "./TrainingCalendar";
import { BodyMetricsTab } from "./BodyMetricsTab";
import { SleepRecoveryCard } from "./SleepRecoveryCard";
import { ProfileWizard } from "./ProfileWizard";

export function ProgressTab() {
  const { state, saveWeight, removeWeight, saveProfile, exportJSON, importJSON, resetAll } = useStore();
  const profile = useProfile();
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState("");
  const [kg, setKg] = useState("");
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const weights = state.weights;
  const start = profile.startWeightKg;
  const goal = profile.goalWeightKg;
  const last = weights.length ? weights[weights.length - 1].kg : start;
  const change = last - start;
  const direction = Math.sign(goal - start);
  const goalProgress = direction === 0 ? 0 : Math.max(0, change * direction);
  const goalTotal = Math.abs(goal - start);
  const milestone = Math.round((start + 0.3 * (goal - start)) * 10) / 10;
  const milestoneProgress = direction === 0 ? 0 : Math.max(0, (last - start) * direction);
  const milestoneTotal = Math.abs(milestone - start);
  const plannedSleep = sleepMinutesOf(profile.wake, profile.bed);
  const bmi = bmiOf(last, profile.heightCm);

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

  if (editing) {
    return (
      <ProfileWizard
        mode="edit"
        initial={profile}
        onCancel={() => setEditing(false)}
        onSave={(p) => {
          saveProfile(p);
          setEditing(false);
          setMsg("Perfil actualizado.");
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <ProfileSummary profile={profile} onEdit={() => setEditing(true)} />

      <Card>
        <SectionTitle title="Tu progreso" hint="Pésate en condiciones similares cada semana. Observa la tendencia, no un solo día." />
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Peso actual" value={`${last.toFixed(1)} kg`} />
          <Stat label="Cambio desde el inicio" value={`${change > 0 ? "+" : change < 0 ? "−" : ""}${Math.abs(change).toFixed(1)} kg`} />
          <Stat label={direction === 0 ? "Distancia a tu peso" : `Distancia a ${goal} kg`} value={`${Math.abs(last - goal).toFixed(1)} kg`} />
        </div>
        <div className="mt-4">
          {direction !== 0 && <ProgressBar value={goalProgress} max={goalTotal} label="Avance hacia tu meta" />}
          <p className="mt-1.5 text-sm text-muted tabular-nums">
            Inicio: {start} kg · {direction === 0 ? "objetivo: mantener tu peso" : `meta: ${goal} kg`}
          </p>
        </div>
      </Card>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <SectionTitle title="Tu punto de partida" hint="Con los datos de tu registro. Añade mediciones de composición corporal más abajo para seguir tu cambio físico." />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber/40 bg-amber/10 px-3 py-1.5 text-xs font-medium text-amber">
            <Scale size={14} aria-hidden /> Línea base
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <BaselineStat label="Peso inicial" value={`${start.toFixed(1)} kg`} detail={`Registrado el ${profile.createdAt}`} />
          <BaselineStat label="Altura" value={`${profile.heightCm} cm`} detail="Dato de tu registro" />
          <BaselineStat label="IMC actual" value={bmi.toFixed(1)} detail="Indicador de cribado, no diagnóstico" />
          <BaselineStat label="Entrenos por semana" value={String(profile.trainingDays.length)} detail={profile.trainingDays.join(", ")} />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {direction !== 0 && (
            <div className="rounded-xl border border-line/70 bg-ink/20 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Target size={17} className="text-flame" aria-hidden /> Primera meta
              </div>
              <p className="mt-2 font-display text-3xl tabular-nums">{milestone.toFixed(1)} kg</p>
              <p className="mt-1 text-sm leading-5 text-muted">Cerca de un tercio del camino hacia tu meta. Celebrar metas pequeñas ayuda a mantener el hábito; después se revisa cómo te sientes y cómo evolucionas.</p>
              <div className="mt-4">
                <ProgressBar value={milestoneProgress} max={milestoneTotal} label="Avance hacia la primera meta" />
              </div>
            </div>
          )}

          <div className="rounded-xl border border-line/70 bg-ink/20 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Moon size={17} className="text-dusk" aria-hidden /> Recuperación
            </div>
            <p className="mt-2 font-display text-2xl">{formatDuration(plannedSleep)} de sueño planificado</p>
            <p className="mt-1 text-sm leading-5 text-muted">
              {plannedSleep < 420
                ? "Tu horario deja menos de 7 horas. Antes de subir la intensidad, acércate poco a poco a 7–9 horas: es cuando más te recuperas."
                : "Tu horario deja un buen margen de sueño. Protégelo: es parte del entrenamiento."}
            </p>
          </div>
        </div>
        <p className="mt-4 text-xs leading-5 text-muted">
          Estas cifras son orientativas y no sustituyen el consejo de un profesional de la salud. Si tienes una condición médica o notas síntomas al hacer ejercicio, consúltalo antes de aumentar la intensidad.
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
            <input type="number" inputMode="decimal" step="0.1" value={kg} onChange={(e) => setKg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="70.0" className="mt-1 block w-28 rounded-sm border border-line bg-ink px-3 py-2 text-chalk tabular-nums" />
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
        <WeightChart weights={weights} startKg={start} goalKg={goal} />
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

function WeightChart({ weights, startKg, goalKg }: { weights: WeightEntry[]; startKg: number; goalKg: number }) {
  if (weights.length === 0) return <p className="text-sm text-muted">Aún no hay pesajes. Registra el primero arriba y aquí verás tu curva.</p>;

  const W = 600;
  const H = 220;
  const pad = { l: 40, r: 12, t: 12, b: 24 };
  const ys = weights.map((w) => w.kg);
  const min = Math.min(goalKg, ...ys) - 1;
  const max = Math.max(startKg, ...ys) + 1;
  const x = (i: number) => pad.l + (weights.length === 1 ? (W - pad.l - pad.r) / 2 : (i / (weights.length - 1)) * (W - pad.l - pad.r));
  const y = (v: number) => pad.t + ((max - v) / (max - min)) * (H - pad.t - pad.b);
  const path = weights.map((w, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(w.kg).toFixed(1)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Gráfico de tu peso en el tiempo">
      <line x1={pad.l} x2={W - pad.r} y1={y(goalKg)} y2={y(goalKg)} className="stroke-flame" strokeDasharray="5 5" />
      <text x={pad.l + 4} y={y(goalKg) - 5} className="fill-flame" fontSize="11">
        Meta {goalKg} kg
      </text>
      <line x1={pad.l} x2={W - pad.r} y1={y(startKg)} y2={y(startKg)} className="stroke-line" strokeDasharray="2 4" />
      <text x={pad.l + 4} y={y(startKg) - 5} className="fill-muted" fontSize="11">
        Inicio {startKg} kg
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

function ProfileSummary({ profile, onEdit }: { profile: UserProfile; onEdit: () => void }) {
  const goal = GOAL_OPTIONS.find((g) => g.id === profile.goal)?.label ?? "";
  const activity = ACTIVITY_OPTIONS.find((a) => a.id === profile.activity)?.label ?? "";
  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <SectionTitle title={profile.name ? `Perfil de ${profile.name}` : "Tu perfil"} hint={`${goal} · ${ageFrom(profile.birthYear)} años · ${profile.heightCm} cm · actividad ${activity.toLowerCase()}`} />
        <button onClick={onEdit} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line px-4 text-sm transition-colors duration-200 hover:border-flame/50 hover:bg-raised">
          <Pencil size={15} aria-hidden /> Editar perfil
        </button>
      </div>
      <dl className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-line/70 p-3">
          <dt className="text-xs text-muted">Calorías</dt>
          <dd className="mt-1 font-display text-xl tabular-nums">{profile.kcalTarget.toLocaleString("es")}</dd>
        </div>
        <div className="rounded-xl border border-line/70 p-3">
          <dt className="text-xs text-muted">Proteína</dt>
          <dd className="mt-1 font-display text-xl tabular-nums">{profile.proteinTargetG} g</dd>
        </div>
        <div className="rounded-xl border border-line/70 p-3">
          <dt className="text-xs text-muted">Agua</dt>
          <dd className="mt-1 font-display text-xl tabular-nums">{(profile.waterGoalMl / 1000).toFixed(1)} L</dd>
        </div>
      </dl>
    </Card>
  );
}
