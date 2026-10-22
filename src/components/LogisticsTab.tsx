"use client";

import { Check } from "lucide-react";
import { SHOPPING } from "@/lib/data";
import { useStore } from "@/lib/store";
import { Card, ProgressBar, SectionTitle } from "./ui";

export function LogisticsTab() {
  const { state, toggleShopping } = useStore();
  const done = SHOPPING.filter((i) => state.shopping[i.id]).length;

  return (
    <Card>
      <SectionTitle title="Domingo de preparación" hint="De 11:00 a 17:00: compras, cocina de los 5 tápers y huevos cocidos. Marca lo que ya compraste." />
      <div className="mb-4 flex items-center gap-3">
        <div className="flex-1">
          <ProgressBar value={done} max={SHOPPING.length} label="Compras marcadas" />
        </div>
        <span className="text-sm tabular-nums text-muted">
          {done} de {SHOPPING.length}
        </span>
      </div>
      <ul className="space-y-2">
        {SHOPPING.map((item) => {
          const checked = !!state.shopping[item.id];
          return (
            <li key={item.id}>
              <button onClick={() => toggleShopping(item.id)} role="checkbox" aria-checked={checked} className="flex w-full items-center gap-3 rounded-sm border border-line p-3 text-left hover:bg-raised">
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${checked ? "border-flame bg-flame text-ink" : "border-line"}`}>{checked && <Check size={14} />}</span>
                <span className={checked ? "text-muted line-through" : ""}>
                  <span className="font-medium">{item.label}</span>
                  <span className="ml-2 text-sm text-muted">{item.qty}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
