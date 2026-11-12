import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/** Extrae la función isStatic del service worker para probarla con URLs reales. */
const source = readFileSync("public/sw.js", "utf8");
const fn = source.slice(source.indexOf("function isStatic"), source.indexOf("self.addEventListener(\"fetch\""));
// eslint-disable-next-line @typescript-eslint/no-implied-eval
const isStatic = new Function("self", `${fn}; return isStatic;`)({ location: { origin: "https://gymrat.test" } }) as (u: URL) => boolean;
const u = (path: string) => new URL(`https://gymrat.test${path}`);

describe("el service worker solo guarda archivos sin datos personales", () => {
  it("guarda el código de la app y los íconos", () => {
    expect(isStatic(u("/_next/static/chunks/main.js"))).toBe(true);
    expect(isStatic(u("/icons/icon-192.png"))).toBe(true);
    expect(isStatic(u("/images/gymrat-hero.jpg"))).toBe(true);
    expect(isStatic(u("/manifest.webmanifest"))).toBe(true);
  });
  it("NUNCA guarda páginas privadas ni la API", () => {
    expect(isStatic(u("/panel"))).toBe(false);
    expect(isStatic(u("/cuenta"))).toBe(false);
    expect(isStatic(u("/api/user-state"))).toBe(false);
    expect(isStatic(u("/api/account"))).toBe(false);
    expect(isStatic(u("/"))).toBe(false);
  });
  it("no guarda nada de otros sitios", () => {
    expect(isStatic(new URL("https://otro-sitio.com/_next/static/x.js"))).toBe(false);
  });
});
