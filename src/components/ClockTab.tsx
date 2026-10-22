"use client";

import { ChevronRight, Droplets, Minus, Plus } from "lucide-react";
import { PROFILE, weekdayFromDate } from "@/lib/config";
import { CATEGORY_COLOR, QUICK_TIPS, SCHEDULE, WORKOUTS, WORKOUT_FOCUS } from "@/lib/data";
import { isTaperDay, mealsForDay, totals } from "@/lib/nutrition";
import { bioDayFraction, blockMinutes, caffeineAllowed, findBlock, formatDuration, isInBlock, minutesOf, pad2, todayISO } from "@/lib/time";
import { useStore } from "@/lib/store";
import { Card, ProgressBar, SectionTitle } from "./ui";
import { DayDial } from "./DayDial";
import { useNow } from "./useNow";

const sleepMinutes = SCHEDULE.filter((b) => b.category === "Sueño").reduce((sum, b) => sum + blockMinutes(b), 0);
const gymMinutes = SCHEDULE.filter((b) => b.category === "Gym").reduce((sum, b) => sum + blockMinutes(b), 0);

export function ClockTab({ onNavigate }: { onNavigate: (tab: "rutina" | "menu") => void }) {
  const now = useNow();
  const { state, addWater } = useStore();
  const minute = now ? minutesOf(now) : null;
  const current = minute !== null ? findBlock(SCHEDULE, minute) : undefined;
  const allowed = minute !== null ? caffeineAllowed(minute) : null;
  const date = now ? todayISO(now) : "";
  const water = date ? (state.water[date] ?? 0) : 0;
  const left = current && minute !== null ? remainingInBlock(current.end, minute) : null;

  const plan = now ? weekdayFromDate(now) : null;
  const weekdayName = now ? now.toLocaleDateString("es", { weekday: "long" }) : "";
  const dayTotals = plan && isTaperDay(plan) ? totals(mealsForDay(plan)) : null;

  return (
    <div className="space-y-6 lg:space-y-7">
      <section className="hero-bg grain relative isolate flex min-h-[330px] flex-col items-center justify-center overflow-hidden rounded-3xl border border-line/70 px-5 py-12 text-center shadow-xl sm:min-h-[390px] sm:px-10">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-flame/80 to-transparent" aria-hidden />
        <p className="mb-2 flex items-center gap-2 rounded-full border border-line/80 bg-ink/25 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-flame shadow-[0_0_10px_rgb(247_106_80_/_0.9)]" aria-hidden />
          Tu sistema de entrenamiento
        </p>
        <p className="mt-3 text-sm capitalize tracking-[0.24em] text-muted">{weekdayName || "\u00A0"}</p>
        <h2 className="mt-3 max-w-full break-words pl-[0.08em] text-5xl tracking-[0.12em] sm:text-7xl lg:text-8xl">{now ? (plan ? WORKOUT_FOCUS[plan] : "Preparación") : "GYMRAT"}</h2>
        <p className="mt-4 pl-[0.2em] text-xs font-medium tracking-[0.18em] text-chalk/85 sm:text-sm sm:tracking-[0.28em]">{plan ? "SMART FIT · 19:00 A 21:00" : "PLANIFICACIÓN · NUTRICIÓN Y RECUPERACIÓN"}</p>
        <button
          onClick={() => onNavigate(plan ? "rutina" : "menu")}
          className="mt-8 inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-flame px-7 font-display text-sm uppercase tracking-[0.14em] text-ink shadow-lg shadow-black/10 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 sm:px-8 sm:text-base"
        >
          {plan ? "Ver rutina de hoy" : "Ver compras"}
          <ChevronRight size={18} aria-hidden />
        </button>
        <div className="pointer-events-none absolute -bottom-20 -right-12 h-52 w-52 rounded-full border border-flame/10 sm:h-72 sm:w-72" aria-hidden />
        <div className="pointer-events-none absolute -bottom-14 -right-6 h-36 w-36 rounded-full border border-flame/15 sm:h-52 sm:w-52" aria-hidden />
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <SplitPanel className="panel-a" title="Rutina" detail={plan ? `${WORKOUTS[plan].length} ${plan === "Sábado" ? "bloques" : "ejercicios"} · ${WORKOUT_FOCUS[plan]}` : "Hoy descansas del gimnasio"} onClick={() => onNavigate("rutina")} />
        <SplitPanel className="panel-b" title="Menú" detail={dayTotals ? `${dayTotals.kcal} kcal · ${dayTotals.protein} g de proteína` : "Tápers de lunes a viernes"} onClick={() => onNavigate("menu")} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,380px)_1fr] lg:gap-6">
        <Card className="flex flex-col items-center justify-center">
          <DayDial
            fraction={now ? bioDayFraction(now) : null}
            activeStart={current?.start}
            title={now ? `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}` : "--:--:--"}
            subtitle={`Tu día empieza a las ${PROFILE.wake}`}
          />
          <ul className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-muted">
            {(Object.keys(CATEGORY_COLOR) as (keyof typeof CATEGORY_COLOR)[]).map((cat) => (
              <li key={cat} className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLOR[cat] }} />
                {cat}
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-5 lg:space-y-6">
          <Card>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Ahora mismo</p>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl">{current ? current.activity : "Cargando tu horario…"}</h2>
            <p className="mt-2 max-w-prose text-sm leading-6 text-muted">{current?.description ?? "\u00A0"}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs sm:text-sm">
              {current && (
                <span className="rounded-full border px-3 py-1.5 font-medium" style={{ borderColor: CATEGORY_COLOR[current.category], color: CATEGORY_COLOR[current.category] }}>
                  {current.start} a {current.end}
                </span>
              )}
              {left !== null && <span className="rounded-full border border-line px-3 py-1.5 text-muted">Quedan {formatDuration(left)}</span>}
              {allowed !== null && (
                <span className={`rounded-full border px-3 py-1.5 ${allowed ? "border-flame/50 text-flame" : "border-rose/50 text-rose"}`}>
                  {allowed ? `Cafeína permitida hasta las ${PROFILE.caffeineCutoff}` : `Cafeína cortada desde las ${PROFILE.caffeineCutoff}`}
                </span>
              )}
            </div>
          </Card>

          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 font-display text-xl sm:text-2xl">
                <Droplets size={20} className="text-sky" aria-hidden /> Agua de hoy
              </h2>
              <span className="tabular-nums text-sm text-muted">{water.toLocaleString("es")} <span className="text-muted/70">/</span> {PROFILE.waterGoalMl.toLocaleString("es")} ml</span>
            </div>
            <div className="mt-4">
              <ProgressBar value={water} max={PROFILE.waterGoalMl} barClass="bg-sky" label="Agua bebida hoy" />
            </div>
            <div className="mt-4 grid grid-cols-[auto_1fr_1fr] gap-2">
              <button onClick={() => date && addWater(date, -250)} disabled={!date || water <= 0} aria-label="Quitar 250 ml" className="flex h-11 w-12 items-center justify-center rounded-xl border border-line text-muted transition-colors duration-200 hover:border-flame/50 hover:text-chalk disabled:opacity-40">
                <Minus size={16} />
              </button>
              <button onClick={() => date && addWater(date, 250)} disabled={!date} className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-line text-sm transition-colors duration-200 hover:bg-raised">
                <Plus size={15} /> 250 ml
              </button>
              <button onClick={() => date && addWater(date, 500)} disabled={!date} className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-sky/15 text-sm font-medium text-sky transition-colors duration-200 hover:bg-sky/25">
                <Plus size={15} /> 500 ml
              </button>
            </div>
          </Card>
        </div>
      </div>

      <Card>
        <SectionTitle title="Tu día, hora por hora" hint={`Sueño total: ${formatDuration(sleepMinutes)} (noche y siesta). Gimnasio: ${formatDuration(gymMinutes)}.`} />
        <ol className="space-y-2.5">
          {SCHEDULE.map((item) => {
            const active = minute !== null && isInBlock(item, minute);
            return (
              <li key={item.start} className={`flex flex-col gap-2 rounded-xl border p-3.5 transition-colors sm:flex-row sm:items-center sm:justify-between sm:gap-4 ${active ? "border-amber/70 bg-raised shadow-sm" : "border-line/70 bg-ink/15"}`} aria-current={active ? "time" : undefined}>
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-8 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: CATEGORY_COLOR[item.category] }} aria-hidden />
                  <div>
                    <p className="font-medium">
                      <span className="mr-2 whitespace-nowrap text-sm tabular-nums text-muted">{item.start}–{item.end}</span>
                      {item.activity}
                    </p>
                    <p className="mt-1 text-sm leading-5 text-muted">{item.description}</p>
                  </div>
                </div>
                <span className="ml-4 w-fit rounded-full bg-raised px-2.5 py-1 text-xs text-muted sm:ml-0">{item.category}</span>
              </li>
            );
          })}
        </ol>
      </Card>

      <Card>
        <SectionTitle title="Consejos rápidos" />
        <div className="grid gap-3 md:grid-cols-3">
          {QUICK_TIPS.map((t) => (
            <details key={t.q} className="rounded-xl border border-line/70 bg-ink/15 p-4 transition-colors open:border-flame/35">
              <summary className="cursor-pointer font-medium marker:text-flame">{t.q}</summary>
              <p className="mt-3 text-sm leading-6 text-muted">{t.a}</p>
            </details>
          ))}
        </div>
      </Card>
    </div>
  );
}

