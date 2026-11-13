"use client";

import { useMemo } from "react";
import { Check } from "lucide-react";
import { planDay, shoppingList } from "@/lib/menu-planner";
import { useProfile, useStore } from "@/lib/store";
import { Card, ProgressBar, SectionTitle } from "./ui";

const WEEK_DAYS = 5; // lunes a viernes: los días con táper
const fmtGrams = (g: number) => (g >= 1000 ? `${(g / 1000).toLocaleString("es", { maximumFractionDigits: 2 })} kg` : `${g} g`);

/** Lista de compras calculada del menú del usuario. Las marcas se guardan por alimento. */
export function LogisticsTab() {
  const { state, toggleShopping } = useStore();
  const profile = useProfile();

  const lines = useMemo(() => {
    const day = planDay(profile.kcalTarget, profile.proteinTargetG);
    return shoppingList(Array.from({ length: WEEK_DAYS }, () => day));
  }, [profile.kcalTarget, profile.proteinTargetG]);

  const done = lines.filter((l) => state.shopping[l.foodId]).length;

  return (
    <Card>
      <SectionTitle
        title="Lista de compras de la semana"
        hint={`Calculada para tu meta (${profile.kcalTarget.toLocaleString("es")} kcal y ${profile.proteinTargetG} g de proteína) de lunes a viernes, con 10 % extra por desperdicio.`}
      />
      {lines.length === 0 ? (
        <p className="text-sm text-muted">Tu menú no tiene alimentos todavía.</p>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-3">
            <div className="flex-1">
              <ProgressBar value={done} max={lines.length} label="Compras marcadas" />
            </div>
            <span className="text-sm tabular-nums text-muted">
              {done} de {lines.length}
            </span>
          </div>
          <ul className="space-y-2">
            {lines.map((line) => {
              const checked = !!state.shopping[line.foodId];
              return (
                <li key={line.foodId}>
                  <button
                    type="button"
                    onClick={() => toggleShopping(line.foodId)}
                    role="checkbox"
                    aria-checked={checked}
                    className="flex min-h-11 w-full items-center gap-3 rounded-xl border border-line/70 p-3 text-left transition-colors duration-200 hover:bg-raised"
                  >
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${checked ? "border-flame bg-flame text-ink" : "border-line"}`}>
                      {checked && <Check size={14} aria-hidden />}
                    </span>
                    <span className={`flex-1 ${checked ? "text-muted line-through" : ""}`}>{line.label}</span>
                    <span className="shrink-0 text-sm tabular-nums text-muted">{fmtGrams(line.grams)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-xs leading-5 text-muted">
            Las cantidades son crudas o según la preparación del catálogo; pesa tus alimentos para ajustar. Si cambias tu meta, la lista se recalcula sola.
          </p>
        </>
      )}
    </Card>
  );
}
