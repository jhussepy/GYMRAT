"use client";

import { useEffect, useState } from "react";
import { Clock3, Dumbbell, Scale, ShoppingCart, Timer, TrendingUp, Utensils, type LucideIcon } from "lucide-react";
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
  { id: "compras", label: "Compras", icon: ShoppingCart },
  { id: "progreso", label: "Progreso", icon: Scale },
] as const satisfies readonly { id: string; label: string; icon: LucideIcon }[];

type TabId = (typeof TABS)[number]["id"];

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
      <header className="sticky top-0 z-30 border-b border-line bg-ink/90 backdrop-blur">
        <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
          <div>
            <h1 className="font-serif text-xl leading-tight">Coach Pro</h1>
            <p className="text-xs text-muted">
              {PROFILE.kcalTarget.toLocaleString("es")} kcal · {PROFILE.proteinTargetG} g de proteína · Smart Fit a las 19:00
            </p>
          </div>
          <nav className="hidden gap-1 lg:flex" aria-label="Secciones">
            {TABS.map((t) => (
              <button key={t.id} onClick={() => go(t.id)} aria-current={tab === t.id ? "page" : undefined} className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${tab === t.id ? "bg-raised text-chalk" : "text-muted hover:text-chalk"}`}>
                <t.icon size={16} aria-hidden /> {t.label}
              </button>
            ))}
          </nav>
          <button onClick={showTimer} className="flex items-center gap-2 rounded-md border border-line px-3 py-2 text-sm hover:bg-raised">
            <Timer size={16} aria-hidden /> Cronómetro
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 pb-28 pt-6 sm:px-6 lg:pb-10">
        {tab === "dia" && <ClockTab />}
        {tab === "rutina" && <WorkoutTab />}
        {tab === "menu" && <NutritionTab />}
        {tab === "trading" && <TradingTab />}
        {tab === "compras" && <LogisticsTab />}
        {tab === "progreso" && <ProgressTab />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-ink/95 backdrop-blur lg:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }} aria-label="Secciones">
        <ul className="grid grid-cols-6">
          {TABS.map((t) => (
            <li key={t.id}>
              <button onClick={() => go(t.id)} aria-current={tab === t.id ? "page" : undefined} className={`flex w-full flex-col items-center gap-1 py-2.5 text-[11px] ${tab === t.id ? "text-mint" : "text-muted"}`}>
                <t.icon size={20} aria-hidden />
                {t.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
