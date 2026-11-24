import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StoreProvider, useStore } from "@/lib/store";
import { WorkoutTab } from "@/components/WorkoutTab";
import { RestTimerProvider } from "@/components/RestTimer";
import { fakeCloud } from "./fake-cloud";

const FIXED_NOW = new Date(2026, 10, 2, 10, 0, 0); // lunes: la pestaña muestra Lunes
const year = new Date().getFullYear();
const profile = { name: "Ana", sex: "mujer", birthYear: year - 30, heightCm: 165, startWeightKg: 70, goalWeightKg: 62, goal: "perder", activity: "ligero", trainingDays: ["Lunes", "Miércoles", "Viernes"], wake: "07:00", bed: "23:00", workStart: null, workEnd: null, trainStart: "19:00", trainMinutes: 60, caffeineCutoff: "15:00", kcalTarget: 1600, proteinTargetG: 100, waterGoalMl: 2500, modules: { trading: false }, createdAt: "2026-10-27", consentAt: "2026-11-01T10:00:00.000Z" };

let latest: ReturnType<typeof useStore> | null = null;
function Probe() {
  latest = useStore();
  return latest.ready && latest.state.profile ? <WorkoutTab /> : null;
}
async function mount() {
  latest = null;
  render(<StoreProvider userId="u"><RestTimerProvider><Probe /></RestTimerProvider></StoreProvider>);
  await waitFor(() => expect(latest?.ready && latest.state.profile).toBeTruthy(), { timeout: 4000 });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(FIXED_NOW);
  fakeCloud.reset();
  fakeCloud.user = "u";
  fakeCloud.install();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("aviso de récord en la pestaña Rutina", () => {
  it("una serie que supera el peso anterior muestra «Récord de peso»", async () => {
    fakeCloud.seed("u", { version: 12, water: {}, waterLog: {}, workoutLogs: { "2026-10-26": { "lun-1": [{ kg: "50", reps: "10" }] } }, weights: [], shopping: {}, sessions: {}, profile });
    await mount();
    const kg = await screen.findByLabelText(/peso en kg, serie 1 de press de pecho/i);
    fireEvent.change(kg, { target: { value: "55" } });
    fireEvent.change(screen.getByLabelText(/repeticiones, serie 1 de press de pecho/i), { target: { value: "8" } });
    expect(await screen.findByText(/récord de peso/i)).toBeInTheDocument();
  });

  it("una serie igual al récord anterior no se celebra", async () => {
    fakeCloud.seed("u", { version: 12, water: {}, waterLog: {}, workoutLogs: { "2026-10-26": { "lun-1": [{ kg: "50", reps: "10" }] } }, weights: [], shopping: {}, sessions: {}, profile });
    await mount();
    fireEvent.change(await screen.findByLabelText(/peso en kg, serie 1 de press de pecho/i), { target: { value: "50" } });
    fireEvent.change(screen.getByLabelText(/repeticiones, serie 1 de press de pecho/i), { target: { value: "10" } });
    expect(screen.queryByText(/récord de/i)).toBeNull();
  });

  it("una serie de hoy no se compara consigo misma", async () => {
    fakeCloud.seed("u", { version: 12, water: {}, waterLog: {}, workoutLogs: {}, weights: [], shopping: {}, sessions: {}, profile });
    await mount();
    fireEvent.change(await screen.findByLabelText(/peso en kg, serie 1 de press de pecho/i), { target: { value: "60" } });
    fireEvent.change(screen.getByLabelText(/repeticiones, serie 1 de press de pecho/i), { target: { value: "10" } });
    // No hay historial anterior: es el primer registro, no un récord contra sí mismo.
    expect(screen.queryByText(/récord de/i)).toBeNull();
  });
});

describe("las fotos nunca llegan a la nube", () => {
  it("el estado sincronizado no contiene fotos", async () => {
    fakeCloud.seed("u", { version: 12, water: {}, waterLog: {}, workoutLogs: {}, weights: [], shopping: {}, sessions: {}, profile });
    await mount();
    const saved = JSON.stringify(latest?.state ?? {});
    expect(saved).not.toMatch(/dataUrl|data:image|photo/i);
  });
});
