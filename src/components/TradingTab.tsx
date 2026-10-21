import { TRADING_BLOCKS } from "@/lib/data";
import { Card, SectionTitle } from "./ui";

export function TradingTab() {
  return (
    <Card>
      <SectionTitle title="Estudio de trading" hint="Tu bitácora de estudio, sincronizada con los descansos del gimnasio y con los fines de semana." />
      <div className="grid gap-3 md:grid-cols-3">
        {TRADING_BLOCKS.map((b) => (
          <div key={b.title} className="rounded-md border border-line p-4">
            <p className="text-sm text-sky">{b.when}</p>
            <h3 className="mt-1 font-medium">{b.title}</h3>
            <p className="mt-2 text-sm text-muted">{b.text}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
