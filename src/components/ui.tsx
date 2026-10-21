import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-line bg-panel p-5 ${className}`}>{children}</section>;
}

export function SectionTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-4">
      <h2 className="font-serif text-xl">{title}</h2>
      {hint && <p className="mt-1 max-w-prose text-sm text-muted">{hint}</p>}
    </div>
  );
}

export function ProgressBar({ value, max, color = "#2FB58C", label }: { value: number; max: number; color?: string; label: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.round(value)} className="h-2.5 w-full overflow-hidden rounded-full bg-raised">
      <div className="h-full rounded-full transition-[width]" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

export function DayPicker<T extends string>({ days, value, onChange, labels }: { days: readonly T[]; value: T; onChange: (d: T) => void; labels?: Partial<Record<T, string>> }) {
  return (
    <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist">
      {days.map((d) => (
        <button
          key={d}
          role="tab"
          aria-selected={d === value}
          onClick={() => onChange(d)}
          className={`shrink-0 rounded-md border px-3 py-2 text-sm ${d === value ? "border-mint bg-mint/15 text-chalk" : "border-line text-muted hover:text-chalk"}`}
        >
          {d}
          {labels?.[d] && <span className="ml-1.5 text-xs text-muted">{labels[d]}</span>}
        </button>
      ))}
    </div>
  );
}
