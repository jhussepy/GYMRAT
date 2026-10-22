"use client";

import { useRef, useState } from "react";
import { Download, Trash2, Upload } from "lucide-react";
import { PROFILE } from "@/lib/config";
import { useStore, type WeightEntry } from "@/lib/store";
import { todayISO } from "@/lib/time";
import { Card, ProgressBar, SectionTitle } from "./ui";

export function ProgressTab() {
  const { state, saveWeight, removeWeight, exportJSON, importJSON, resetAll } = useStore();
  const [date, setDate] = useState("");
  const [kg, setKg] = useState("");
  const [msg, setMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const weights = state.weights;
  const last = weights.length ? weights[weights.length - 1].kg : PROFILE.startWeightKg;
  const lost = PROFILE.startWeightKg - last;
  const total = PROFILE.startWeightKg - PROFILE.goalWeightKg;

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
        <SectionTitle title="Tu progreso" hint="Pésate cada sábado en ayunas, después de ir al baño." />
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Peso actual" value={`${last.toFixed(1)} kg`} />
          <Stat label="Has bajado" value={`${lost.toFixed(1)} kg`} />
          <Stat label={`Faltan para ${PROFILE.goalWeightKg} kg`} value={`${Math.max(0, last - PROFILE.goalWeightKg).toFixed(1)} kg`} />
        </div>
        <div className="mt-4">
          <ProgressBar value={Math.max(0, lost)} max={total} label="Avance hacia tu meta de peso" />
          <p className="mt-1.5 text-sm text-muted tabular-nums">
            Saliste de {PROFILE.startWeightKg} kg · meta {PROFILE.goalWeightKg} kg
          </p>
        </div>
      </Card>

      <Card>
        <SectionTitle title="Registrar pesaje" />
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm text-muted">
            Fecha
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={todayISO()} className="mt-1 block h-11 rounded-sm border border-line bg-ink px-3 text-chalk" />
          </label>
          <label className="text-sm text-muted">
            Peso (kg)
            <input type="number" inputMode="decimal" step="0.1" value={kg} onChange={(e) => setKg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="98.4" className="mt-1 block w-28 rounded-sm border border-line bg-ink px-3 py-2 text-chalk tabular-nums" />
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
              if (window.confirm("Se borrarán agua, series, pesos y compras de este dispositivo. ¿Continuar?")) {
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
