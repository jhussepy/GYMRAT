"use client";

import { Droplets, Minus, Plus } from "lucide-react";
import { PROFILE } from "@/lib/config";
import { CATEGORY_COLOR, QUICK_TIPS, SCHEDULE } from "@/lib/data";
import { bioDayFraction, blockMinutes, caffeineAllowed, findBlock, formatDuration, isInBlock, minutesOf, pad2, todayISO } from "@/lib/time";
import { useStore } from "@/lib/store";
import { Card, ProgressBar, SectionTitle } from "./ui";
import { DayDial } from "./DayDial";
import { useNow } from "./useNow";

const sleepMinutes = SCHEDULE.filter((b) => b.category === "Sueño").reduce((sum, b) => sum + blockMinutes(b), 0);
const gymMinutes = SCHEDULE.filter((b) => b.category === "Gym").reduce((sum, b) => sum + blockMinutes(b), 0);

export function ClockTab() {
  const now = useNow();
  const { state, addWater } = useStore();
  const minute = now ? minutesOf(now) : null;
  const current = minute !== null ? findBlock(SCHEDULE, minute) : undefined;
  const allowed = minute !== null ? caffeineAllowed(minute) : null;
  const date = now ? todayISO(now) : "";
  const water = date ? (state.water[date] ?? 0) : 0;
  const left = current && minute !== null ? remainingInBlock(current.end, minute) : null;

  return (
    <div className="space-y-6">
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
            <h2 className="mt-1 font-serif text-2xl">{current ? current.activity : "Cargando tu horario…"}</h2>
            <p className="mt-2 max-w-prose text-sm text-muted">{current?.description ?? "\u00A0"}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              {current && (
                <span className="rounded-full border border-line px-3 py-1" style={{ color: CATEGORY_COLOR[current.category] }}>
                  {current.start} a {current.end}
                </span>
              )}
              {left !== null && <span className="rounded-full border border-line px-3 py-1 text-muted">Quedan {formatDuration(left)}</span>}
              {allowed !== null && (
                <span className={`rounded-full border px-3 py-1 ${allowed ? "border-mint/50 text-mint" : "border-coral/50 text-coral"}`}>
                  {allowed ? `Cafeína permitida hasta las ${PROFILE.caffeineCutoff}` : `Cafeína cortada desde las ${PROFILE.caffeineCutoff}`}
                </span>
              )}
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-serif text-xl">
                <Droplets size={20} className="text-sky" aria-hidden /> Agua de hoy
              </h2>
              <span className="tabular-nums text-sm text-muted">
                {water.toLocaleString("es")} de {PROFILE.waterGoalMl.toLocaleString("es")} ml
              </span>
            </div>
            <div className="mt-3">
              <ProgressBar value={water} max={PROFILE.waterGoalMl} color="#6EB5E8" label="Agua bebida hoy" />
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => date && addWater(date, -250)} disabled={!date || water <= 0} aria-label="Quitar 250 ml" className="rounded-md border border-line px-3 py-2 text-muted hover:text-chalk disabled:opacity-40">
                <Minus size={16} />
              </button>
              <button onClick={() => date && addWater(date, 250)} disabled={!date} className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-line px-3 py-2 text-sm hover:bg-raised">
                <Plus size={15} /> 250 ml
              </button>
              <button onClick={() => date && addWater(date, 500)} disabled={!date} className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-sky/20 px-3 py-2 text-sm text-sky hover:bg-sky/30">
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
              <li key={item.start} className={`flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-center sm:justify-between ${active ? "border-amber bg-raised" : "border-line"}`} aria-current={active ? "time" : undefined}>
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
            <details key={t.q} className="rounded-md border border-line p-3">
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
