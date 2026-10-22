import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <section className={`surface-card rounded-2xl border border-line/80 bg-panel/90 p-5 shadow-sm sm:p-6 ${className}`}>
      {children}
    </section>
  );
}

export function SectionTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-5">
      <div className="flex items-start gap-3">
        <span className="mt-1 h-6 w-1 shrink-0 rounded-full bg-flame" aria-hidden />
        <div className="min-w-0">
          <h2 className="text-2xl sm:text-3xl">{title}</h2>
          {hint && <p className="mt-2 max-w-prose text-sm leading-6 text-muted">{hint}</p>}
        </div>
      </div>
    </div>
  );
}

export function ProgressBar({ value, max, barClass = "bg-flame", label }: { value: number; max: number; barClass?: string; label: string }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.max(0, Math.min(max, Math.round(value)))} className="progress-track h-2.5 w-full overflow-hidden rounded-full bg-raised">
      <div className={`h-full rounded-full transition-[width] duration-500 ease-out ${barClass}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function DayPicker<T extends string>({ days, value, onChange, labels }: { days: readonly T[]; value: T; onChange: (d: T) => void; labels?: Partial<Record<T, string>> }) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1.5" role="tablist">
      {days.map((d) => (
        <button
          key={d}
          role="tab"
          aria-selected={d === value}
          onClick={() => onChange(d)}
          className={`min-h-11 shrink-0 rounded-xl border px-4 font-display text-sm uppercase tracking-wider transition-all duration-200 ${d === value ? "border-flame bg-flame text-ink shadow-sm" : "border-line/80 bg-ink/30 text-muted hover:border-flame/60 hover:text-chalk"}`}
        >
          {d}
          {labels?.[d] && <span className={`ml-2 text-xs normal-case tracking-normal ${d === value ? "text-ink/80" : "text-muted"}`}>{labels[d]}</span>}
        </button>
      ))}
    </div>
  );
}
