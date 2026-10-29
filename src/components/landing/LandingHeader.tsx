"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Dumbbell, Menu, X } from "lucide-react";
import { AuthActions } from "./AuthActions";

export const NAV = [
  { id: "inicio", label: "Inicio" },
  { id: "funciones", label: "Características" },
  { id: "como-funciona", label: "Cómo funciona" },
  { id: "preguntas", label: "Preguntas" },
] as const;

export function LandingHeader() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("inicio");

  // Resalta la sección que se está viendo.
  useEffect(() => {
    const sections = NAV.map((n) => document.getElementById(n.id)).filter((el): el is HTMLElement => el !== null);
    if (!("IntersectionObserver" in window) || sections.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="lp-header">
      <div className="lp-wrap lp-header-inner">
        <Link href="/" className="lp-brand" aria-label="GYMRAT, inicio">
          <span className="lp-brand-mark">
            <Dumbbell size={22} strokeWidth={2.6} aria-hidden />
          </span>
          <span className="lp-brand-name">
            GYM<b>RAT</b>
          </span>
          <span className="lp-brand-sub">COACH PRO</span>
        </Link>

        <nav className="lp-nav" aria-label="Navegación principal">
          {NAV.map((n) => (
            <a key={n.id} href={`#${n.id}`} aria-current={active === n.id ? "true" : undefined}>
              {n.label}
            </a>
          ))}
        </nav>

        <div className="lp-actions">
          <AuthActions layout="header" />
        </div>

        <button type="button" className="lp-menu-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="lp-mobile-nav" aria-label={open ? "Cerrar menú" : "Abrir menú"}>
          {open ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
        </button>
      </div>

      {open && (
        <nav id="lp-mobile-nav" className="lp-mobile-nav" aria-label="Menú móvil">
          {NAV.map((n) => (
            <a key={n.id} href={`#${n.id}`} className="lp-m-link" onClick={() => setOpen(false)}>
              {n.label}
            </a>
          ))}
          <div className="lp-m-actions">
            <AuthActions layout="menu" onNavigate={() => setOpen(false)} />
          </div>
        </nav>
      )}
    </header>
  );
}
