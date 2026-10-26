"use client";

import { useEffect, useState } from "react";
import { Activity, Clock3, Dumbbell, Scale, Timer, TrendingUp, Utensils, type LucideIcon } from "lucide-react";
import { PROFILE } from "@/lib/config";
import { StoreProvider } from "@/lib/store";
import { RestTimerProvider, useRestTimer } from "./RestTimer";
import { ClockTab } from "./ClockTab";
import { WorkoutTab } from "./WorkoutTab";
import { NutritionTab } from "./NutritionTab";
import { TradingTab } from "./TradingTab";
import { LogisticsTab } from "./LogisticsTab";
import { ProgressTab } from "./ProgressTab";
import { ThemeToggle } from "./ThemeToggle";
import Link from "next/link";
import { UserRound } from "lucide-react";

const TABS = [
  { id: "dia", label: "Mi día", icon: Clock3 },
  { id: "rutina", label: "Rutina", icon: Dumbbell },
  { id: "menu", label: "Menú", icon: Utensils },
  { id: "trading", label: "Trading", icon: TrendingUp },
  { id: "progreso", label: "Progreso", icon: Scale },
] as const satisfies readonly { id: string; label: string; icon: LucideIcon }[];

export type TabId = (typeof TABS)[number]["id"];

export function App({ userId }: { userId: string }) {
  return (
    <StoreProvider userId={userId}>
      <RestTimerProvider>
        <Shell />
      </RestTimerProvider>
    </StoreProvider>
  );
}

function Shell() {
  const [tab, setTab] = useState<TabId>("dia");
  const { showTimer } = useRestTimer();

  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (TABS.some((t) => t.id === id)) setTab(id as TabId);
  }, []);

  const go = (id: TabId) => {
    setTab(id);
    window.history.replaceState(null, "", `#${id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="app-shell mx-auto flex min-h-screen max-w-7xl flex-col">
      <a href="#contenido" className="sr-only rounded-xl bg-flame px-4 py-2 text-ink focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50">
        Saltar al contenido
      </a>

      <header className="app-header sticky top-0 z-30 border-b border-line/70 bg-panel/90 backdrop-blur-xl">
        <div className="mx-auto grid h-[72px] max-w-7xl grid-cols-[1fr_auto] items-center gap-4 px-4 sm:px-6 lg:grid-cols-[1fr_auto_1fr] lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="brand-mark flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-flame text-ink shadow-sm" aria-hidden>
              <Dumbbell size={21} strokeWidth={2.5} />
            </span>
            <div className="min-w-0">
              <h1 className="text-lg leading-none tracking-[0.18em] sm:text-xl">GYMRAT</h1>
              <p className="mt-1 hidden text-[11px] font-medium tracking-[0.12em] text-muted sm:block">
                COACH PRO <span className="mx-1 text-flame">/</span> TU PROGRESO, ENFOCADO
              </p>
              <p className="mt-1 text-[11px] text-muted sm:hidden">
                {PROFILE.kcalTarget.toLocaleString("es")} kcal · {PROFILE.proteinTargetG} g proteína
              </p>
            </div>
          </div>

          <nav className="hidden items-center gap-1 rounded-2xl border border-line/70 bg-ink/60 p-1 lg:flex" aria-label="Secciones">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => go(t.id)}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-10 items-center gap-2 rounded-xl px-3 font-display text-xs uppercase tracking-wider transition-all duration-200 xl:px-4 ${active ? "bg-raised text-chalk shadow-sm" : "text-muted hover:bg-raised/70 hover:text-chalk"}`}
                >
                  <Icon size={15} aria-hidden />
                  {t.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center justify-self-end gap-3">
            <div className="hidden text-right xl:block">
              <p className="text-xs font-semibold tabular-nums text-chalk">{PROFILE.kcalTarget.toLocaleString("es")} kcal</p>
              <p className="text-[10px] text-muted">{PROFILE.proteinTargetG} g proteína objetivo</p>
            </div>
            <Link href="/cuenta" aria-label="Mi cuenta" title="Mi cuenta" className="flex h-10 w-10 items-center justify-center rounded-xl border border-line/70 text-muted transition hover:border-flame hover:text-flame">
              <UserRound size={18} aria-hidden />
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="contenido" className="flex-1 px-4 pb-28 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pb-12">
        {tab === "dia" && <ClockTab onNavigate={go} />}
        {tab === "rutina" && <WorkoutTab />}
        {tab === "menu" && (
          <div className="space-y-6">
            <NutritionTab />
            <LogisticsTab />
          </div>
        )}
        {tab === "trading" && <TradingTab />}
        {tab === "progreso" && <ProgressTab />}
        <footer className="mt-10 hidden items-center justify-between border-t border-line/60 pt-5 text-xs text-muted sm:flex">
          <span className="flex items-center gap-2"><Activity size={14} className="text-flame" aria-hidden /> GYMRAT · COACH PRO</span>
          <span>La constancia se construye sesión a sesión.</span>
        </footer>
      </main>

      {tab !== "rutina" && (
        <button
          onClick={showTimer}
          aria-label="Abrir cronómetro de descanso"
          className="timer-fab fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-flame text-ink shadow-xl transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110 active:translate-y-0 lg:bottom-6 lg:right-6"
          style={{ bottom: "calc(4.75rem + env(safe-area-inset-bottom))" }}
        >
          <Timer size={25} aria-hidden />
        </button>
      )}

      <nav className="mobile-nav fixed inset-x-0 bottom-0 z-30 border-t border-line/70 bg-panel/95 backdrop-blur-xl lg:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }} aria-label="Secciones">
        <ul className="mx-auto grid max-w-xl grid-cols-5 px-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <li key={t.id}>
                <button
                  onClick={() => go(t.id)}
                  aria-current={active ? "page" : undefined}
                  className={`mobile-nav-item relative flex min-h-[62px] w-full flex-col items-center justify-center gap-1.5 px-1 text-[10px] font-medium transition-colors duration-200 sm:text-xs ${active ? "text-flame" : "text-muted hover:text-chalk"}`}
                >
                  <span className={`flex h-7 w-10 items-center justify-center rounded-xl transition-colors ${active ? "bg-flame/10" : ""}`}>
                    <Icon size={20} strokeWidth={active ? 2.5 : 1.8} aria-hidden />
                  </span>
                  {t.label}
                  {active && <span className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-flame" />}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
