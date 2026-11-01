import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StoreProvider, useStore } from "@/lib/store";
import { STORAGE_KEY } from "@/lib/config";
import { cloud, fakeCloud } from "./fake-cloud";

const DAY = "2026-10-29";
type CloudState = { water?: Record<string, number>; weights?: { date: string; kg: number }[] };
const inCloud = () => (cloud["u"] ?? {}) as CloudState;

function Probe({ name }: { name: string }) {
  const { state, ready, cloudSyncStatus, addWater, saveWeight } = useStore();
  return (
    <div>
      <span data-testid={`${name}-status`}>{ready ? cloudSyncStatus : "cargando"}</span>
      <span data-testid={`${name}-water`}>{state.water[DAY] ?? 0}</span>
      <span data-testid={`${name}-weights`}>{state.weights.map((w) => w.date).join(",")}</span>
      <button onClick={() => addWater(DAY, 250)}>{name} agua</button>
      <button onClick={() => addWater(DAY, 500)}>{name} agua grande</button>
      <button onClick={() => saveWeight("2026-10-01", 90)}>{name} peso uno</button>
      <button onClick={() => saveWeight("2026-10-08", 89)}>{name} peso dos</button>
    </div>
  );
}

const device = (name: string) => render(<StoreProvider userId="u"><Probe name={name} /></StoreProvider>);
const text = (id: string) => screen.getByTestId(id).textContent;
const click = (label: string) => fireEvent.click(screen.getByRole("button", { name: label }));
const ready = async (name: string) => waitFor(() => expect(["synced", "local-only"]).toContain(text(`${name}-status`)), { timeout: 4000 });

beforeEach(() => {
  fakeCloud.reset();
  fakeCloud.user = "u";
  fakeCloud.install();
});
afterEach(() => vi.unstubAllGlobals());

describe("dos dispositivos con la app completa", () => {
  it("el dispositivo con datos viejos no borra lo que guardó el otro, y ambos terminan iguales", async () => {
    device("A");
    device("B");
    await ready("A");
    await ready("B");

    click("A peso uno");
    await waitFor(() => expect(inCloud().weights).toHaveLength(1), { timeout: 4000 });

    // B sigue abierto con datos viejos (no sabe del peso) y registra agua.
    click("B agua");
    await waitFor(() => expect(inCloud().water?.[DAY]).toBe(250), { timeout: 4000 });
    expect(inCloud().weights).toHaveLength(1); // antes esto borraba el peso de A
    expect(text("B-weights")).toBe("2026-10-01"); // y B ya ve el peso de A

    // A vuelve a la app y se actualiza.
    act(() => {
      window.dispatchEvent(new Event("focus"));
    });
    await waitFor(() => expect(text("A-water")).toBe("250"), { timeout: 4000 });
    expect(text("A-weights")).toBe(text("B-weights"));
  });

  it("el agua registrada en los dos dispositivos se suma", async () => {
    device("A");
    device("B");
    await ready("A");
    await ready("B");
    click("A agua");
    await waitFor(() => expect(inCloud().water?.[DAY]).toBe(250), { timeout: 4000 });
    click("B agua grande"); // B no sabía del vaso de A y suma 500 ml por su cuenta
    await waitFor(() => expect(inCloud().water?.[DAY]).toBe(750), { timeout: 4000 });
    await waitFor(() => expect(text("B-water")).toBe("750"));
  });

  it("sin conexión no se pierde nada y todo se sube al volver internet", async () => {
    device("A");
    await ready("A");
    click("A peso uno");
    await waitFor(() => expect(inCloud().weights).toHaveLength(1), { timeout: 4000 });

    fakeCloud.down = true;
    click("A agua");
    await waitFor(() => expect(text("A-status")).toBe("error"), { timeout: 4000 });
    expect(text("A-water")).toBe("250"); // sigue en el dispositivo
    expect(inCloud().water?.[DAY]).toBeUndefined();

    fakeCloud.down = false;
    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    await waitFor(() => expect(inCloud().water?.[DAY]).toBe(250), { timeout: 4000 });
    await waitFor(() => expect(text("A-status")).toBe("synced"));
  });

  it("al reabrir con cambios pendientes, los fusiona con lo que otro dispositivo guardó mientras tanto", async () => {
    const first = device("A");
    await ready("A");
    click("A peso uno");
    await waitFor(() => expect(inCloud().weights).toHaveLength(1), { timeout: 4000 });

    fakeCloud.down = true;
    click("A agua"); // cambio hecho sin conexión
    await waitFor(() => expect(text("A-status")).toBe("error"), { timeout: 4000 });
    first.unmount();

    // Mientras tanto, otro dispositivo guardó un peso nuevo.
    const current = inCloud();
    fakeCloud.seed("u", { ...current, weights: [...(current.weights ?? []), { date: "2026-10-08", kg: 89 }] });
    fakeCloud.down = false;

    device("A");
    await ready("A");
    expect(text("A-water")).toBe("250"); // lo hecho sin conexión sigue
    expect(text("A-weights")).toBe("2026-10-01,2026-10-08"); // y llegó lo del otro dispositivo
    await waitFor(() => expect(inCloud().water?.[DAY]).toBe(250), { timeout: 4000 });
    expect(inCloud().weights).toHaveLength(2);
  });

  it("nunca sube nada si la primera conexión con la nube falló", async () => {
    fakeCloud.down = true;
    device("A");
    await ready("A");
    expect(text("A-status")).toBe("local-only");
    click("A agua");
    await new Promise((r) => setTimeout(r, 1200));
    expect(fakeCloud.puts).toBe(0);
    expect(window.localStorage.getItem(`${STORAGE_KEY}:u`)).toContain("250"); // pero lo guarda en el dispositivo
  });
});
