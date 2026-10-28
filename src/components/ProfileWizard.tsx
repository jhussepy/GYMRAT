"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Check, Dumbbell } from "lucide-react";
import { WEEKDAYS, type Weekday } from "@/lib/config";
import {
  ACTIVITY_OPTIONS,
  GOAL_OPTIONS,
  TRAIN_DURATIONS,
  ageFrom,
  computeTargets,
  defaultCaffeineCutoff,
  parseNum,
  sanitizeProfile,
  validateBody,
  validateDay,
  validateGoal,
  validateTargets,
  type ActivityLevel,
  type Goal,
  type Sex,
  type Targets,
  type UserProfile,
} from "@/lib/profile";
import { todayISO } from "@/lib/time";

interface Draft {
  name: string;
  sex: Sex | "";
  birthYear: string;
  heightCm: string;
  weightKg: string;
  goal: Goal;
  goalWeightKg: string;
  activity: ActivityLevel;
  trainingDays: Weekday[];
  wake: string;
  bed: string;
  hasWork: boolean;
  workStart: string;
  workEnd: string;
  trainStart: string;
  trainMinutes: number;
  caffeineCutoff: string;
  trading: boolean;
}

interface Overrides {
  kcal?: string;
  protein?: string;
  water?: string;
}

const STEPS = ["Sobre ti", "Tu objetivo", "Tu día", "Tus metas"] as const;
const round1 = (n: number) => Math.round(n * 10) / 10;

function initialDraft(p?: UserProfile): Draft {
  if (p) {
    return {
      name: p.name,
      sex: p.sex,
      birthYear: String(p.birthYear),
      heightCm: String(p.heightCm),
      weightKg: String(p.startWeightKg),
      goal: p.goal,
      goalWeightKg: String(p.goalWeightKg),
      activity: p.activity,
      trainingDays: p.trainingDays,
      wake: p.wake,
      bed: p.bed,
      hasWork: p.workStart !== null,
      workStart: p.workStart ?? "09:00",
      workEnd: p.workEnd ?? "17:00",
      trainStart: p.trainStart,
      trainMinutes: p.trainMinutes,
      caffeineCutoff: p.caffeineCutoff,
      trading: p.modules.trading,
    };
  }
  return {
    name: "",
    sex: "",
    birthYear: "",
    heightCm: "",
    weightKg: "",
    goal: "perder",
    goalWeightKg: "",
    activity: "ligero",
    trainingDays: ["Lunes", "Miércoles", "Viernes"],
    wake: "06:30",
    bed: "22:30",
    hasWork: true,
    workStart: "09:00",
    workEnd: "17:00",
    trainStart: "18:30",
    trainMinutes: 60,
    caffeineCutoff: defaultCaffeineCutoff("06:30", "22:30"),
    trading: false,
  };
}

interface Props {
  mode: "new" | "edit";
  initial?: UserProfile;
  onSave: (profile: UserProfile) => void;
  onCancel?: () => void;
}

