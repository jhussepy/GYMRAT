import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-sm border border-line bg-panel p-5 ${className}`}>{children}</section>;
}

export function SectionTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-2xl sm:text-3xl">{title}</h2>
      <span className="mt-2 block h-0.5 w-10 bg-flame" aria-hidden />
      {hint && <p className="mt-3 max-w-prose text-sm text-muted">{hint}</p>}
    </div>
  );
}

export function ProgressBar({ value, max, barClass = "bg-flame", label }: { value: number; max: number; barClass?: string; label: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.round(value)} className="h-2 w-full overflow-hidden rounded-sm bg-raised">
      <div className={`h-full transition-[width] duration-300 ${barClass}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function DayPicker<T extends string>({ days, value, onChange, labels }: { days: readonly T[]; value: T; onChange: (d: T) => void; labels?: Partial<Record<T, string>> }) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="tablist">
      {days.map((d) => (
        <button
          key={d}
          role="tab"
          aria-selected={d === value}
          onClick={() => onChange(d)}
          className={`min-h-[44px] shrink-0 rounded-sm border px-4 font-display text-sm uppercase tracking-wider transition-colors duration-200 ${d === value ? "border-flame bg-flame text-ink" : "border-line text-muted hover:border-chalk hover:text-chalk"}`}
        >
          {d}
          {labels?.[d] && <span className={`ml-2 text-xs normal-case tracking-normal ${d === value ? "text-ink/80" : "text-muted"}`}>{labels[d]}</span>}
        </button>
      ))}
    </div>
  );
}
