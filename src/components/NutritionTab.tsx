"use client";

import { useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { PROFILE, WEEKDAYS, weekdayFromDate, type Weekday } from "@/lib/config";
import { TAPERS } from "@/lib/data";
import { mealsForDay, totals, type WeekdayWithTaper } from "@/lib/nutrition";
import { Card, DayPicker, ProgressBar, SectionTitle } from "./ui";
import { useStore } from "@/lib/store";
import { todayISO } from "@/lib/time";
import { FOOD_CATALOG, nutritionForGrams } from "@/lib/food-catalog";

const TAPER_DAYS = WEEKDAYS.filter((d): d is WeekdayWithTaper => d !== "Sábado");

function isValidLoggingDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() === month - 1
    && parsed.getUTCDate() === day
    && value <= todayISO();
}

function lastSevenDates(anchor: string): string[] {
  const [year, month, day] = anchor.split("-").map(Number);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1, day - 6 + index));
    return date.toISOString().slice(0, 10);
  });
}

function formatNutritionDate(value: string): string {
  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("es-ES", { weekday: "short", day: "2-digit", month: "short" }).format(date);
}

export function NutritionTab() {
  const { state, addNutritionEntry, removeNutritionEntry } = useStore();
  const [date, setDate] = useState(todayISO());
  const [foodName, setFoodName] = useState("");
  const [foodKcal, setFoodKcal] = useState("");
  const [foodProtein, setFoodProtein] = useState("");
  const [catalogFoodId, setCatalogFoodId] = useState(FOOD_CATALOG[0]?.id ?? "");
  const [foodGrams, setFoodGrams] = useState("100");
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
  const selectedCatalogFood = FOOD_CATALOG.find((food) => food.id === catalogFoodId);
  const grams = Number(foodGrams);
  const catalogMacros = selectedCatalogFood && Number.isInteger(grams) && grams >= 1 && grams <= 5000
    ? nutritionForGrams(selectedCatalogFood, grams)
    : null;
  const consumed = useMemo(
    () => loggedFoods.reduce((acc, food) => ({ kcal: acc.kcal + food.kcal, protein: acc.protein + food.protein }), { kcal: 0, protein: 0 }),
    [loggedFoods],
  );
  const weeklyNutrition = useMemo(() => {
    const days = lastSevenDates(todayISO()).map((dayDate) => {
      const entries = state.nutritionEntries[dayDate] ?? [];
      const totals = entries.reduce(
        (acc, entry) => ({ kcal: acc.kcal + entry.kcal, protein: acc.protein + entry.protein }),
        { kcal: 0, protein: 0 },
      );
      return { date: dayDate, entriesCount: entries.length, hasData: entries.length > 0, ...totals };
    });
    const recordedDays = days.filter((dayRecord) => dayRecord.hasData);
    const averageKcal = recordedDays.length
      ? Math.round(recordedDays.reduce((sum, dayRecord) => sum + dayRecord.kcal, 0) / recordedDays.length)
      : null;
    const averageProtein = recordedDays.length
      ? Math.round((recordedDays.reduce((sum, dayRecord) => sum + dayRecord.protein, 0) / recordedDays.length) * 10) / 10
      : null;
    const kcalMin = PROFILE.kcalTarget * 0.9;
    const kcalMax = PROFILE.kcalTarget * 1.1;
    return {
      days,
      recordedCount: recordedDays.length,
      averageKcal,
      averageProtein,
      daysNearKcalTarget: recordedDays.filter((dayRecord) => dayRecord.kcal >= kcalMin && dayRecord.kcal <= kcalMax).length,
      daysAtProteinTarget: recordedDays.filter((dayRecord) => dayRecord.protein >= PROFILE.proteinTargetG).length,
    };
  }, [state.nutritionEntries]);

  const addFood = () => {
    if (!isValidLoggingDate(date)) {
      setLogMessage(!date ? "Selecciona una fecha para registrar el alimento." : date > todayISO() ? "No puedes registrar alimentos en una fecha futura." : "La fecha seleccionada no es válida.");
      return;
    }
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

  const addCatalogFood = () => {
    if (!isValidLoggingDate(date)) {
      setLogMessage(!date ? "Selecciona una fecha para registrar el alimento." : date > todayISO() ? "No puedes registrar alimentos en una fecha futura." : "La fecha seleccionada no es válida.");
      return;
    }
    if (!selectedCatalogFood) {
      setLogMessage("Selecciona un alimento del catálogo.");
      return;
    }
    if (!Number.isInteger(grams) || grams < 1 || grams > 5000) {
      setLogMessage("Introduce una cantidad entera entre 1 y 5000 gramos.");
      return;
    }
    const macros = nutritionForGrams(selectedCatalogFood, grams);
    addNutritionEntry({
      id: `${date}-catalog-${Date.now()}`,
      date,
      name: `${selectedCatalogFood.label} (${grams} g)`,
      kcal: macros.kcal,
      protein: macros.protein,
    });
    setLogMessage("Alimento del catálogo registrado con valores estimados.");
  };

  return (
    <div className="space-y-6">
      <Card>
        <SectionTitle title="Consumo real del día" hint="Registra lo que realmente comes. Este seguimiento es independiente del menú planificado y se guarda por fecha en este dispositivo." />
        <label className="block text-sm text-muted">
          Fecha del registro
          <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setLogMessage(""); }} max={todayISO()} className="mt-1 block h-11 rounded-sm border border-line bg-ink px-3 text-chalk" />
        </label>
        <div className="mt-4 rounded-xl border border-line/70 bg-ink/15 p-4">
          <h3 className="font-medium">Añadir desde el catálogo</h3>
          <p className="mt-1 text-sm text-muted">Selecciona un alimento y su peso en gramos para estimar automáticamente calorías y proteína.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(120px,1fr)_minmax(180px,1fr)_auto] lg:items-end">
            <label className="text-sm text-muted">
              Alimento
              <select value={catalogFoodId} onChange={(e) => setCatalogFoodId(e.target.value)} className="mt-1 block h-11 w-full rounded-sm border border-line bg-ink px-3 text-chalk">
                {FOOD_CATALOG.map((food) => <option key={food.id} value={food.id}>{food.label}</option>)}
              </select>
            </label>
            <label className="text-sm text-muted">
              Cantidad (g)
              <input type="number" inputMode="numeric" min="1" max="5000" step="1" value={foodGrams} onChange={(e) => setFoodGrams(e.target.value)} className="mt-1 block h-11 w-full rounded-sm border border-line bg-ink px-3 text-chalk tabular-nums" />
            </label>
            <div className="rounded-sm border border-line/70 px-3 py-2 text-sm">
              <p className="text-muted">Estimación por porción</p>
              <p className="mt-1 tabular-nums">{catalogMacros ? `${catalogMacros.kcal} kcal · ${catalogMacros.protein} g proteína` : "Introduce gramos válidos"}</p>
            </div>
            <button onClick={addCatalogFood} className="min-h-[44px] rounded-sm border border-line px-4 font-medium hover:bg-raised">Registrar alimento</button>
          </div>
          {selectedCatalogFood && <p className="mt-2 text-xs text-muted">Base: valores orientativos por 100 g; {selectedCatalogFood.basis}. El producto concreto puede variar.</p>}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm text-muted sm:col-span-2 lg:col-span-1">
            Alimento o comida
            <input value={foodName} onChange={(e) => setFoodName(e.target.value)} maxLength={100} placeholder="Ej. 2 huevos cocidos" className="mt-1 block h-11 w-full rounded-sm border border-line bg-ink px-3 text-chalk" />
          </label>
          <label className="text-sm text-muted">
            Calorías (kcal)
            <input type="number" min="0" max="5000" step="1" value={foodKcal} onChange={(e) => setFoodKcal(e.target.value)} placeholder="155" className="mt-1 block h-11 w-full rounded-sm border border-line bg-ink px-3 text-chalk tabular-nums" />
          </label>
          <label className="text-sm text-muted">
            Proteína (g)
            <input type="number" min="0" max="400" step="0.1" value={foodProtein} onChange={(e) => setFoodProtein(e.target.value)} placeholder="13" className="mt-1 block h-11 w-full rounded-sm border border-line bg-ink px-3 text-chalk tabular-nums" />
          </label>
          <button onClick={addFood} className="min-h-[44px] self-end rounded-sm bg-flame px-4 font-medium text-ink hover:brightness-110">Añadir alimento</button>
        </div>
        <p className="mt-2 min-h-5 text-sm text-muted" role="status">{logMessage}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-line/70 bg-ink/20 p-4">
            <div className="mb-1 flex items-center justify-between text-sm">
              <span>Calorías consumidas</span>
              <span className="tabular-nums">{consumed.kcal} / {PROFILE.kcalTarget} kcal</span>
            </div>
            <ProgressBar value={consumed.kcal} max={PROFILE.kcalTarget} barClass="bg-amber" label="Calorías consumidas" />
            <p className="mt-2 text-xs text-muted">{consumed.kcal <= PROFILE.kcalTarget ? `Quedan ${PROFILE.kcalTarget - consumed.kcal} kcal respecto a la meta.` : `Superas la meta en ${consumed.kcal - PROFILE.kcalTarget} kcal.`}</p>
          </div>
          <div className="rounded-xl border border-line/70 bg-ink/20 p-4">
            <div className="mb-1 flex items-center justify-between text-sm">
              <span>Proteína consumida</span>
              <span className="tabular-nums">{Math.round(consumed.protein * 10) / 10} / {PROFILE.proteinTargetG} g</span>
            </div>
            <ProgressBar value={consumed.protein} max={PROFILE.proteinTargetG} barClass="bg-flame" label="Proteína consumida" />
            <p className="mt-2 text-xs text-muted">{consumed.protein < PROFILE.proteinTargetG ? `Faltan ${Math.round((PROFILE.proteinTargetG - consumed.protein) * 10) / 10} g para la meta.` : "Meta de proteína alcanzada."}</p>
          </div>
        </div>
        <div className="mt-4">
          {loggedFoods.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line p-4 text-sm text-muted">Todavía no has registrado alimentos para esta fecha.</p>
          ) : (
            <ul className="divide-y divide-line/70">
              {loggedFoods.map((food) => (
                <li key={food.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-medium">{food.name}</p>
                    <p className="mt-1 text-sm text-muted">{food.kcal} kcal · {food.protein} g de proteína</p>
                  </div>
                  <button onClick={() => removeNutritionEntry(date, food.id)} aria-label={`Eliminar ${food.name}`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm text-muted hover:bg-raised hover:text-rose">
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <Card>
        <SectionTitle
          title="Resumen nutricional · últimos 7 días"
          hint="Los promedios y el cumplimiento se calculan solo sobre los días con alimentos registrados. Los días sin registros no se interpretan como cero consumo."
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-line/70 bg-ink/20 p-4">
            <p className="text-sm text-muted">Días registrados</p>
            <p className="mt-1 font-display text-3xl tabular-nums">{weeklyNutrition.recordedCount}<span className="text-base text-muted"> / 7</span></p>
          </div>
          <div className="rounded-xl border border-line/70 bg-ink/20 p-4">
            <p className="text-sm text-muted">Promedio de calorías</p>
            <p className="mt-1 font-display text-3xl tabular-nums">{weeklyNutrition.averageKcal === null ? "—" : weeklyNutrition.averageKcal.toLocaleString("es-ES")}<span className="text-base text-muted"> kcal</span></p>
            <p className="mt-1 text-xs text-muted">Meta diaria: {PROFILE.kcalTarget.toLocaleString("es-ES")} kcal</p>
          </div>
          <div className="rounded-xl border border-line/70 bg-ink/20 p-4">
            <p className="text-sm text-muted">Promedio de proteína</p>
            <p className="mt-1 font-display text-3xl tabular-nums">{weeklyNutrition.averageProtein === null ? "—" : weeklyNutrition.averageProtein.toLocaleString("es-ES")}<span className="text-base text-muted"> g</span></p>
            <p className="mt-1 text-xs text-muted">Meta diaria: {PROFILE.proteinTargetG} g</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-line/70 p-4">
            <p className="text-sm text-muted">Días dentro de ±10 % de calorías</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{weeklyNutrition.recordedCount ? weeklyNutrition.daysNearKcalTarget : "—"}<span className="text-sm font-normal text-muted">{weeklyNutrition.recordedCount ? ` / ${weeklyNutrition.recordedCount} registrados` : " · sin datos"}</span></p>
            <p className="mt-1 text-xs text-muted">Rango orientativo: {Math.round(PROFILE.kcalTarget * 0.9).toLocaleString("es-ES")}–{Math.round(PROFILE.kcalTarget * 1.1).toLocaleString("es-ES")} kcal.</p>
          </div>
          <div className="rounded-xl border border-line/70 p-4">
            <p className="text-sm text-muted">Días que alcanzaron la meta de proteína</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">{weeklyNutrition.recordedCount ? weeklyNutrition.daysAtProteinTarget : "—"}<span className="text-sm font-normal text-muted">{weeklyNutrition.recordedCount ? ` / ${weeklyNutrition.recordedCount} registrados` : " · sin datos"}</span></p>
            <p className="mt-1 text-xs text-muted">Objetivo: al menos {PROFILE.proteinTargetG} g al día.</p>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="py-2 pr-3 font-normal">Fecha</th>
                <th className="py-2 pr-3 text-right font-normal">Alimentos</th>
                <th className="py-2 pr-3 text-right font-normal">Calorías</th>
                <th className="py-2 text-right font-normal">Proteína</th>
              </tr>
            </thead>
            <tbody>
              {weeklyNutrition.days.map((dayRecord) => (
                <tr key={dayRecord.date} className="border-t border-line">
                  <td className="py-2 pr-3 capitalize">{formatNutritionDate(dayRecord.date)}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{dayRecord.hasData ? dayRecord.entriesCount : "—"}</td>
                  <td className="py-2 pr-3 text-right tabular-nums">{dayRecord.hasData ? dayRecord.kcal.toLocaleString("es-ES") : "Sin registro"}</td>
                  <td className="py-2 text-right tabular-nums">{dayRecord.hasData ? `${Math.round(dayRecord.protein * 10) / 10} g` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

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