export function ProfileWizard({ mode, initial, onSave, onCancel }: Props) {
  const [d, setD] = useState<Draft>(() => initialDraft(initial));
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [cutoffTouched, setCutoffTouched] = useState(mode === "edit");
  const [over, setOver] = useState<Overrides>(() => (initial ? { kcal: String(initial.kcalTarget), protein: String(initial.proteinTargetG), water: String(initial.waterGoalMl) } : {}));

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setD((prev) => ({ ...prev, [key]: value }));

  const setTimeField = (key: "wake" | "bed", value: string) => {
    setD((prev) => {
      const next = { ...prev, [key]: value };
      if (!cutoffTouched && next.wake && next.bed) next.caffeineCutoff = defaultCaffeineCutoff(next.wake, next.bed);
      return next;
    });
  };

  const goalWeight = d.goal === "mantener" ? d.weightKg : d.goalWeightKg;

  const errorsFor = (s: number): string[] => {
    if (s === 0) return validateBody(d);
    if (s === 1) return validateGoal({ goal: d.goal, weightKg: d.weightKg, heightCm: d.heightCm, goalWeightKg: goalWeight, trainingDays: d.trainingDays });
    if (s === 2) return validateDay(d);
    return validateTargets({ kcalTarget: parseNum(over.kcal ?? String(suggestion?.kcalTarget ?? "")), proteinTargetG: parseNum(over.protein ?? String(suggestion?.proteinTargetG ?? "")), waterGoalMl: parseNum(over.water ?? String(suggestion?.waterGoalMl ?? "")) });
  };

  /** Metas sugeridas: solo si los datos de los pasos 1 y 2 son válidos. */
  const suggestion: Targets | null = useMemo(() => {
    if (validateBody(d).length || validateGoal({ goal: d.goal, weightKg: d.weightKg, heightCm: d.heightCm, goalWeightKg: goalWeight, trainingDays: d.trainingDays }).length) return null;
    return computeTargets({
      sex: d.sex as Sex,
      age: ageFrom(parseNum(d.birthYear)),
      heightCm: parseNum(d.heightCm),
      weightKg: parseNum(d.weightKg),
      goalWeightKg: parseNum(goalWeight),
      goal: d.goal,
      activity: d.activity,
      trainingDaysCount: d.trainingDays.length,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d.sex, d.birthYear, d.heightCm, d.weightKg, d.goal, d.goalWeightKg, d.activity, d.trainingDays]);

  const kcal = over.kcal ?? (suggestion ? String(suggestion.kcalTarget) : "");
  const protein = over.protein ?? (suggestion ? String(suggestion.proteinTargetG) : "");
  const water = over.water ?? (suggestion ? String(suggestion.waterGoalMl) : "");
  const overridden = over.kcal !== undefined || over.protein !== undefined || over.water !== undefined;

  const next = () => {
    const found = errorsFor(step);
    setErrors(found);
    if (!found.length) setStep((s) => s + 1);
  };

  const finish = () => {
    for (let s = 0; s < STEPS.length; s++) {
      const found = errorsFor(s);
      if (found.length) {
        setErrors(found);
        setStep(s);
        return;
      }
    }
    const start = round1(parseNum(d.weightKg));
    const profile: UserProfile = {
      name: d.name.trim().slice(0, 40),
      sex: d.sex as Sex,
      birthYear: Number(d.birthYear),
      heightCm: round1(parseNum(d.heightCm)),
      startWeightKg: start,
      goalWeightKg: d.goal === "mantener" ? start : round1(parseNum(d.goalWeightKg)),
      goal: d.goal,
      activity: d.activity,
      trainingDays: WEEKDAYS.filter((day) => d.trainingDays.includes(day)),
      wake: d.wake,
      bed: d.bed,
      workStart: d.hasWork ? d.workStart : null,
      workEnd: d.hasWork ? d.workEnd : null,
      trainStart: d.trainStart,
      trainMinutes: d.trainMinutes,
      caffeineCutoff: d.caffeineCutoff,
      kcalTarget: Math.round(parseNum(kcal)),
      proteinTargetG: Math.round(parseNum(protein)),
      waterGoalMl: Math.round(parseNum(water)),
      modules: { trading: d.trading },
      createdAt: initial?.createdAt ?? todayISO(),
    };
    // Última barrera: el mismo validador que protege los datos guardados.
    if (!sanitizeProfile(profile)) {
      setErrors(["Revisa los datos: alguno no es válido."]);
      return;
    }
    onSave(profile);
  };

  const toggleDay = (day: Weekday) => set("trainingDays", d.trainingDays.includes(day) ? d.trainingDays.filter((x) => x !== day) : [...d.trainingDays, day]);
  const age = /^\d{4}$/.test(d.birthYear) ? ageFrom(Number(d.birthYear)) : null;
  const last = step === STEPS.length - 1;

  const body = (
    <div className="w-full">
      {mode === "new" && (
        <header className="mb-6 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-flame text-ink" aria-hidden>
            <Dumbbell size={21} strokeWidth={2.5} />
          </span>
          <div>
            <h1 className="text-xl leading-none tracking-[0.18em]">GYMRAT</h1>
            <p className="mt-1 text-xs text-muted">Bienvenido. Cuéntanos de ti para personalizar tu plan.</p>
          </div>
        </header>
      )}
      {mode === "edit" && <h2 className="mb-4 text-2xl">Editar mi perfil</h2>}

      <ol className="mb-5 grid grid-cols-4 gap-2" aria-label="Pasos del registro">
        {STEPS.map((label, i) => (
          <li key={label} aria-current={i === step ? "step" : undefined}>
            <span className={`block h-1.5 rounded-full ${i <= step ? "bg-flame" : "bg-line"}`} />
            <span className={`mt-1.5 block text-[11px] sm:text-xs ${i === step ? "font-semibold text-chalk" : "text-muted"}`}>
              {i + 1}. {label}
            </span>
          </li>
        ))}
      </ol>

      <section className="rounded-2xl border border-line/70 bg-panel p-5 sm:p-6" aria-labelledby="wizard-title">
        {step === 0 && (
          <div className="space-y-5">
            <Heading id="wizard-title" title="Sobre ti" hint="Estos datos se guardan en tu cuenta y se usan solo para estimar tus metas." />
            <Field label="¿Cómo te llamas? (opcional)">
              <input className="field-input" value={d.name} maxLength={40} autoComplete="given-name" onChange={(e) => set("name", e.target.value)} placeholder="Tu nombre" />
            </Field>
            <Choice legend="Sexo (para estimar tus calorías)" value={d.sex} onChange={(v) => set("sex", v as Sex)} options={[{ id: "hombre", label: "Hombre" }, { id: "mujer", label: "Mujer" }]} />
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Año de nacimiento" hint={age !== null && age >= 0 && age < 120 ? `${age} años` : undefined}>
                <input className="field-input" type="number" inputMode="numeric" value={d.birthYear} onChange={(e) => set("birthYear", e.target.value)} placeholder="1995" />
              </Field>
              <Field label="Altura (cm)">
                <input className="field-input" type="number" inputMode="decimal" value={d.heightCm} onChange={(e) => set("heightCm", e.target.value)} placeholder="170" />
              </Field>
              <Field label={mode === "edit" ? "Peso al empezar (kg)" : "Peso actual (kg)"}>
                <input className="field-input" type="number" inputMode="decimal" step="0.1" value={d.weightKg} onChange={(e) => set("weightKg", e.target.value)} placeholder="70.0" />
              </Field>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <Heading id="wizard-title" title="Tu objetivo" hint="Con esto calculamos tus calorías, tu proteína y la estructura de tu semana." />
            <Choice legend="¿Qué quieres lograr?" value={d.goal} onChange={(v) => set("goal", v as Goal)} options={GOAL_OPTIONS.map((g) => ({ id: g.id, label: g.label, hint: g.hint }))} />
            {d.goal !== "mantener" && (
              <Field label="Peso meta (kg)">
                <input className="field-input sm:max-w-[200px]" type="number" inputMode="decimal" step="0.1" value={d.goalWeightKg} onChange={(e) => set("goalWeightKg", e.target.value)} placeholder={d.goal === "perder" ? "65.0" : "75.0"} />
              </Field>
            )}
            <Choice legend="Actividad diaria, sin contar el gimnasio" value={d.activity} onChange={(v) => set("activity", v as ActivityLevel)} options={ACTIVITY_OPTIONS.map((a) => ({ id: a.id, label: a.label, hint: a.hint }))} />
            <fieldset>
              <legend className="text-sm font-medium">Días en que entrenas (mínimo 2)</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {WEEKDAYS.map((day) => {
                  const on = d.trainingDays.includes(day);
                  return (
                    <button key={day} type="button" aria-pressed={on} onClick={() => toggleDay(day)} className={`min-h-11 rounded-xl border px-4 text-sm transition-colors duration-200 ${on ? "border-flame bg-flame text-ink" : "border-line text-muted hover:border-flame/50 hover:text-chalk"}`}>
                      {day}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-muted">Armamos tu rutina según cuántos días elijas. El domingo es de descanso.</p>
            </fieldset>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <Heading id="wizard-title" title="Tu día" hint="Con tus horarios armamos el reloj de tu día y la hora límite de cafeína." />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Hora de despertar">
                <input className="field-input" type="time" value={d.wake} onChange={(e) => setTimeField("wake", e.target.value)} />
              </Field>
              <Field label="Hora de dormir">
                <input className="field-input" type="time" value={d.bed} onChange={(e) => setTimeField("bed", e.target.value)} />
              </Field>
            </div>

            <fieldset>
              <legend className="text-sm font-medium">Trabajo o estudio</legend>
              <label className="mt-2 flex min-h-11 items-center gap-3 text-sm">
                <input type="checkbox" checked={d.hasWork} onChange={(e) => set("hasWork", e.target.checked)} className="h-5 w-5 accent-flame" />
                Tengo un horario fijo
              </label>
              {d.hasWork && (
                <div className="mt-2 grid gap-4 sm:grid-cols-2">
                  <Field label="Empieza">
                    <input className="field-input" type="time" value={d.workStart} onChange={(e) => set("workStart", e.target.value)} />
                  </Field>
                  <Field label="Termina">
                    <input className="field-input" type="time" value={d.workEnd} onChange={(e) => set("workEnd", e.target.value)} />
                  </Field>
                </div>
              )}
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Hora de entrenar">
                <input className="field-input" type="time" value={d.trainStart} onChange={(e) => set("trainStart", e.target.value)} />
              </Field>
              <Field label="Duración del entrenamiento">
                <select className="field-input" value={d.trainMinutes} onChange={(e) => set("trainMinutes", Number(e.target.value))}>
                  {TRAIN_DURATIONS.map((m) => (
                    <option key={m} value={m}>
                      {m} minutos
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Última cafeína del día" hint="Sugerida: 8 horas antes de dormir. Puedes cambiarla.">
              <input
                className="field-input sm:max-w-[200px]"
                type="time"
                value={d.caffeineCutoff}
                onChange={(e) => {
                  setCutoffTouched(true);
                  set("caffeineCutoff", e.target.value);
                }}
              />
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <Heading id="wizard-title" title="Tus metas diarias" hint="Calculadas con tus datos. Son estimaciones: ajústalas según cómo evolucione tu cuerpo." />
            {suggestion && (
              <p className="rounded-xl bg-raised p-3 text-sm leading-6 text-muted">
                Estimamos que gastas unas <strong className="text-chalk">{suggestion.tdee.toLocaleString("es")} kcal</strong> al día
                {d.goal === "perder" ? ", y para perder grasa de forma sostenible sugerimos un déficit moderado" : d.goal === "ganar" ? ", y para ganar músculo sugerimos un ligero superávit" : " y sugerimos mantener ese nivel"}.
                {suggestion.floorApplied && " Aplicamos un mínimo de calorías por seguridad."}
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Calorías al día">
                <input className="field-input" type="number" inputMode="numeric" value={kcal} onChange={(e) => setOver((o) => ({ ...o, kcal: e.target.value }))} />
              </Field>
              <Field label="Proteína (g)">
                <input className="field-input" type="number" inputMode="numeric" value={protein} onChange={(e) => setOver((o) => ({ ...o, protein: e.target.value }))} />
              </Field>
              <Field label="Agua (ml)">
                <input className="field-input" type="number" inputMode="numeric" step="250" value={water} onChange={(e) => setOver((o) => ({ ...o, water: e.target.value }))} />
              </Field>
            </div>
            {overridden && suggestion && (
              <button type="button" onClick={() => setOver({})} className="min-h-11 rounded-xl border border-line px-4 text-sm text-muted transition-colors duration-200 hover:text-chalk">
                Volver a las metas sugeridas
              </button>
            )}

            <label className="flex min-h-11 items-start gap-3 rounded-xl border border-line/70 p-3 text-sm">
              <input type="checkbox" checked={d.trading} onChange={(e) => set("trading", e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-flame" />
              <span>
                <span className="block font-medium">Activar el módulo de estudio de trading (opcional)</span>
                <span className="block text-xs text-muted">Añade una pestaña para organizar tu estudio. Puedes cambiarlo después.</span>
              </span>
            </label>

            <p className="text-xs leading-5 text-muted">
              GYMRAT ofrece estimaciones orientativas y no sustituye el consejo de un profesional de la salud. Si tienes una condición médica, estás embarazada o tomas medicación, consúltalo antes de cambiar tu alimentación o tu entrenamiento.
            </p>
          </div>
        )}

        {errors.length > 0 && (
          <div role="alert" className="mt-5 rounded-xl border border-rose/40 bg-rose/10 p-3 text-sm text-rose">
            <ul className="list-disc space-y-1 pl-5">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            {step > 0 && (
              <button type="button" onClick={() => { setErrors([]); setStep((s) => s - 1); }} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-line px-5 text-sm transition-colors duration-200 hover:bg-raised">
                <ArrowLeft size={16} aria-hidden /> Atrás
              </button>
            )}
            {mode === "edit" && onCancel && (
              <button type="button" onClick={onCancel} className="min-h-12 rounded-xl px-4 text-sm text-muted transition-colors duration-200 hover:text-chalk">
                Cancelar
              </button>
            )}
          </div>
          {last ? (
            <button type="button" onClick={finish} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-flame px-7 font-display text-base uppercase tracking-[0.12em] text-ink transition-[filter] duration-200 hover:brightness-110">
              <Check size={18} aria-hidden /> {mode === "new" ? "Empezar" : "Guardar cambios"}
            </button>
          ) : (
            <button type="button" onClick={next} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-flame px-7 font-display text-base uppercase tracking-[0.12em] text-ink transition-[filter] duration-200 hover:brightness-110">
              Continuar <ArrowRight size={18} aria-hidden />
            </button>
          )}
        </div>
      </section>
    </div>
  );

  return mode === "new" ? <main className="mx-auto flex min-h-screen max-w-2xl items-center px-4 py-8 sm:px-6">{body}</main> : body;
}

function Heading({ id, title, hint }: { id: string; title: string; hint: string }) {
  return (
    <div>
      <h2 id={id} className="text-2xl">
        {title}
      </h2>
      <span className="mt-2 block h-0.5 w-10 bg-flame" aria-hidden />
      <p className="mt-3 text-sm text-muted">{hint}</p>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      {children}
      {hint && <span className="mt-1 block text-xs font-normal text-muted">{hint}</span>}
    </label>
  );
}

function Choice({ legend, value, onChange, options }: { legend: string; value: string; onChange: (v: string) => void; options: { id: string; label: string; hint?: string }[] }) {
  return (
    <div role="radiogroup" aria-label={legend}>
      <p className="text-sm font-medium">{legend}</p>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {options.map((o) => {
          const on = value === o.id;
          return (
            <button key={o.id} type="button" role="radio" aria-checked={on} onClick={() => onChange(o.id)} className={`min-h-12 rounded-xl border px-4 py-2.5 text-left text-sm transition-colors duration-200 ${on ? "border-flame bg-flame/10" : "border-line hover:border-flame/50"}`}>
              <span className="block font-medium">{o.label}</span>
              {o.hint && <span className="block text-xs text-muted">{o.hint}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
