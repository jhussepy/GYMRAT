import type { ScheduleItem } from "./data";

export const DAY_MIN = 1440;

export function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function minutesOf(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

/** Duración en minutos, con soporte para bloques que cruzan medianoche. */
export function blockMinutes(item: ScheduleItem): number {
  const s = toMin(item.start);
  const e = toMin(item.end);
  return e > s ? e - s : e + DAY_MIN - s;
}

export function isInBlock(item: ScheduleItem, minute: number): boolean {
  const s = toMin(item.start);
  const e = toMin(item.end);
  return s < e ? minute >= s && minute < e : minute >= s || minute < e;
}

export function findBlock(schedule: ScheduleItem[], minute: number): ScheduleItem | undefined {
  return schedule.find((b) => isInBlock(b, minute));
}

export function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/** Cafeína permitida desde que despiertas hasta tu hora límite. */
export function caffeineAllowed(minute: number, wake: string, cutoff: string): boolean {
  const off = (t: number) => (t - toMin(wake) + DAY_MIN) % DAY_MIN;
  return off(minute) < off(toMin(cutoff));
}

/** Fracción (0–1) del "día biológico", que empieza al despertar. */
export function bioDayFraction(d: Date, wakeTime: string): number {
  const secs = d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
  const wake = toMin(wakeTime) * 60;
  return ((secs - wake + 86400) % 86400) / 86400;
}

export function todayISO(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}
