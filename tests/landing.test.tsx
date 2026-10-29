import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import HomePage from "@/app/page";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("portada", () => {
  it("usa tu imagen de marca desde el propio proyecto, con texto alternativo", () => {
    const { container } = render(<HomePage />);
    const hero = container.querySelector("#inicio img") as HTMLImageElement;
    expect(hero).toBeTruthy();
    expect(decodeURIComponent(hero.getAttribute("src") ?? "")).toContain("/images/gymrat-hero.jpg");
    expect(hero.alt).toMatch(/la fuerza viene de Dios/i);
    expect(hero.getAttribute("width")).toBe("1554");
  });

  it("no depende de servidores externos (imágenes, scripts ni tipografías)", () => {
    const { container } = render(<HomePage />);
    const html = container.innerHTML;
    expect(html).not.toMatch(/unsplash|googleapis|gstatic/i);
    for (const el of container.querySelectorAll("img, script, link")) {
      const url = el.getAttribute("src") ?? el.getAttribute("href") ?? "";
      expect(url).not.toMatch(/^https?:\/\//);
    }
  });

  it("todas las anclas del menú y del pie apuntan a secciones que existen", () => {
    const { container } = render(<HomePage />);
    const anchors = [...container.querySelectorAll('a[href^="#"]')].map((a) => a.getAttribute("href") as string);
    expect(anchors.length).toBeGreaterThan(5);
    for (const href of anchors) expect(container.querySelector(href), `falta la sección ${href}`).not.toBeNull();
  });

  it("no promete planes, pruebas gratuitas ni comunidad que no existen, y no finge un carrusel", () => {
    const { container } = render(<HomePage />);
    const text = container.textContent ?? "";
    for (const claim of ["Prueba gratuita", "7 días", "Planes", "Comunidad", "01 / 04"]) expect(text).not.toContain(claim);
  });

  it("tiene un único h1 con el nombre de la marca y los botones principales llevan al registro", () => {
    render(<HomePage />);
    const h1 = screen.getAllByRole("heading", { level: 1 });
    expect(h1).toHaveLength(1);
    expect(h1[0]).toHaveTextContent(/GYMRAT/);
    expect(screen.getByRole("link", { name: /empezar ahora/i })).toHaveAttribute("href", "/crear-cuenta");
    expect(screen.getByRole("link", { name: /ya tengo cuenta/i })).toHaveAttribute("href", "/iniciar-sesion");
  });

  it("muestra el lema de la marca y las preguntas frecuentes", () => {
    render(<HomePage />);
    expect(screen.getAllByText(/la fuerza viene/i).length).toBeGreaterThan(0);
    const faq = screen.getByRole("heading", { name: /lo que más preguntan/i }).closest("section") as HTMLElement;
    expect(within(faq).getAllByText(/\?$/).length).toBeGreaterThanOrEqual(5);
  });
});

describe("menú móvil", () => {
  it("se abre, se anuncia como expandido y se cierra con Escape", () => {
    render(<HomePage />);
    const button = screen.getByRole("button", { name: /abrir menú/i });
    expect(button).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(button);
    expect(screen.getByRole("button", { name: /cerrar menú/i })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("navigation", { name: /menú móvil/i })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("navigation", { name: /menú móvil/i })).toBeNull();
  });
});

describe("botones de acceso según la sesión", () => {
  async function renderWithClerk(signedIn: boolean) {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_Y2xlcmsuZXhhbXBsZS5jb20k");
    vi.doMock("@clerk/nextjs", () => ({ useAuth: () => ({ isLoaded: true, isSignedIn: signedIn }) }));
    const { AuthActions } = await import("@/components/landing/AuthActions");
    return render(<AuthActions layout="header" />);
  }

  it("a quien ya inició sesión le ofrece ir a su panel", async () => {
    await renderWithClerk(true);
    expect(screen.getByRole("link", { name: /ir a mi panel/i })).toHaveAttribute("href", "/panel");
    expect(screen.queryByRole("link", { name: /iniciar sesión/i })).toBeNull();
  });

  it("a quien no tiene sesión le ofrece iniciar sesión o crear cuenta", async () => {
    await renderWithClerk(false);
    expect(screen.getByRole("link", { name: /iniciar sesión/i })).toHaveAttribute("href", "/iniciar-sesion");
    expect(screen.getByRole("link", { name: /crear cuenta/i })).toHaveAttribute("href", "/crear-cuenta");
  });
});
