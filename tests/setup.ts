import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Las pruebas del servidor corren en Node (sin `window`); las de interfaz, en un navegador simulado.
if (typeof window !== "undefined") {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    window.history.replaceState(null, "", "/");
  });

  // jsdom no implementa estas APIs del navegador.
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  window.matchMedia = ((query: string) => ({ matches: false, media: query, onchange: null, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
}
