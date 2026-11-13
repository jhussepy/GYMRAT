"use client";

import { useMemo, useState } from "react";
import { planDay, type PlannedItem } from "@/lib/menu-planner";
import { useProfile } from "@/lib/store";
import { Card, DayPicker, ProgressBar, SectionTitle } from "./ui";

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"] as const;
type Day = (typeof DAYS)[number];

const fmt = (n: number) => n.toLocaleString("es");

/**
 * Menú del día calculado para la meta del usuario. Cada día lleva la misma estructura, porque la meta
 * es la misma; lo que cambia es el orden de las comidas y las porciones que se ajustan por proteína.
 */
export function CalculatedMenu() {
  const profile = useProfile();
  const [day, setDay] = useState<Day>("Lunes");
  const menu = useMemo(() => planDay(profile.kcalTarget, profile.proteinTargetG), [profile.kcalTarget, profile.proteinTargetG]);

  const kcalGap = profile.kcalTarget - menu.kcal;
  const proteinGap = Math.round(menu.proteinDelta);

  return (
    <Card>
      <SectionTitle
        title="Menú del día"
        hint="Calculado para tu meta: cada porción se ajusta a tus calorías y tu proteína. Lunes a viernes llevas el mismo menú, así la lista de compras es exacta."
      />
      <DayPicker days={DAYS} value={day} onChange={setDay} />

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <div className="mb-1.5 flex justify-between text-sm">
            <span>Calorías</span>
            <span className="tabular-nums text-muted">
              {fmt(menu.kcal)} de {fmt(profile.kcalTarget)} kcal
            </span>
          </div>
          <ProgressBar value={menu.kcal} max={profile.kcalTarget} barClass="bg-amber" label="Calorías del menú" />
        </div>
        <div>
          <div className="mb-1.5 flex justify-between text-sm">
            <span>Proteína</span>
            <span className="tabular-nums text-muted">
              {menu.protein} de {profile.proteinTargetG} g
            </span>
          </div>
          <ProgressBar value={menu.protein} max={profile.proteinTargetG} barClass="bg-flame" label="Proteína del menú" />
        </div>
      </div>
      <p className="mt-3 text-sm text-muted" role="status">
        {Math.abs(kcalGap) <= 40 && Math.abs(proteinGap) <= 5
          ? "El menú cuadra con tu meta de calorías y proteína."
          : `Diferencia: ${kcalGap >= 0 ? "faltan" : "sobran"} ${fmt(Math.abs(kcalGap))} kcal y ${proteinGap >= 0 ? "faltan" : "sobran"} ${Math.abs(proteinGap)} g de proteína.`}
      </p>

      <div className="mt-6 space-y-4">
        {menu.meals.map((meal) => (
          <article key={meal.name} className="rounded-xl border border-line/70 p-4">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-lg">{meal.name}</h3>
              <p className="shrink-0 text-sm tabular-nums text-muted">
                {fmt(meal.kcal)} kcal · {meal.protein} g prot.
              </p>
            </div>
            <ul className="mt-3 space-y-1.5 text-sm">
              {meal.items.map((i: PlannedItem) => (
                <li key={`${meal.name}-${i.foodId}`} className="flex justify-between gap-3">
                  <span>{i.label}</span>
                  <span className="shrink-0 tabular-nums text-muted">{i.grams} g</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <p className="mt-5 text-xs leading-5 text-muted">
        Valores orientativos por alimento crudo o cocido según indica el catálogo. Pesa tus porciones durante una semana para ajustarlas a tu cuerpo.
      </p>
    </Card>
  );
}
