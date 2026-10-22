"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

const KEY = "coach_theme";
const BAR_COLOR: Record<Theme, string> = { light: "#f6f2ee", dark: "#1e1a22" };

function apply(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
    m.setAttribute("content", BAR_COLOR[theme]);
    m.removeAttribute("media");
  });
}

/** Alterna entre modo claro y oscuro. Sin preferencia guardada, sigue al sistema. */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const current: Theme = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    setTheme(current);
    apply(current);

    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const onSystemChange = () => {
      try {
        if (localStorage.getItem(KEY)) return;
      } catch {
        /* sin almacenamiento: seguir al sistema */
      }
      const next: Theme = mq.matches ? "light" : "dark";
      apply(next);
      setTheme(next);
    };
    mq.addEventListener("change", onSystemChange);
    return () => mq.removeEventListener("change", onSystemChange);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    apply(next);
    setTheme(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* la preferencia no se podrá recordar */
    }
  };

  const label = theme === null ? "Cambiar tema" : theme === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro";

  return (
    <button onClick={toggle} aria-label={label} title={label} className="flex h-11 w-11 items-center justify-center rounded-sm border border-line text-muted transition-colors duration-200 hover:border-chalk hover:text-chalk">
      {theme === "light" ? <Moon size={20} aria-hidden /> : <Sun size={20} aria-hidden />}
    </button>
  );
}
