import { toMin } from "./time";

export type ReminderId = "train" | "water" | "meal" | "weigh" | "sleep";

export interface Reminder {
  id: ReminderId;
  title: string;
  body: string;
  /** Minutos desde medianoche en que se dispara. */
  at: number;
  /** Destino al tocar la notificación. */
  url: string;
}

export interface ReminderSettings {
  enabled: ReminderId[];
}

export const REMINDER_LABELS: Record<ReminderId, string> = {
  train: "Hora de entrenar",
  water: "Recordatorio de agua",
  meal: "Hora de comer",
  weigh: "Pesaje semanal",
  sleep: "Hora de dormir",
};

/** Un recordatorio es válido si su hora cae dentro del día (0–1439). */
const inDay = (m: number) => m >= 0 && m < 1440;

/**
 * Recordatorios del día a partir del perfil. Cada uno se dispara una vez al día.
 * El agua se recuerda a mitad de la jornada, y el pesaje solo los sábados (ver `shouldFire`).
 */
export function remindersFor(profile: { trainStart: string; trainMinutes: number; wake: string; bed: string }): Reminder[] {
  const train = toMin(profile.trainStart) - 30; // media hora antes
  const wake = toMin(profile.wake);
  const bed = toMin(profile.bed) - 30; // media hora antes de dormir
  const midday = (wake + Math.floor(((toMin(profile.bed) - wake + 1440) % 1440) / 2)) % 1440;
  const all: Reminder[] = [
    { id: "train", title: "Hora de entrenar", body: "Tu sesión empieza en 30 minutos. Revisa tu rutina de hoy.", at: train, url: "/panel#rutina" },
    { id: "water", title: "Bebe agua", body: "Vas a mitad de tu jornada. Un vaso ahora suma a tu meta.", at: midday, url: "/panel#dia" },
    { id: "meal", title: "Hora de comer", body: "Registra tu comida para ver cómo vas con tus metas.", at: wake + 180, url: "/panel#menu" },
    { id: "weigh", title: "Pésate hoy", body: "Pésate en ayunas para ver tu tendencia de la semana.", at: wake + 15, url: "/panel#progreso" },
    { id: "sleep", title: "Prepárate para dormir", body: "Baja la luz y deja el móvil. Descansar también es entrenar.", at: bed, url: "/panel#dia" },
  ];
  return all.filter((r) => inDay(r.at));
}

/** ¿Debe sonar este recordatorio ahora? Se dispara una sola vez por día y solo dentro de una ventana corta. */
export function shouldFire(r: Reminder, nowMinute: number, weekday: string, lastFiredDate: string | undefined, today: string, enabled: ReminderId[]): boolean {
  if (!enabled.includes(r.id)) return false;
  if (lastFiredDate === today) return false;
  if (r.id === "weigh" && weekday !== "Sábado") return false;
  const WINDOW = 10; // minutos de margen tras la hora prevista
  return nowMinute >= r.at && nowMinute < r.at + WINDOW;
}

export function parseSettings(raw: unknown): ReminderSettings {
  const all: ReminderId[] = ["train", "water", "meal", "weigh", "sleep"];
  if (typeof raw !== "object" || raw === null) return { enabled: [] };
  const list = (raw as { enabled?: unknown }).enabled;
  if (!Array.isArray(list)) return { enabled: [] };
  return { enabled: list.filter((x): x is ReminderId => all.includes(x as ReminderId)) };
}
