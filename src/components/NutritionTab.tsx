"use client";

import { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { PROFILE, WEEKDAYS, weekdayFromDate, type Weekday } from "@/lib/config";
import { TAPERS } from "@/lib/data";
import { mealsForDay, totals, type WeekdayWithTaper } from "@/lib/nutrition";
import { Card, DayPicker, ProgressBar, SectionTitle } from "./ui";
import { useStore } from "@/lib/store";
import { todayISO } from "@/lib/time";

const TAPER_DAYS = WEEKDAYS.filter((d): d is WeekdayWithTaper => d !== "Sábado");

export function NutritionTab() {
  const { state, addNutritionEntry, removeNutritionEntry } = useStore();
  const [date, setDate] = useState(todayISO());
  const [foodName, setFoodName] = useState("");
  const [foodKcal, setFoodKcal] = useState("");
  const [foodProtein, setFoodProtein] = useState("");
  const [logMessage, setLogMessage] = useState("");
  const [day, setDay] = useState<WeekdayWithTaper>("Lunes");

  useEffect(() => {
    const w: Weekday | null = weekdayFromDate(new Date());
    if (w && w !== "Sábado") setDay(w);
  }, []);

  const meals = mealsForDay(day);
  const t = totals(meals);
  const kcalGap = PROFILE.kcalTarget - t.kcal;
  const loggedFoods = state.nutritionEntries[date] ?? [];
  const consumed = useMemo(
    () => loggedFoods.reduce((acc, food) => ({ kcal: acc.kcal + food.kcal, protein: acc.protein + food.protein }), { kcal: 0, protein: 0 }),
    [loggedFoods],
  );

  const addFood = () => {
    const name = foodName.trim();
    const kcal = Number(foodKcal);
    const protein = Number(foodProtein || 0);
    if (!name) {
      setLogMessage("Escribe el nombre del alimento o comida.");
      return;
    }
    if (!Number.isFinite(kcal) || kcal < 0 || kcal > 5000) {
      setLogMessage("Introduce calorías válidas entre 0 y 5000.");
      return;
    }
    if (!Number.isFinite(protein) || protein < 0 || protein > 400) {
      setLogMessage("Introduce proteína válida entre 0 y 400 g.");
      return;
    }
    addNutritionEntry({
      id: `${date}-${Date.now()}`,
      date,
      name,
      kcal: Math.round(kcal),
      protein: Math.round(protein * 10) / 10,
    });
    setFoodName("");
    setFoodKcal("");
    setFoodProtein("");
    setLogMessage("Alimento registrado.");
  };

  return (
    <div className="space-y-6">
      <Card>
        <SectionTitle title="Menú del día" hint="Elige un día para ver sus comidas con calorías y proteína aproximadas." />
        <DayPicker days={TAPER_DAYS} value={day} onChange={setDay} />

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-1.5 flex justify-between text-sm">
              <span>Calorías</span>
              <span className="tabular-nums text-muted">
                {t.kcal} de {PROFILE.kcalTarget} kcal
              </span>
            </div>
            <ProgressBar value={t.kcal} max={PROFILE.kcalTarget} barClass="bg-amber" label="Calorías del día" />
          </div>
          <div>
            <div className="mb-1.5 flex justify-between text-sm">
              <span>Proteína</span>
              <span className="tabular-nums text-muted">
                {t.protein} de {PROFILE.proteinTargetG} g
              </span>
            </div>
            <ProgressBar value={t.protein} max={PROFILE.proteinTargetG} barClass="bg-flame" label="Proteína del día" />
          </div>
        </div>
        <p className="mt-3 text-sm text-muted">
          {kcalGap > 100
            ? `Con este menú te faltan unas ${kcalGap} kcal para llegar a tu meta.`
            : kcalGap < -100
              ? `Con este menú te pasas unas ${-kcalGap} kcal de tu meta.`
              : "Este menú está dentro de tu meta de calorías."}
        </p>
      </Card>

      <div className="space-y-3">
        {meals.map((m) => (
          <Card key={m.id} className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium">
                <span className="mr-2 tabular-nums text-amber">{m.time}</span>
                {m.name}
              </p>
              <p className="mt-1 text-sm text-muted">{m.food}</p>
            </div>
            <p className="shrink-0 text-right text-sm tabular-nums text-muted">
              {m.kcal} kcal
              <br />
              {m.protein} g prot.
            </p>
          </Card>
        ))}
      </div>

      <Card>
        <SectionTitle title="Resumen de la semana" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="py-2 font-normal">Día</th>
                <th className="py-2 font-normal">Táper</th>
                <th className="py-2 text-right font-normal">kcal</th>
                <th className="py-2 text-right font-normal">Proteína</th>
              </tr>
            </thead>
            <tbody>
              {TAPER_DAYS.map((d) => {
                const dt = totals(mealsForDay(d));
                return (
                  <tr key={d} className="border-t border-line">
                    <td className="py-2">{d}</td>
                    <td className="py-2 text-muted">{TAPERS[d].title}</td>
                    <td className="py-2 text-right tabular-nums">{dt.kcal}</td>
                    <td className="py-2 text-right tabular-nums">{dt.protein} g</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-muted">Los valores son estimaciones con porciones cocidas. Ajusta los números en src/lib/data.ts si pesas tus alimentos.</p>
      </Card>

      <Card>
        <SectionTitle title="Recetario de los 5 tápers" hint="De lunes a viernes, uno por día, listos el domingo." />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {TAPER_DAYS.map((d) => {
            const tp = TAPERS[d];
            return (
              <div key={tp.id} className="rounded-sm border border-line p-4">
                <p className="text-sm text-sky">
                  {tp.num} · {d}
                </p>
                <h3 className="mt-1 font-medium">{tp.title}</h3>
                <p className="mt-1 text-sm text-muted">{tp.description}</p>
                <p className="mt-2 text-sm tabular-nums">
                  {tp.kcal} kcal · {tp.protein} g de proteína
                </p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
