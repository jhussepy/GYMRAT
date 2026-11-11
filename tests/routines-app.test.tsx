import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** Lunes 2 de noviembre de 2026: la pestaña muestra siempre el Lunes, así las pruebas no dependen del día real. */
const FIXED_NOW = new Date(2026, 10, 2, 10, 0, 0);
import { StoreProvider, useStore } from "@/lib/store";
import { WorkoutTab } from "@/components/WorkoutTab";
import { RestTimerProvider } from "@/components/RestTimer";
import { STORAGE_KEY } from "@/lib/config";
import { fakeCloud } from "./fake-cloud";

vi.mock("next/link", () => ({ default: ({ href, children, ...r }: { href: string; children: React.ReactNode }) => <a href={href} {...r}>{children}</a> }));


const year = new Date().getFullYear();
const profile = {
  name: "Ana", sex: "mujer", birthYear: year - 30, heightCm: 165, startWeightKg: 70, goalWeightKg: 62, goal: "perder", activity: "ligero",
  trainingDays: ["Lunes", "Miércoles", "Viernes"], wake: "07:00", bed: "23:00", workStart: null, workEnd: null, trainStart: "19:00", trainMinutes: 60,
  caffeineCutoff: "15:00", kcalTarget: 1600, proteinTargetG: 100, waterGoalMl: 2500, modules: { trading: false }, createdAt: "2026-10-27", consentAt: "2026-11-01T10:00:00.000Z",
};

/** Muestra la pestaña Rutina y deja leer el estado para comprobarlo. Como en la app, solo se monta cuando hay perfil. */
let latest: ReturnType<typeof useStore> | null = null;
function Probe() {
  latest = useStore();
  if (!latest.ready || !latest.state.profile) return null;
  return <WorkoutTab />;
}
/** Siembra la nube: el perfil se carga desde allí al abrir la app, igual que en producción. */
const seed = (extra: Record<string, unknown> = {}) => {
  fakeCloud.seed("u", { version: 11, water: {}, waterLog: {}, workoutLogs: {}, weights: [], shopping: {}, sessions: {}, profile, ...extra });
};
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

describe("modo en casa", () => {
  it("el interruptor cambia el ejercicio que se muestra", async () => {
    seed();
    await mount();
    const sw = await screen.findByRole("switch", { name: /modo en casa/i });
    expect(sw).toHaveAttribute("aria-checked", "false");
    expect(screen.queryByText(/modo en casa ·/i)).toBeNull();
    fireEvent.click(sw);
    await waitFor(() => expect(latest?.state.homeMode).toBe(true));
    expect(screen.getByRole("switch", { name: /modo en casa/i })).toHaveAttribute("aria-checked", "true");
  });

  it("el modo en casa se guarda en la cuenta", async () => {
    seed();
    await mount();
    fireEvent.click(await screen.findByRole("switch", { name: /modo en casa/i }));
    await waitFor(() => expect(fakeCloud.state("u")).toMatchObject({ homeMode: true }), { timeout: 4000 });
  });
});

