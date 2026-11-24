"use client";

import { useMemo } from "react";
import { Trophy } from "lucide-react";
import { recordsOverview } from "@/lib/records-view";
import { useStore } from "@/lib/store";
import { Card, SectionTitle } from "./ui";

const fmtDate = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" });

/** Récords personales de cada ejercicio, calculados del historial que ya existe. */
export function RecordsCard() {
  const { state } = useStore();
  const rows = useMemo(() => recordsOverview(state.workoutLogs, state.routines), [state.workoutLogs, state.routines]);

  return (
    <Card>
      <SectionTitle title="Récords personales" hint="Tu mejor peso y tus mejores repeticiones con ese peso, de cada ejercicio. Se calculan de tus series registradas." />
      {rows.length === 0 ? (
        <p className="flex items-start gap-2 text-sm text-muted">
          <Trophy size={18} className="mt-0.5 shrink-0 text-amber" aria-hidden />
          Aún no hay récords. Registra peso y repeticiones en Rutina y aparecerán aquí.
        </p>
      ) : (
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Tabla de récords personales">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th scope="col" className="py-2 font-normal">Ejercicio</th>
                <th scope="col" className="py-2 text-right font-normal">Mejor peso</th>
                <th scope="col" className="py-2 text-right font-normal">Más reps con ese peso</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.exerciseId} className="border-t border-line/60">
                  <td className="py-2 pr-3">{r.name}</td>
                  <td className="py-2 text-right tabular-nums">
                    <span className="font-display text-lg">{r.maxKg.toLocaleString("es")} kg</span>
                    <span className="block text-xs text-muted">{fmtDate(r.maxKgDate)}</span>
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {r.bestRepsAtMaxKg ? (
                      <>
                        <span className="font-display text-lg">{r.bestRepsAtMaxKg.reps}</span>
                        <span className="block text-xs text-muted">{fmtDate(r.bestRepsAtMaxKg.date)}</span>
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs text-muted">Los empates se quedan con el primer día en que se lograron.</p>
    </Card>
  );
}
