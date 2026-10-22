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
    <div className="space-y-6">
      <section className="hero-bg grain flex min-h-[320px] flex-col items-center justify-center rounded-sm border border-line px-4 py-12 text-center sm:min-h-[380px]">
        <p className="text-sm capitalize tracking-[0.35em] text-muted">{weekdayName || "\u00A0"}</p>
        <h2 className="mt-3 pl-[0.15em] text-5xl tracking-[0.15em] sm:text-7xl">{now ? (plan ? WORKOUT_FOCUS[plan] : "Preparación") : "Coach Pro"}</h2>
        <p className="mt-4 pl-[0.3em] text-sm tracking-[0.3em] text-chalk sm:text-base">{plan ? "SMART FIT · 19:00 A 21:00" : "COMPRAS Y TÁPERS · 11:00 A 17:00"}</p>
        <button
          onClick={() => onNavigate(plan ? "rutina" : "menu")}
          className="mt-8 min-h-[48px] rounded-sm bg-flame px-8 font-display text-base uppercase tracking-widest text-ink transition-[filter] duration-200 hover:brightness-110"
        >
          {plan ? "Ver rutina de hoy" : "Ver compras"}
        </button>
      </section>

      <div className="grid gap-px overflow-hidden rounded-sm border border-line bg-line sm:grid-cols-2">
        <SplitPanel className="panel-a" title="Rutina" detail={plan ? `${WORKOUTS[plan].length} ${plan === "Sábado" ? "bloques" : "ejercicios"} · ${WORKOUT_FOCUS[plan]}` : "Hoy descansas del gimnasio"} onClick={() => onNavigate("rutina")} />
        <SplitPanel className="panel-b" title="Menú" detail={dayTotals ? `${dayTotals.kcal} kcal · ${dayTotals.protein} g de proteína` : "Tápers de lunes a viernes"} onClick={() => onNavigate("menu")} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
        <Card className="flex flex-col items-center justify-center">
          <DayDial
            fraction={now ? bioDayFraction(now) : null}
            activeStart={current?.start}
            title={now ? `${pad2(now.getHours())}:${pad2(now.getMinutes())}:${pad2(now.getSeconds())}` : "--:--:--"}
            subtitle={`Tu día empieza a las ${PROFILE.wake}`}
          />
          <ul className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted">
            {(Object.keys(CATEGORY_COLOR) as (keyof typeof CATEGORY_COLOR)[]).map((cat) => (
              <li key={cat} className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: CATEGORY_COLOR[cat] }} />
                {cat}
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-6">
          <Card>
            <p className="text-sm text-muted">Ahora</p>
            <h2 className="mt-1 font-display text-2xl">{current ? current.activity : "Cargando tu horario…"}</h2>
            <p className="mt-2 max-w-prose text-sm text-muted">{current?.description ?? "\u00A0"}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              {current && (
                <span className="rounded-full border border-line px-3 py-1" style={{ color: CATEGORY_COLOR[current.category] }}>
                  {current.start} a {current.end}
                </span>
              )}
              {left !== null && <span className="rounded-full border border-line px-3 py-1 text-muted">Quedan {formatDuration(left)}</span>}
              {allowed !== null && (
                <span className={`rounded-full border px-3 py-1 ${allowed ? "border-flame/50 text-flame" : "border-rose/50 text-rose"}`}>
                  {allowed ? `Cafeína permitida hasta las ${PROFILE.caffeineCutoff}` : `Cafeína cortada desde las ${PROFILE.caffeineCutoff}`}
                </span>
              )}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-xl">
                <Droplets size={20} className="text-sky" aria-hidden /> Agua de hoy
              </h2>
              <span className="tabular-nums text-sm text-muted">
                {water.toLocaleString("es")} de {PROFILE.waterGoalMl.toLocaleString("es")} ml
              </span>
            </div>
            <div className="mt-3">
              <ProgressBar value={water} max={PROFILE.waterGoalMl} color="#7FB6E0" label="Agua bebida hoy" />
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => date && addWater(date, -250)} disabled={!date || water <= 0} aria-label="Quitar 250 ml" className="flex h-11 w-12 items-center justify-center rounded-sm border border-line text-muted transition-colors duration-200 hover:text-chalk disabled:opacity-40">
                <Minus size={16} />
              </button>
              <button onClick={() => date && addWater(date, 250)} disabled={!date} className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-sm border border-line text-sm transition-colors duration-200 hover:bg-raised">
                <Plus size={15} /> 250 ml
              </button>
              <button onClick={() => date && addWater(date, 500)} disabled={!date} className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-sm bg-sky/20 text-sm text-sky transition-colors duration-200 hover:bg-sky/30">
                <Plus size={15} /> 500 ml
              </button>
            </div>
          </Card>
        </div>
      </div>

      <Card>
        <SectionTitle title="Tu día, hora por hora" hint={`Sueño total: ${formatDuration(sleepMinutes)} (noche y siesta). Gimnasio: ${formatDuration(gymMinutes)}.`} />
        <ol className="space-y-2">
          {SCHEDULE.map((item) => {
            const active = minute !== null && isInBlock(item, minute);
            return (
              <li key={item.start} className={`flex flex-col gap-2 rounded-sm border p-3 sm:flex-row sm:items-center sm:justify-between ${active ? "border-amber bg-raised" : "border-line"}`} aria-current={active ? "time" : undefined}>
                <div className="flex items-start gap-3">
                  <span className="mt-1 h-8 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: CATEGORY_COLOR[item.category] }} aria-hidden />
                  <div>
                    <p className="font-medium">
                      <span className="mr-2 tabular-nums text-muted">
                        {item.start} a {item.end}
                      </span>
                      {item.activity}
                    </p>
                    <p className="text-sm text-muted">{item.description}</p>
                  </div>
                </div>
                <span className="text-sm text-muted">{item.category}</span>
              </li>
            );
          })}
        </ol>
      </Card>

      <Card>
        <SectionTitle title="Consejos rápidos" />
        <div className="grid gap-3 md:grid-cols-3">
          {QUICK_TIPS.map((t) => (
            <details key={t.q} className="rounded-sm border border-line p-3">
              <summary className="cursor-pointer font-medium">{t.q}</summary>
              <p className="mt-2 text-sm text-muted">{t.a}</p>
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
    <button onClick={onClick} aria-label={`${title}: ${detail}. Abrir`} className={`${className} grain group flex min-h-[200px] flex-col items-center justify-center gap-4 px-6 py-8 text-center transition-[filter] duration-200 hover:brightness-110`}>
      <span className="pl-[0.3em] font-display text-xl uppercase tracking-[0.3em]">{title}</span>
      <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-flame text-flame transition-colors duration-200 group-hover:bg-flame group-hover:text-ink">
        <ChevronRight size={24} aria-hidden />
      </span>
      <span className="text-sm text-muted">{detail}</span>
    </button>
  );
}
