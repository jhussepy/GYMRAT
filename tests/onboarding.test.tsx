import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/components/App";
import { STORAGE_KEY } from "@/lib/config";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

/** Servidor simulado: una fila por usuario, igual que la tabla real de Supabase. */
const cloud: Record<string, unknown> = {};
let currentUser = "user_a";

beforeEach(() => {
  for (const key of Object.keys(cloud)) delete cloud[key];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === "PUT") {
        cloud[currentUser] = (JSON.parse(String(init.body)) as { state: unknown }).state;
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }
      return new Response(JSON.stringify({ userId: currentUser, state: cloud[currentUser] ?? null }), { status: 200 });
    }),
  );
});

afterEach(() => vi.unstubAllGlobals());

const year = new Date().getFullYear();
const field = (label: RegExp) => screen.getByLabelText(label) as HTMLInputElement;
const type = (label: RegExp, value: string) => fireEvent.change(field(label), { target: { value } });
const next = () => fireEvent.click(screen.getByRole("button", { name: /continuar/i }));

async function mount(userId: string) {
  currentUser = userId;
  const view = render(<App userId={userId} />);
  await screen.findByRole("heading", { name: /sobre ti/i }, { timeout: 4000 });
  return view;
}

function fillStep1(over: { birth?: string; weight?: string; height?: string } = {}) {
  fireEvent.click(screen.getByRole("radio", { name: /hombre/i }));
  type(/año de nacimiento/i, over.birth ?? String(year - 30));
  type(/altura/i, over.height ?? "175");
  type(/peso actual/i, over.weight ?? "90");
}

async function completeOnboarding(opts: { trading?: boolean } = {}) {
  fillStep1();
  next();
  await screen.findByRole("heading", { name: /tu objetivo/i });
  type(/peso meta/i, "78");
  next();
  await screen.findByRole("heading", { name: /tu día/i });
  next();
  await screen.findByRole("heading", { name: /tus metas diarias/i });
  if (opts.trading) fireEvent.click(screen.getByRole("checkbox", { name: /trading/i }));
  fireEvent.click(screen.getByRole("button", { name: /empezar/i }));
}

describe("registro de un usuario nuevo", () => {
  it("muestra el asistente, no los datos de otra persona", async () => {
    await mount("user_new");
    const html = document.body.textContent ?? "";
    for (const personal of ["Smart Fit", "97.7", "02:30", "Vodafone", "Grasa visceral", "22/10/2026"]) expect(html).not.toContain(personal);
    expect(screen.queryByRole("button", { name: /mi día/i })).toBeNull();
  });

  it("rechaza a menores de edad en el primer paso", async () => {
    await mount("user_minor");
    fillStep1({ birth: String(year - 16) });
    next();
    expect(await screen.findByRole("alert")).toHaveTextContent(/18 años/);
    expect(screen.getByRole("heading", { name: /sobre ti/i })).toBeInTheDocument();
  });

  it("valida la altura y el peso", async () => {
    await mount("user_bad");
    fillStep1({ height: "20", weight: "5" });
    next();
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/altura/i);
    expect(alert).toHaveTextContent(/peso/i);
  });

  it("completa los 4 pasos, calcula metas y entra a la app con SUS datos", async () => {
    await mount("user_a");
    await completeOnboarding();

    // La app principal aparece con el nombre de sus secciones.
    await screen.findByRole("heading", { name: /^hola|gymrat/i, level: 2 }).catch(() => undefined);
    await waitFor(() => expect(screen.getAllByRole("button", { name: /mi día/i }).length).toBeGreaterThan(0));

    // Guardó el perfil con las metas calculadas y su peso, no el de otra persona.
    const saved = JSON.parse(window.localStorage.getItem(`${STORAGE_KEY}:user_a`) ?? "{}") as { profile?: Record<string, unknown> };
    expect(saved.profile).toMatchObject({ sex: "hombre", heightCm: 175, startWeightKg: 90, goalWeightKg: 78, goal: "perder" });
    expect(Number(saved.profile?.kcalTarget)).toBeGreaterThanOrEqual(1500);
    expect(document.body.textContent).not.toContain("Smart Fit");

    // El módulo de trading está oculto por defecto.
    expect(screen.queryByRole("button", { name: /trading/i })).toBeNull();
  });

  it("activa el módulo de trading solo si el usuario lo pide", async () => {
    await mount("user_trader");
    await completeOnboarding({ trading: true });
    await waitFor(() => expect(screen.getAllByRole("button", { name: /trading/i }).length).toBeGreaterThan(0));
  });
});

