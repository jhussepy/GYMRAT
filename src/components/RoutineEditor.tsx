"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, RotateCcw, Save, Trash2, X } from "lucide-react";
import { MAX_EXERCISES_PER_DAY, MAX_NAME, MAX_SETS, exerciseFor, newExerciseId, sanitizeExercise, type RoutineDay, type RoutineExercise } from "@/lib/routines";
import type { Weekday } from "@/lib/config";
import { Card } from "./ui";

interface Props {
  base: Weekday;
  /** Rutina actual (la personalizada o la plantilla). */
  current: RoutineDay;
  /** Si hay una rutina personalizada guardada. */
  customized: boolean;
  onSave: (routine: RoutineDay) => void;
  onRestore: () => void;
  onClose: () => void;
}

const field = "field-input";

export function RoutineEditor({ base, current, customized, onSave, onRestore, onClose }: Props) {
  const [focus, setFocus] = useState(current.focus);
  const [items, setItems] = useState<RoutineExercise[]>(current.exercises);
  const [error, setError] = useState("");

  const update = (index: number, patch: Partial<RoutineExercise>) => setItems((list) => list.map((e, i) => (i === index ? { ...e, ...patch } : e)));
  const move = (index: number, delta: number) =>
    setItems((list) => {
      const to = index + delta;
      if (to < 0 || to >= list.length) return list;
      const next = [...list];
      [next[index], next[to]] = [next[to], next[index]];
      return next;
    });
  const remove = (index: number) => setItems((list) => list.filter((_, i) => i !== index));
  const add = () => {
    if (items.length >= MAX_EXERCISES_PER_DAY) return setError(`Puedes tener hasta ${MAX_EXERCISES_PER_DAY} ejercicios por día.`);
    setItems((list) => [...list, { id: newExerciseId(base, list.map((e) => e.id)), name: "", type: "strength", sets: 3, reps: "10", alt: "" }]);
    setError("");
  };

  const save = () => {
    const clean: RoutineExercise[] = [];
    for (const [i, raw] of items.entries()) {
      const x = sanitizeExercise(raw);
      if (!x) return setError(`El ejercicio ${i + 1} necesita nombre y repeticiones (o minutos).`);
      clean.push(x);
    }
    if (!focus.trim()) return setError("Ponle un nombre a la rutina del día (por ejemplo, Empuje).");
    if (clean.length === 0) return setError("La rutina necesita al menos un ejercicio.");
    onSave({ day: base, focus: focus.trim().slice(0, MAX_NAME), exercises: clean });
  };

  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-xl">Editar rutina · {base}</h3>
          <p className="mt-1 text-sm text-muted">Cambia los ejercicios, las series y las repeticiones. Tu historial de series se conserva aunque edites la rutina.</p>
          <p className="mt-2 rounded-xl bg-raised p-3 text-sm text-chalk">Esta rutina se usa en cada día que le toca «{current.focus}»: si tu semana tiene más de un día con esta rutina, el cambio aplica a todos ellos.</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Cerrar editor" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line text-muted hover:text-chalk">
          <X size={18} aria-hidden />
        </button>
      </div>

      <label className="mt-5 block text-sm font-medium">
        Nombre de la rutina
        <input className={`${field} sm:max-w-xs`} value={focus} maxLength={MAX_NAME} onChange={(e) => setFocus(e.target.value)} placeholder="Empuje" />
      </label>

      <ol className="mt-5 space-y-3">
        {items.map((e, i) => {
          const isCardio = e.type === "cardio";
          return (
            <li key={e.id} className="rounded-xl border border-line/70 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted">Ejercicio {i + 1}</span>
                <div className="flex gap-1">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Subir ejercicio ${i + 1}`} className="flex h-11 w-11 items-center justify-center rounded-xl border border-line text-muted disabled:opacity-30 hover:text-chalk">
                    <ArrowUp size={16} aria-hidden />
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label={`Bajar ejercicio ${i + 1}`} className="flex h-11 w-11 items-center justify-center rounded-xl border border-line text-muted disabled:opacity-30 hover:text-chalk">
                    <ArrowDown size={16} aria-hidden />
                  </button>
                  <button type="button" onClick={() => remove(i)} aria-label={`Quitar ejercicio ${i + 1}`} className="flex h-11 w-11 items-center justify-center rounded-xl border border-rose/40 text-rose hover:bg-rose/10">
                    <Trash2 size={16} aria-hidden />
                  </button>
                </div>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-medium">
                  Nombre
                  <input className={field} value={e.name} maxLength={MAX_NAME} onChange={(ev) => update(i, { name: ev.target.value })} placeholder="Press de pecho" />
                </label>
                <label className="block text-sm font-medium">
                  Tipo
                  <select className={field} value={e.type} onChange={(ev) => update(i, { type: ev.target.value as "strength" | "cardio", sets: ev.target.value === "cardio" ? 1 : e.sets })}>
                    <option value="strength">Fuerza</option>
                    <option value="cardio">Cardio</option>
                  </select>
                </label>
                {!isCardio && (
                  <label className="block text-sm font-medium">
                    Series
                    <input type="number" inputMode="numeric" min={1} max={MAX_SETS} className={field} value={e.sets} onChange={(ev) => update(i, { sets: Math.min(MAX_SETS, Math.max(1, Number(ev.target.value) || 1)) })} />
                  </label>
                )}
                <label className="block text-sm font-medium">
                  {isCardio ? "Duración" : "Repeticiones"}
                  <input className={field} value={e.reps} maxLength={20} onChange={(ev) => update(i, { reps: ev.target.value })} placeholder={isCardio ? "30 min" : "10-12"} />
                </label>
                <label className="block text-sm font-medium sm:col-span-2">
                  Alternativa si la máquina está ocupada
                  <input className={field} value={e.alt} maxLength={120} onChange={(ev) => update(i, { alt: ev.target.value })} placeholder="Press con mancuernas" />
                </label>
              </div>

              <details className="mt-3 rounded-xl bg-raised/50 p-3" open={Boolean(e.home)}>
                <summary className="min-h-11 cursor-pointer py-2 text-sm font-medium">Versión en casa (sin equipo)</summary>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <label className="block text-sm font-medium">
                    Ejercicio en casa
                    <input className={field} value={e.home?.name ?? ""} maxLength={MAX_NAME} onChange={(ev) => update(i, { home: ev.target.value || e.home?.reps ? { name: ev.target.value, reps: e.home?.reps ?? "" } : undefined })} placeholder="Flexiones" />
                  </label>
                  <label className="block text-sm font-medium">
                    Repeticiones en casa
                    <input className={field} value={e.home?.reps ?? ""} maxLength={20} onChange={(ev) => update(i, { home: e.home?.name || ev.target.value ? { name: e.home?.name ?? "", reps: ev.target.value } : undefined })} placeholder="12-15" />
                  </label>
                </div>
                <p className="mt-2 text-xs text-muted">Se muestra cuando activas el modo en casa. Déjalo vacío si no tiene versión en casa.</p>
              </details>
            </li>
          );
        })}
      </ol>

      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-rose/40 bg-rose/10 p-3 text-sm text-rose">
          {error}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" onClick={add} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line px-4 text-sm transition-colors duration-200 hover:bg-raised">
          <Plus size={16} aria-hidden /> Añadir ejercicio
        </button>
        <button type="button" onClick={save} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-flame px-5 text-sm font-semibold text-ink transition-[filter] duration-200 hover:brightness-110">
          <Save size={16} aria-hidden /> Guardar rutina
        </button>
        {customized && (
          <button type="button" onClick={onRestore} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm text-muted transition-colors duration-200 hover:text-chalk">
            <RotateCcw size={16} aria-hidden /> Restaurar la rutina original
          </button>
        )}
      </div>
    </Card>
  );
}

export { exerciseFor };
