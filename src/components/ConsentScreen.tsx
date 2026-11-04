"use client";

import Link from "next/link";
import { useState } from "react";
import { Dumbbell, ShieldCheck } from "lucide-react";
import type { UserProfile } from "@/lib/profile";

/** Para cuentas anteriores a la política de privacidad: se pide el consentimiento una sola vez. */
export function ConsentScreen({ profile, onAccept }: { profile: UserProfile; onAccept: (p: UserProfile) => void }) {
  const [accepted, setAccepted] = useState(false);
  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-8 sm:px-6">
      <section className="w-full rounded-2xl border border-line/70 bg-panel p-6" aria-labelledby="consent-title">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-flame text-ink" aria-hidden>
            <Dumbbell size={21} strokeWidth={2.5} />
          </span>
          <h1 id="consent-title" className="text-2xl">Antes de continuar</h1>
        </div>
        <p className="flex items-start gap-2 text-sm text-muted">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-ok" aria-hidden />
          <span>
            Hemos puesto por escrito cómo cuidamos tu información. GYMRAT guarda datos de salud (peso, medidas, entrenamiento, comidas y sueño) únicamente para calcular tus metas y mostrarte tu progreso. Puedes descargarlos o borrarlos cuando quieras desde Progreso.
          </span>
        </p>
        <label className="mt-5 flex min-h-11 items-start gap-3 rounded-xl border border-line/70 p-3 text-sm">
          <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-flame" />
          <span>
            Entiendo y acepto que GYMRAT guarde mis datos de salud como explica la{" "}
            <Link href="/privacidad" target="_blank" rel="noopener" className="underline underline-offset-2">Política de privacidad</Link> y los{" "}
            <Link href="/terminos" target="_blank" rel="noopener" className="underline underline-offset-2">Términos de uso</Link>.
          </span>
        </label>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="min-h-12 rounded-xl px-4 py-3 text-sm text-muted transition-colors duration-200 hover:text-chalk">
            No acepto, salir
          </Link>
          <button type="button" disabled={!accepted} onClick={() => onAccept({ ...profile, consentAt: new Date().toISOString() })} className="inline-flex min-h-12 items-center rounded-xl bg-flame px-7 font-display text-base uppercase tracking-[0.12em] text-ink transition-[filter] duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40">
            Continuar
          </button>
        </div>
      </section>
    </main>
  );
}
