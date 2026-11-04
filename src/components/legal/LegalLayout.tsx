import Link from "next/link";
import type { ReactNode } from "react";
import { Dumbbell } from "lucide-react";
import "@/app/landing.css";

export const LEGAL_UPDATED = "2 de noviembre de 2026";

/** Contacto opcional: se configura con NEXT_PUBLIC_CONTACT_EMAIL y NEXT_PUBLIC_LEGAL_NAME. */
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL?.trim() || "";
export const LEGAL_NAME = process.env.NEXT_PUBLIC_LEGAL_NAME?.trim() || "el equipo de GYMRAT";

export function LegalLayout({ title, children, other }: { title: string; children: ReactNode; other: { href: string; label: string } }) {
  return (
    <div className="gymrat-landing">
      <header className="lp-header">
        <div className="lp-wrap lp-header-inner">
          <Link href="/" className="lp-brand" aria-label="GYMRAT, inicio">
            <span className="lp-brand-mark">
              <Dumbbell size={22} strokeWidth={2.6} aria-hidden />
            </span>
            <span className="lp-brand-name">
              GYM<b>RAT</b>
            </span>
          </Link>
          <Link href="/" className="lp-link-strong">
            Volver al inicio
          </Link>
        </div>
      </header>
      <main id="contenido" className="lp-legal">
        <p className="lp-eyebrow">Legal</p>
        <h1>{title}</h1>
        <p className="lp-updated">Última actualización: {LEGAL_UPDATED}</p>
        {children}
      </main>
      <footer className="lp-footer">
        <div className="lp-wrap lp-footer-note" style={{ display: "flex", flexWrap: "wrap", gap: "8px 24px", justifyContent: "space-between" }}>
          <span>© GYMRAT. Todos los derechos reservados.</span>
          <nav aria-label="Documentos legales" style={{ display: "flex", gap: 20 }}>
            <Link href={other.href} className="lp-link-strong" style={{ fontSize: 13 }}>
              {other.label}
            </Link>
            <Link href="/" className="lp-link-strong" style={{ fontSize: 13 }}>
              Inicio
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
