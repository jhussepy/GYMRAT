import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "@/components/App";
import HomePage from "@/app/page";
import PrivacyPage from "@/app/privacidad/page";
import TermsPage from "@/app/terminos/page";
import { STORAGE_KEY } from "@/lib/config";
import { cloud, fakeCloud } from "./fake-cloud";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const year = new Date().getFullYear();
const profile = (extra: Record<string, unknown> = {}) => ({
  name: "Ana", sex: "mujer", birthYear: year - 30, heightCm: 165, startWeightKg: 70, goalWeightKg: 62, goal: "perder", activity: "ligero",
  trainingDays: ["Lunes", "Miércoles", "Viernes"], wake: "07:00", bed: "23:00", workStart: "09:00", workEnd: "18:00", trainStart: "19:00", trainMinutes: 60,
  caffeineCutoff: "15:00", kcalTarget: 1600, proteinTargetG: 100, waterGoalMl: 2500, modules: { trading: false }, createdAt: "2026-10-27", ...extra,
});
const stateWith = (p: Record<string, unknown> | undefined) => ({ version: 9, water: {}, workoutLogs: {}, weights: [], shopping: {}, sessions: {}, ...(p ? { profile: p } : {}) });

beforeEach(() => {
  fakeCloud.reset();
  fakeCloud.install();
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function openApp(userId: string) {
  fakeCloud.user = userId;
  render(<App userId={userId} />);
}
const goToProgress = async () => {
  await waitFor(() => expect(screen.getAllByRole("button", { name: /progreso/i }).length).toBeGreaterThan(0), { timeout: 4000 });
  fireEvent.click(screen.getAllByRole("button", { name: /progreso/i })[0]);
};

describe("consentimiento", () => {
  it("el registro no se completa sin aceptar el tratamiento de datos de salud", async () => {
    await openApp("user_new");
    await screen.findByRole("heading", { name: /sobre ti/i }, { timeout: 4000 });
    fireEvent.click(screen.getByRole("radio", { name: /hombre/i }));
    fireEvent.change(screen.getByLabelText(/año de nacimiento/i), { target: { value: String(year - 30) } });
    fireEvent.change(screen.getByLabelText(/altura/i), { target: { value: "175" } });
    fireEvent.change(screen.getByLabelText(/peso actual/i), { target: { value: "90" } });
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
    await screen.findByRole("heading", { name: /tu objetivo/i });
    fireEvent.change(screen.getByLabelText(/peso meta/i), { target: { value: "78" } });
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
    await screen.findByRole("heading", { name: /tu día/i });
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
    await screen.findByRole("heading", { name: /tus metas diarias/i });

    fireEvent.click(screen.getByRole("button", { name: /empezar/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/debes aceptar/i);
    expect(window.localStorage.getItem(`${STORAGE_KEY}:user_new`)).not.toContain('"profile"');

    fireEvent.click(screen.getByRole("checkbox", { name: /entiendo y acepto/i }));
    fireEvent.click(screen.getByRole("button", { name: /empezar/i }));
    await waitFor(() => {
      const saved = JSON.parse(window.localStorage.getItem(`${STORAGE_KEY}:user_new`) ?? "{}") as { profile?: { consentAt?: string } };
      expect(Date.parse(saved.profile?.consentAt ?? "")).not.toBeNaN();
    });
  });

  it("una cuenta anterior sin consentimiento lo ve una vez antes de entrar", async () => {
    cloud["user_old"] = stateWith(profile());
    await openApp("user_old");
    await screen.findByRole("heading", { name: /antes de continuar/i }, { timeout: 4000 });
    const continuar = screen.getByRole("button", { name: /^continuar$/i });
    expect(continuar).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: /entiendo y acepto/i }));
    fireEvent.click(continuar);
    await waitFor(() => expect(screen.getAllByRole("button", { name: /mi día/i }).length).toBeGreaterThan(0));
    await waitFor(() => expect((cloud["user_old"] as { profile?: { consentAt?: string } }).profile?.consentAt).toBeTruthy(), { timeout: 4000 });
  });

  it("quien ya aceptó no vuelve a ver la pantalla", async () => {
    cloud["user_ok"] = stateWith(profile({ consentAt: "2026-11-01T10:00:00.000Z" }));
    await openApp("user_ok");
    await waitFor(() => expect(screen.getAllByRole("button", { name: /mi día/i }).length).toBeGreaterThan(0), { timeout: 4000 });
    expect(screen.queryByRole("heading", { name: /antes de continuar/i })).toBeNull();
  });
});

describe("borrar mis datos", () => {
  async function openPrivacyCard() {
    cloud["user_p"] = stateWith(profile({ consentAt: "2026-11-01T10:00:00.000Z" }));
    await openApp("user_p");
    await goToProgress();
    await screen.findByRole("heading", { name: /privacidad y datos/i });
  }

  it("el botón definitivo solo se habilita al escribir BORRAR", async () => {
    await openPrivacyCard();
    fireEvent.click(screen.getByRole("button", { name: /borrar mis datos…/i }));
    const confirm = screen.getByRole("button", { name: /borrar mis datos definitivamente/i });
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/escribe/i), { target: { value: "borrar" } });
    expect(confirm).toBeEnabled();
  });

  it("borra la nube y este dispositivo, y la app vuelve al registro", async () => {
    await openPrivacyCard();
    fireEvent.click(screen.getByRole("button", { name: /borrar mis datos…/i }));
    fireEvent.change(screen.getByLabelText(/escribe/i), { target: { value: "BORRAR" } });
    fireEvent.click(screen.getByRole("button", { name: /borrar mis datos definitivamente/i }));
    await screen.findByRole("heading", { name: /sobre ti/i }, { timeout: 4000 });
    expect(fakeCloud.deletes).toBe(1);
    expect(cloud["user_p"]).toBeUndefined();
    expect(window.localStorage.getItem(`${STORAGE_KEY}:user_p`)).not.toContain('"profile"');
  });

  it("si la nube no responde, avisa y no borra nada local", async () => {
    await openPrivacyCard();
    fireEvent.click(screen.getByRole("button", { name: /borrar mis datos…/i }));
    fireEvent.change(screen.getByLabelText(/escribe/i), { target: { value: "BORRAR" } });
    fakeCloud.down = true;
    fireEvent.click(screen.getByRole("button", { name: /borrar mis datos definitivamente/i }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(window.localStorage.getItem(`${STORAGE_KEY}:user_p`)).toContain('"profile"');
  });
});

describe("eliminar la cuenta", () => {
  async function openWithClerk(signOut: () => Promise<void>) {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_Y2xlcmsuZXhhbXBsZS5jb20k");
    vi.doMock("@clerk/nextjs", () => ({ useClerk: () => ({ signOut }), useAuth: () => ({ isLoaded: true, isSignedIn: true }) }));
    const { App: FreshApp } = await import("@/components/App");
    cloud["user_d"] = stateWith(profile({ consentAt: "2026-11-01T10:00:00.000Z" }));
    fakeCloud.user = "user_d";
    render(<FreshApp userId="user_d" />);
    await waitFor(() => expect(screen.getAllByRole("button", { name: /progreso/i }).length).toBeGreaterThan(0), { timeout: 4000 });
    fireEvent.click(screen.getAllByRole("button", { name: /progreso/i })[0]);
    await screen.findByRole("heading", { name: /privacidad y datos/i });
    fireEvent.click(screen.getByRole("button", { name: /eliminar mi cuenta…/i }));
  }

  it("exige escribir ELIMINAR, borra todo y cierra la sesión", async () => {
    const signOut = vi.fn(async () => {});
    await openWithClerk(signOut);
    const confirm = screen.getByRole("button", { name: /eliminar cuenta definitivamente/i });
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/escribe/i), { target: { value: "ELIMINAR" } });
    fireEvent.click(confirm);
    await waitFor(() => expect(signOut).toHaveBeenCalledWith({ redirectUrl: "/?cuenta=eliminada" }), { timeout: 4000 });
    expect(fakeCloud.accountDeleted).toBe(true);
    expect(window.localStorage.getItem(`${STORAGE_KEY}:user_d`)).toBeNull();
  });

  it("si la cuenta no se pudo eliminar, muestra el motivo y NO cierra la sesión", async () => {
    const signOut = vi.fn(async () => {});
    fakeCloud.accountFails = true;
    await openWithClerk(signOut);
    fireEvent.change(screen.getByLabelText(/escribe/i), { target: { value: "ELIMINAR" } });
    fireEvent.click(screen.getByRole("button", { name: /eliminar cuenta definitivamente/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/no pudo eliminarse/i);
    expect(signOut).not.toHaveBeenCalled();
  });
});

describe("páginas legales y enlaces", () => {
  it("la política dice qué datos, quién los trata y cómo ejercer los derechos", () => {
    const { container } = render(<PrivacyPage />);
    const text = container.textContent ?? "";
    for (const must of ["Clerk", "Supabase", "Vercel", "consentimiento explícito", "18 años", "Privacidad y datos", "no vendemos"]) expect(text.toLowerCase()).toContain(must.toLowerCase());
    expect(screen.getByRole("heading", { level: 1, name: /política de privacidad/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /términos de uso/i })).toHaveAttribute("href", "/terminos");
  });

  it("los términos aclaran que no es consejo médico", () => {
    const { container } = render(<TermsPage />);
    expect(container.textContent).toMatch(/no sustituye el consejo de un médico/i);
    expect(screen.getByRole("link", { name: /política de privacidad/i })).toHaveAttribute("href", "/privacidad");
  });

  it("sin correo configurado no muestra un contacto falso", () => {
    const { container } = render(<PrivacyPage />);
    expect(container.querySelector('a[href^="mailto:"]')).toBeNull();
    expect(container.textContent).not.toMatch(/\[|\]/);
  });

  it("la portada enlaza a ambos documentos", () => {
    render(<HomePage />);
    expect(screen.getByRole("link", { name: /política de privacidad/i })).toHaveAttribute("href", "/privacidad");
    expect(screen.getByRole("link", { name: /términos de uso/i })).toHaveAttribute("href", "/terminos");
  });

  it("tras eliminar la cuenta, la portada confirma que todo se borró", async () => {
    window.history.replaceState(null, "", "/?cuenta=eliminada");
    render(<HomePage />);
    expect(await screen.findByRole("status")).toHaveTextContent(/se eliminaron correctamente/i);
  });
});