describe("aislamiento entre cuentas", () => {
  it("otra cuenta en el mismo navegador empieza desde cero", async () => {
    const first = await mount("user_a");
    await completeOnboarding();
    await waitFor(() => expect(screen.getAllByRole("button", { name: /mi día/i }).length).toBeGreaterThan(0));
    first.unmount();

    // Mismo navegador (mismo localStorage), otra cuenta de Clerk.
    await mount("user_b");
    expect(screen.getByRole("heading", { name: /sobre ti/i })).toBeInTheDocument();
    // Lo único que guarda la cuenta B es un estado vacío y sin perfil: nada de la cuenta A.
    const stored = window.localStorage.getItem(`${STORAGE_KEY}:user_b`);
    const state = stored ? (JSON.parse(stored) as { profile?: unknown; weights?: unknown[] }) : {};
    expect(state.profile).toBeUndefined();
    expect(state.weights ?? []).toHaveLength(0);
    expect(window.localStorage.getItem(`${STORAGE_KEY}:user_a`)).toContain('"profile"');
  });

  it("un usuario antiguo sin perfil conserva su historial al completar el registro", async () => {
    cloud["user_old"] = {
      version: 8,
      water: {},
      workoutLogs: {},
      weights: [
        { date: "2026-10-01", kg: 95 },
        { date: "2026-10-15", kg: 93.5 },
      ],
      shopping: {},
      sessions: {},
    };
    await mount("user_old");
    await completeOnboarding();
    await waitFor(() => expect(screen.getAllByRole("button", { name: /mi día/i }).length).toBeGreaterThan(0));
    const saved = JSON.parse(window.localStorage.getItem(`${STORAGE_KEY}:user_old`) ?? "{}") as { weights?: unknown[]; profile?: unknown };
    expect(saved.weights).toHaveLength(2);
    expect(saved.profile).toBeTruthy();
  });

  it("el perfil se sincroniza con la nube", async () => {
    await mount("user_cloud");
    await completeOnboarding();
    await waitFor(() => expect(cloud["user_cloud"]).toBeTruthy(), { timeout: 4000 });
    expect((cloud["user_cloud"] as { profile?: { goal?: string } }).profile?.goal).toBe("perder");
  });

  it("al volver a entrar con la misma cuenta no se repite el registro", async () => {
    const first = await mount("user_back");
    await completeOnboarding();
    await waitFor(() => expect(cloud["user_back"]).toBeTruthy(), { timeout: 4000 });
    first.unmount();
    window.localStorage.clear();

    currentUser = "user_back";
    render(<App userId="user_back" />);
    await waitFor(() => expect(screen.getAllByRole("button", { name: /mi día/i }).length).toBeGreaterThan(0), { timeout: 4000 });
    expect(screen.queryByRole("heading", { name: /sobre ti/i })).toBeNull();
  });
});

describe("edición del perfil", () => {
  it("permite cambiar el objetivo desde Progreso", async () => {
    await mount("user_edit");
    await completeOnboarding();
    await waitFor(() => expect(screen.getAllByRole("button", { name: /progreso/i }).length).toBeGreaterThan(0));
    fireEvent.click(screen.getAllByRole("button", { name: /progreso/i })[0]);
    fireEvent.click(await screen.findByRole("button", { name: /editar perfil/i }));
    await screen.findByRole("heading", { name: /sobre ti/i });
    next();
    await screen.findByRole("heading", { name: /tu objetivo/i });
    fireEvent.click(screen.getByRole("radio", { name: /mantener mi peso/i }));
    next();
    await screen.findByRole("heading", { name: /tu día/i });
    next();
    await screen.findByRole("heading", { name: /tus metas diarias/i });
    fireEvent.click(screen.getByRole("button", { name: /guardar cambios/i }));
    await waitFor(() => {
      const saved = JSON.parse(window.localStorage.getItem(`${STORAGE_KEY}:user_edit`) ?? "{}") as { profile?: { goal?: string; goalWeightKg?: number; startWeightKg?: number } };
      expect(saved.profile?.goal).toBe("mantener");
      expect(saved.profile?.goalWeightKg).toBe(saved.profile?.startWeightKg);
    });
    expect(within(document.body).queryByRole("heading", { name: /editar mi perfil/i })).toBeNull();
  });
});
