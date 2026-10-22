"use client";

import { useEffect, useState } from "react";
import { Clock3, Dumbbell, Scale, Timer, TrendingUp, Utensils, type LucideIcon } from "lucide-react";
import { PROFILE } from "@/lib/config";
import { StoreProvider } from "@/lib/store";
import { RestTimerProvider, useRestTimer } from "./RestTimer";
import { ClockTab } from "./ClockTab";
import { WorkoutTab } from "./WorkoutTab";
import { NutritionTab } from "./NutritionTab";
import { TradingTab } from "./TradingTab";
import { LogisticsTab } from "./LogisticsTab";
import { ProgressTab } from "./ProgressTab";

const TABS = [
  { id: "dia", label: "Mi día", icon: Clock3 },
  { id: "rutina", label: "Rutina", icon: Dumbbell },
  { id: "menu", label: "Menú", icon: Utensils },
  { id: "trading", label: "Trading", icon: TrendingUp },
  { id: "progreso", label: "Progreso", icon: Scale },
] as const satisfies readonly { id: string; label: string; icon: LucideIcon }[];

export type TabId = (typeof TABS)[number]["id"];

export function App() {
  return (
    <StoreProvider>
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
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col">
      <a href="#contenido" className="sr-only rounded-sm bg-flame px-4 py-2 text-ink focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50">
        Saltar al contenido
      </a>

      <header className="sticky top-0 z-30 border-b border-line bg-panel/95 backdrop-blur">
        <div className="grid h-16 grid-cols-[1fr_auto] items-center gap-4 px-4 sm:px-6 lg:grid-cols-[1fr_auto_1fr]">
          <div>
            <h1 className="text-lg leading-none tracking-[0.25em]">Coach Pro</h1>
            <p className="mt-1 hidden text-xs text-muted sm:block">
              {PROFILE.kcalTarget.toLocaleString("es")} kcal · {PROFILE.proteinTargetG} g de proteína
            </p>
          </div>
          <nav className="hidden gap-1 lg:flex" aria-label="Secciones">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => go(t.id)}
                aria-current={tab === t.id ? "page" : undefined}
                className={`min-h-[44px] border-b-2 px-4 font-display text-sm uppercase tracking-wider transition-colors duration-200 ${tab === t.id ? "border-flame text-chalk" : "border-transparent text-muted hover:text-chalk"}`}
              >
                {t.label}
              </button>
            ))}
          </nav>
          <span className="hidden lg:block" />
        </div>
      </header>

      <main id="contenido" className="flex-1 px-4 pb-28 pt-6 sm:px-6 lg:pb-10">
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
      </main>

      {tab !== "rutina" && (
        <button
          onClick={showTimer}
          aria-label="Abrir cronómetro de descanso"
          className="fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-sm bg-flame text-ink shadow-lg transition-[filter] duration-200 hover:brightness-110 lg:bottom-6 lg:right-6"
          style={{ bottom: "calc(4.75rem + env(safe-area-inset-bottom))" }}
        >
          <Timer size={26} aria-hidden />
        </button>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-panel/95 backdrop-blur lg:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }} aria-label="Secciones">
        <ul className="grid grid-cols-5">
          {TABS.map((t) => (
            <li key={t.id}>
              <button
                onClick={() => go(t.id)}
                aria-current={tab === t.id ? "page" : undefined}
                className={`flex min-h-[56px] w-full flex-col items-center justify-center gap-1 border-t-2 text-xs transition-colors duration-200 ${tab === t.id ? "border-flame text-flame" : "border-transparent text-muted"}`}
              >
                <t.icon size={22} aria-hidden />
                {t.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
