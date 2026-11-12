import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StoreProvider, useStore } from "@/lib/store";
import { RemindersCard } from "@/components/RemindersCard";
import { fakeCloud } from "./fake-cloud";

const year = new Date().getFullYear();
const profile = { name: "Ana", sex: "mujer", birthYear: year - 30, heightCm: 165, startWeightKg: 70, goalWeightKg: 62, goal: "perder", activity: "ligero", trainingDays: ["Lunes", "Miércoles", "Viernes"], wake: "07:00", bed: "23:00", workStart: null, workEnd: null, trainStart: "19:00", trainMinutes: 60, caffeineCutoff: "15:00", kcalTarget: 1600, proteinTargetG: 100, waterGoalMl: 2500, modules: { trading: false }, createdAt: "2026-10-27", consentAt: "2026-11-01T10:00:00.000Z" };

let latest: ReturnType<typeof useStore> | null = null;
function Probe() {
  latest = useStore();
  return latest.ready && latest.state.profile ? <RemindersCard /> : null;
}
async function mount() {
  latest = null;
  render(<StoreProvider userId="u"><Probe /></StoreProvider>);
  await waitFor(() => expect(latest?.ready && latest.state.profile).toBeTruthy(), { timeout: 4000 });
}

beforeEach(() => {
  fakeCloud.reset();
  fakeCloud.user = "u";
  fakeCloud.install();
  fakeCloud.seed("u", { version: 12, water: {}, waterLog: {}, workoutLogs: {}, weights: [], shopping: {}, sessions: {}, profile });
  // Notificaciones "concedidas" en el navegador simulado
  vi.stubGlobal("Notification", Object.assign(vi.fn(), { permission: "granted", requestPermission: vi.fn(async () => "granted") }));
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("activar y desactivar recordatorios", () => {
  it("cada recordatorio empieza desactivado", async () => {
    await mount();
    for (const sw of screen.getAllByRole("switch")) expect(sw).toHaveAttribute("aria-checked", "false");
  });

  it("activar uno lo guarda en la cuenta", async () => {
    await mount();
    fireEvent.click(screen.getByRole("switch", { name: /recordatorio: hora de entrenar/i }));
    await waitFor(() => expect(latest?.state.reminders?.enabled).toEqual(["train"]), { timeout: 4000 });
    await waitFor(() => expect(fakeCloud.state("u")).toMatchObject({ reminders: { enabled: ["train"] } }), { timeout: 4000 });
  });

  it("desactivar el último deja los ajustes vacíos", async () => {
    await mount();
    const sw = screen.getByRole("switch", { name: /recordatorio: hora de entrenar/i });
    fireEvent.click(sw);
    await waitFor(() => expect(latest?.state.reminders).toBeDefined(), { timeout: 4000 });
    fireEvent.click(sw);
    await waitFor(() => expect(latest?.state.reminders).toBeUndefined(), { timeout: 4000 });
  });

  it("pide permiso la primera vez que se activa algo", async () => {
    // Navegador sin decidir todavía: debe preguntar. (Con permiso ya concedido no pregunta; eso lo cubre el resto de pruebas.)
    vi.stubGlobal("Notification", Object.assign(vi.fn(), { permission: "default", requestPermission: vi.fn(async () => "granted") }));
    await mount();
    fireEvent.click(screen.getByRole("switch", { name: /recordatorio: recordatorio de agua/i }));
    await waitFor(() => expect(Notification.requestPermission).toHaveBeenCalled());
  });

  it("si el permiso se niega, lo explica y el recordatorio queda activo dentro de la app", async () => {
    vi.stubGlobal("Notification", Object.assign(vi.fn(), { permission: "default", requestPermission: vi.fn(async () => "denied") }));
    await mount();
    fireEvent.click(screen.getByRole("switch", { name: /recordatorio: recordatorio de agua/i }));
    expect(await screen.findByRole("status")).toHaveTextContent(/permite las notificaciones/i);
    await waitFor(() => expect(latest?.state.reminders?.enabled).toEqual(["water"]), { timeout: 4000 });
  });
});

describe("accesibilidad", () => {
  it("cada interruptor tiene nombre y estado", async () => {
    await mount();
    const names = screen.getAllByRole("switch").map((s) => s.getAttribute("aria-label"));
    expect(names).toHaveLength(5);
    expect(new Set(names).size).toBe(5);
  });
});