function remainingInBlock(end: string, minute: number): number {
  const [h, m] = end.split(":").map(Number);
  const e = h * 60 + m;
  return e > minute ? e - minute : e + 1440 - minute;
}

function SplitPanel({ title, detail, onClick, className }: { title: string; detail: string; onClick: () => void; className: string }) {
  return (
    <button onClick={onClick} aria-label={`${title}: ${detail}. Abrir`} className={`${className} grain group relative isolate flex min-h-[180px] overflow-hidden rounded-2xl border border-line/60 px-6 py-7 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-flame/40 hover:brightness-110 sm:min-h-[200px] sm:px-7`}>
      <span className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-xl border border-flame/25 text-flame transition-all duration-200 group-hover:bg-flame group-hover:text-ink" aria-hidden>
        <ChevronRight size={21} />
      </span>
      <span className="mt-auto block max-w-[80%]">
        <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">Tu plan</span>
        <span className="mt-2 block pl-[0.04em] font-display text-2xl uppercase tracking-[0.16em] sm:text-3xl">{title}</span>
        <span className="mt-2 block text-sm leading-5 text-muted">{detail}</span>
      </span>
      <span className="pointer-events-none absolute -bottom-12 -right-6 h-32 w-32 rounded-full border border-white/5 transition-transform duration-300 group-hover:scale-110" aria-hidden />
    </button>
  );
}
