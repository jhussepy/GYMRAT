"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { useProfile, useStore } from "@/lib/store";
import { REMINDER_LABELS, remindersFor, shouldFire, type ReminderId } from "@/lib/reminders";
import { weekdayFromDate } from "@/lib/config";
import { todayISO, minutesOf } from "@/lib/time";
import { Card, SectionTitle } from "./ui";

const ALL: ReminderId[] = ["train", "water", "meal", "weigh", "sleep"];

type Permission = NotificationPermission | "unsupported";
const currentPermission = (): Permission => (typeof Notification === "undefined" ? "unsupported" : Notification.permission);

/** Muestra un recordatorio: con el service worker si está disponible, o como aviso de la página. */
export async function showReminder(title: string, body: string, tag: string, url: string) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg?.active) {
      reg.active.postMessage({ type: "show-reminder", title, body, tag, url });
      return;
    }
    new Notification(title, { body, tag, icon: "/icons/icon-192.png" });
  } catch {
    /* sin permiso o sin soporte: el aviso queda en la pantalla */
  }
}

/** Revisa cada minuto si toca algún recordatorio. Se usa mientras la app está abierta. */
export function useReminderLoop() {
  const profile = useProfile();
  const { state, markReminderFired } = useStore();
  useEffect(() => {
    const enabled = state.reminders?.enabled ?? [];
    if (enabled.length === 0) return;
    const tick = () => {
      const now = new Date();
      const today = todayISO(now);
      const weekday = weekdayFromDate(now) ?? "Domingo";
      for (const r of remindersFor(profile)) {
        if (!shouldFire(r, minutesOf(now), weekday, state.remindersFired?.[r.id], today, enabled)) continue;
        markReminderFired(r.id, today);
        void showReminder(r.title, r.body, `gymrat-${r.id}`, r.url);
      }
    };
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, state.reminders, state.remindersFired, markReminderFired]);
}

export function RemindersCard() {
  const { state, setReminder } = useStore();
  const [permission, setPermission] = useState<Permission>("default");
  const [note, setNote] = useState("");
  useEffect(() => setPermission(currentPermission()), []);

  const enabled = new Set(state.reminders?.enabled ?? []);

  const toggle = async (id: ReminderId, on: boolean) => {
    if (on && permission !== "granted" && permission !== "unsupported") {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") {
        setNote("Para recibir avisos, permite las notificaciones en tu navegador. Mientras tanto, verás los recordatorios cuando tengas GYMRAT abierto.");
      }
    }
    setReminder(id, on);
  };

  return (
    <Card>
      <SectionTitle title="Recordatorios" hint="Te avisamos de tu entreno, tu agua, tus comidas y tu sueño, a horas calculadas con tu día." />

      {permission === "unsupported" && (
        <p className="mb-4 rounded-xl border border-line/70 p-3 text-sm text-muted">Tu navegador no admite notificaciones. Los recordatorios aparecerán cuando tengas GYMRAT abierto.</p>
      )}
      {permission === "denied" && (
        <p className="mb-4 rounded-xl border border-amber/40 bg-amber/10 p-3 text-sm text-chalk">
          Las notificaciones están bloqueadas en tu navegador. Para activarlas, cambia el permiso del sitio en la configuración del navegador.
        </p>
      )}
      {note && <p role="status" className="mb-4 rounded-xl border border-line/70 p-3 text-sm text-muted">{note}</p>}

      <ul className="divide-y divide-line/60">
        {ALL.map((id) => {
          const on = enabled.has(id);
          return (
            <li key={id} className="flex items-center justify-between gap-3 py-3">
              <span className="flex items-center gap-2 text-sm">
                {on ? <Bell size={16} className="text-ok" aria-hidden /> : <BellOff size={16} className="text-muted" aria-hidden />}
                {REMINDER_LABELS[id]}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={`Recordatorio: ${REMINDER_LABELS[id]}`}
                onClick={() => void toggle(id, !on)}
                className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 ${on ? "bg-flame" : "bg-line"}`}
              >
                <span className={`inline-block h-5 w-5 rounded-full bg-white transition-transform duration-200 ${on ? "translate-x-6" : "translate-x-1"}`} aria-hidden />
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-muted">Las horas se calculan con tu hora de despertar, de dormir y de entreno. Puedes cambiarlas en Editar perfil.</p>
    </Card>
  );
}
