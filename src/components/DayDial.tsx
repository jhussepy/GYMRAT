import { CATEGORY_COLOR, type ScheduleItem } from "@/lib/data";
import { DAY_MIN, blockMinutes, toMin } from "@/lib/time";

const SIZE = 320;
const CX = SIZE / 2;
const R = 132;
const STROKE = 26;

const polar = (deg: number, r = R) => {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CX + r * Math.sin(rad) };
};

function arc(startDeg: number, endDeg: number) {
  const a = polar(startDeg);
  const b = polar(endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
}

const startDeg = (item: ScheduleItem, wake: string) => (((toMin(item.start) - toMin(wake) + DAY_MIN) % DAY_MIN) / DAY_MIN) * 360;

interface Props {
  schedule: ScheduleItem[];
  /** Hora de despertar (HH:MM): el reloj empieza ahí. */
  wake: string;
  /** Fracción 0–1 del día biológico (null mientras carga en el cliente). */
  fraction: number | null;
  activeStart?: string;
  title: string;
  subtitle: string;
}

/** Reloj de 24 h que empieza al despertar: cada tramo del color de su categoría. */
export function DayDial({ schedule, wake, fraction, activeStart, title, subtitle }: Props) {
  const marker = fraction === null ? null : fraction * 360;
  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="mx-auto w-full max-w-[340px]" role="img" aria-label="Reloj de 24 horas con los bloques de tu día">
      <circle cx={CX} cy={CX} r={R} fill="none" className="stroke-panel" strokeWidth={STROKE + 8} />
      {schedule.map((item) => {
        const s = startDeg(item, wake);
        const len = (blockMinutes(item) / DAY_MIN) * 360;
        const active = item.start === activeStart;
        return (
          <path
            key={item.start}
            d={arc(s + 0.7, s + len - 0.7)}
            fill="none"
            style={{ stroke: CATEGORY_COLOR[item.category] }}
            strokeWidth={active ? STROKE + 8 : STROKE}
            opacity={activeStart && !active ? 0.45 : 1}
          >
            <title>{`${item.start} a ${item.end} · ${item.activity}`}</title>
          </path>
        );
      })}
      {marker !== null && (
        <g>
          <line x1={polar(marker, R - 26).x} y1={polar(marker, R - 26).y} x2={polar(marker, R + 26).x} y2={polar(marker, R + 26).y} className="stroke-chalk" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}
      <text x={CX} y={CX - 6} textAnchor="middle" className="fill-chalk font-display" fontSize="38" style={{ fontVariantNumeric: "tabular-nums" }}>
        {title}
      </text>
      <text x={CX} y={CX + 22} textAnchor="middle" className="fill-muted" fontSize="14">
        {subtitle}
      </text>
    </svg>
  );
}