describe("editar rutina", () => {
  it("abre el editor con los ejercicios actuales", async () => {
    seed();
    await mount();
    fireEvent.click(await screen.findByRole("button", { name: /editar rutina/i }));
    expect(await screen.findByRole("heading", { name: /editar rutina/i })).toBeInTheDocument();
    expect(screen.getAllByRole("textbox", { name: /^nombre$/i }).length).toBeGreaterThan(0);
  });

  it("guardar una rutina cambia la que se muestra y conserva el resto de la plantilla", async () => {
    seed();
    await mount();
    fireEvent.click(await screen.findByRole("button", { name: /editar rutina/i }));
    const names = screen.getAllByRole("textbox", { name: /^nombre$/i });
    fireEvent.change(names[0], { target: { value: "Press de banca" } });
    fireEvent.click(screen.getByRole("button", { name: /guardar rutina/i }));
    await waitFor(() => expect(latest?.state.routines?.Lunes?.exercises[0].name).toBe("Press de banca"), { timeout: 4000 });
    expect(latest?.state.routines?.Lunes?.exercises.length).toBe(5);
  });

  it("no deja guardar un ejercicio sin nombre y avisa", async () => {
    seed();
    await mount();
    fireEvent.click(await screen.findByRole("button", { name: /editar rutina/i }));
    fireEvent.change(screen.getAllByRole("textbox", { name: /^nombre$/i })[0], { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: /guardar rutina/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/necesita nombre/i);
    expect(latest?.state.routines).toBeUndefined();
  });

  it("añadir un ejercicio le da un id nuevo que no choca con los existentes", async () => {
    seed();
    await mount();
    fireEvent.click(await screen.findByRole("button", { name: /editar rutina/i }));
    fireEvent.click(screen.getByRole("button", { name: /añadir ejercicio/i }));
    const names = screen.getAllByRole("textbox", { name: /^nombre$/i });
    fireEvent.change(names[names.length - 1], { target: { value: "Curl martillo" } });
    fireEvent.click(screen.getByRole("button", { name: /guardar rutina/i }));
    await waitFor(() => expect(latest?.state.routines?.Lunes?.exercises).toHaveLength(6), { timeout: 4000 });
    const ids = latest!.state.routines!.Lunes!.exercises.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("restaurar devuelve la rutina original", async () => {
    seed({ routines: { Lunes: { day: "Lunes", focus: "Mi rutina", exercises: [{ id: "x", name: "Solo uno", type: "strength", sets: 3, reps: "10", alt: "" }] } } });
    await mount();
    fireEvent.click(await screen.findByRole("button", { name: /editar rutina/i }));
    fireEvent.click(screen.getByRole("button", { name: /restaurar la rutina original/i }));
    await waitFor(() => expect(latest?.state.routines).toBeUndefined(), { timeout: 4000 });
  });

  it("el historial de series se conserva aunque se edite la rutina", async () => {
    seed({ workoutLogs: { "2026-10-20": { "lun-1": [{ kg: "60", reps: "10" }] } } });
    await mount();
    fireEvent.click(await screen.findByRole("button", { name: /editar rutina/i }));
    fireEvent.change(screen.getAllByRole("textbox", { name: /^nombre$/i })[0], { target: { value: "Press renombrado" } });
    fireEvent.click(screen.getByRole("button", { name: /guardar rutina/i }));
    await waitFor(() => expect(latest?.state.routines?.Lunes).toBeDefined(), { timeout: 4000 });
    // El registro sigue apuntando al mismo id: el historial no se pierde.
    expect(latest?.state.workoutLogs["2026-10-20"]?.["lun-1"]).toEqual([{ kg: "60", reps: "10" }]);
  });
});

describe("guardado y compatibilidad", () => {
  it("la rutina personalizada se sube a la nube con versión 11", async () => {
    seed();
    await mount();
    fireEvent.click(await screen.findByRole("button", { name: /editar rutina/i }));
    fireEvent.click(screen.getByRole("button", { name: /guardar rutina/i }));
    await waitFor(() => {
      const cloud = fakeCloud.state("u") as { version?: number; routines?: Record<string, unknown> } | undefined;
      expect(cloud?.version).toBe(11);
      expect(cloud?.routines?.Lunes).toBeDefined();
    }, { timeout: 4000 });
  });
});

describe("el editor es accesible", () => {
  it("cada campo tiene nombre accesible y el editor se puede cerrar con el teclado", async () => {
    seed();
    await mount();
    fireEvent.click(await screen.findByRole("button", { name: /editar rutina/i }));
    const dialog = screen.getByRole("heading", { name: /editar rutina/i }).closest("section") as HTMLElement;
    expect(within(dialog).getAllByRole("spinbutton").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /cerrar editor/i }));
    expect(await screen.findByRole("button", { name: /editar rutina/i })).toBeInTheDocument();
  });
});
